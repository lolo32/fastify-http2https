import * as fastify from "fastify"
import * as http from "http"
import * as http2 from "http2"
import * as https from "https"
import * as net from "net"

export type IncomingMessage = http.IncomingMessage
export type ServerResponse = http.ServerResponse

export interface Http2HttpsOptions {
  handler?: (req: IncomingMessage, res: ServerResponse) => void
  http?: boolean
}

export default (options: Http2HttpsOptions = {}) => {
  // Default function that redirect clear request to encrypted
  const httpsRedirect = (req: http.IncomingMessage, res: http.ServerResponse) => {
    const host = req.headers.host
    res.writeHead(301, {Location: `https://${host}${req.url}`})
    res.end()
  }

  return (fastifyHandler: any, opts: fastify.ServerOptionsAsSecureHttp2): net.Server => {
    // Ask to use Fastify's internal handle
    if (options.http) {
      options.handler = fastifyHandler
    }

    // Using user defined http handler
    const httpHandler = options.handler || httpsRedirect

    // Define the two handler (http and https)
    let secur: https.Server | http2.Http2SecureServer
    const clear = http.createServer(httpHandler)

    if (opts.http2) {
      // If HTTP2 if asked
      secur = http2.createSecureServer(opts.https, fastifyHandler)
    } else {
      // Else
      secur = https.createServer(opts.https, fastifyHandler)
    }

    // Create the server (TCP only) that will be used to check if HTTP or HTTPS is used
    return net.createServer((socket) => {
      socket.once("data", (buffer) => {
        // Pause the socket
        socket.pause()

        // Determine if this is an HTTP(s) request
        const byte = buffer[0]

        let proxy
        if (byte === 22) {
          // If it begin with 0x16, it's HTTPS
          proxy = secur
        } else if (32 < byte && byte < 127) {
          // If it begin with ASCII character, seems to be some HTTP
          proxy = clear
        }

        if (proxy) {
          // Push the buffer back onto the front of the data stream
          socket.unshift(buffer)

          // Emit the socket to the HTTP(s) server
          proxy.emit("connection", socket)
        }

        // As of NodeJS 10.x the socket must be
        // resumed asynchronously or the socket
        // connection hangs, potentially crashing
        // the process. Prior to NodeJS 10.x
        // the socket may be resumed synchronously.
        process.nextTick(() => socket.resume())
      })
    })
  }
}
