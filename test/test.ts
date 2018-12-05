import fastify, {FastifyInstance} from "fastify"
import {readFileSync} from "fs"
import * as http from "http"
import "mocha"
import {AddressInfo} from "net"
import supertest from "supertest"
import http2https from "../index"

// Disable self-signed certificate check
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0"

suite("TypeScript", () => {
  suite("Without configuration, HTTP → HTTPS", () => {
    let app: FastifyInstance<http.Server, http.IncomingMessage, http.ServerResponse>

    suiteSetup(async () => {
      app = fastify({
        https: {
          cert: readFileSync(__dirname + "/cert.pem"),
          key: readFileSync(__dirname + "/key.pem")
        },
        // @ts-ignore
        serverFactory: http2https()
      })

      app.get("/", (request: any, reply: any) => {
        reply.send({hello: "https"})
      })

      await app.listen(0)
    })

    suiteTeardown(() => {
      app.close(() => {
      })
    })

    test("Should redirect to HTTPS", (done) => {
      const address = (app.server.address() as AddressInfo).address
      const port = (app.server.address() as AddressInfo).port
      supertest(`http://${address}:${port}`)
        .get("/")
        .expect(301)
        .expect("location", `https://${address}:${port}/`, done)
    })

    test("Should redirect to HTTPS, conserving URL", (done) => {
      const address = (app.server.address() as AddressInfo).address
      const port = (app.server.address() as AddressInfo).port
      supertest(`http://${address}:${port}`)
        .get("/Some/Url")
        .expect(301)
        .expect("location", `https://${address}:${port}/Some/Url`, done)
    })

    test("Should redirect to HTTPS, query parameters", (done) => {
      const address = (app.server.address() as AddressInfo).address
      const port = (app.server.address() as AddressInfo).port
      supertest(`http://${address}:${port}`)
        .get("/Some/Url?quer=ry")
        .expect(301)
        .expect("location", `https://${address}:${port}/Some/Url?quer=ry`, done)
    })

  })

  suite("With http:true option, work both at same time, HTTP and HTTPS", () => {
    let app: FastifyInstance<http.Server, http.IncomingMessage, http.ServerResponse>
    const response = {hello: "https", and: "http"}

    suiteSetup(async () => {
      app = fastify({
        https: {
          cert: readFileSync(__dirname + "/cert.pem"),
          key: readFileSync(__dirname + "/key.pem")
        },
        // @ts-ignore
        serverFactory: http2https({http: true})
      })

      app.get("/", (request: any, reply: any) => {
        reply.send(response)
      })

      app.get("/toto", (request: any, reply: any) => {
        reply.send("titi")
      })

      await app.listen(0)
    })

    suiteTeardown(() => {
      app.close(() => {
      })
    })

    test("Should respond to HTTP request", (done) => {
      const address = (app.server.address() as AddressInfo).address
      const port = (app.server.address() as AddressInfo).port
      supertest(`http://${address}:${port}`)
        .get("/")
        .expect(200)
        .expect("Content-Type", /^application\/json/)
        .expect(response, done)
    })
    test("Should respond to HTTPS request", (done) => {
      const address = (app.server.address() as AddressInfo).address
      const port = (app.server.address() as AddressInfo).port
      supertest(`https://${address}:${port}`)
        .get("/")
        .expect(200)
        .expect("Content-Type", /^application\/json/)
        .expect(response, done)
    })
    test("Should respond to HTTPS and HTTP request", () => {
      const address = (app.server.address() as AddressInfo).address
      const port = (app.server.address() as AddressInfo).port
      return supertest(`http://${address}:${port}`)
        .get("/toto")
        .expect(200)
        .expect("Content-Type", /^text\/plain/)
        .expect("titi")
        .then(() =>
          supertest(`https://${address}:${port}`)
            .get("/toto")
            .expect(200)
            .expect("Content-Type", /^text\/plain/)
            .expect("titi")
        )
    })
  })

  suite("With http:true and http2:true option, work both at same time, HTTP and HTTPS", () => {
    let app: FastifyInstance<http.Server, http.IncomingMessage, http.ServerResponse>
    const response = {hello: "https", and: "http"}

    suiteSetup(async () => {
      app = fastify({
        http2: true,
        https: {
          allowHTTP1: true, // fallback support for HTTP1
          cert: readFileSync(__dirname + "/cert.pem"),
          key: readFileSync(__dirname + "/key.pem")
        },
        // @ts-ignore
        serverFactory: http2https({http: true})
      })

      app.get("/", (request: any, reply: any) => {
        reply.send(response)
      })

      app.get("/toto", (request: any, reply: any) => {
        reply.send("titi")
      })

      await app.listen(0)
    })

    suiteTeardown(() => {
      app.close(() => {
      })
    })

    test("Should respond to HTTP request", (done) => {
      const address = (app.server.address() as AddressInfo).address
      const port = (app.server.address() as AddressInfo).port
      supertest(`http://${address}:${port}`)
        .get("/")
        .expect(200)
        .expect("Content-Type", /^application\/json/)
        .expect(response, done)
    })
    test("Should respond to HTTPS request", (done) => {
      const address = (app.server.address() as AddressInfo).address
      const port = (app.server.address() as AddressInfo).port
      supertest(`https://${address}:${port}`)
        .get("/")
        .expect(200)
        .expect("Content-Type", /^application\/json/)
        .expect(response, done)
    })
    test("Should respond to HTTPS and HTTP request", () => {
      const address = (app.server.address() as AddressInfo).address
      const port = (app.server.address() as AddressInfo).port
      return supertest(`http://${address}:${port}`)
        .get("/toto")
        .expect(200)
        .expect("Content-Type", /^text\/plain/)
        .expect("titi")
        .then(() =>
          supertest(`https://${address}:${port}`)
            .get("/toto")
            .expect(200)
            .expect("Content-Type", /^text\/plain/)
            .expect("titi")
        )
    })
  })

  suite("Handle custom response on HTTP, different from HTTPS (fastify)", () => {
    let app: FastifyInstance<http.Server, http.IncomingMessage, http.ServerResponse>
    const response = {hello: "https", and: "http"}

    suiteSetup(async () => {
      app = fastify({
        https: {
          cert: readFileSync(__dirname + "/cert.pem"),
          key: readFileSync(__dirname + "/key.pem")
        },
        // @ts-ignore
        serverFactory: http2https({
          handler: (req, res) => {
            res.writeHead(200, {"Content-Type": "text/plain"})
            res.write("Hello World from http!")
            res.end()
          }
        })
      })

      app.get("/", (request: any, reply: any) => {
        reply.send(response)
      })

      await app.listen(0)
    })

    suiteTeardown(() => {
      app.close(() => {
      })
    })

    test("Should respond custom handler to HTTP request", (done) => {
      const address = (app.server.address() as AddressInfo).address
      const port = (app.server.address() as AddressInfo).port
      supertest(`http://${address}:${port}`)
        .get("/")
        .expect(200)
        .expect("Content-Type", /^text\/plain/)
        .expect("Hello World from http!", done)
    })
    test("Should ignore Fastify routes", (done) => {
      const address = (app.server.address() as AddressInfo).address
      const port = (app.server.address() as AddressInfo).port
      supertest(`http://${address}:${port}`)
        .get("/tata")
        .expect(200)
        .expect("Content-Type", /^text\/plain/)
        .expect("Hello World from http!", done)
    })
    test("Should respond to HTTPS and HTTP request", () => {
      const address = (app.server.address() as AddressInfo).address
      const port = (app.server.address() as AddressInfo).port
      return supertest(`https://${address}:${port}`)
        .get("/toto")
        .expect(404)
        .expect("Content-Type", /^application\/json/)
        .then(() =>
          supertest(`http://${address}:${port}`)
            .get("/toto")
            .expect(200)
            .expect("Content-Type", /^text\/plain/)
            .expect("Hello World from http!")
        )
    })
  })
})
