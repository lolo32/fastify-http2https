# Fastify-Http2Https

This plugin redirect all requests that come to the port where `Fastify` listen, if the
query if in `http`, and send back a `301 Moved Permanently` to the same port,
same hostname, but this time with `https`.

It works with `http/2` if configured (for `https` only), or `http/1` if not enabled.

## Usage

### Installation

`npm i fastify-http2https`

### Remarques

All options in `https` is literally passed to `https.createServer` or
`http2.createSecureServer`.

## Exemple

### Options

* `http` it’s a boolean that indicate if it need to respond to http like https:

  - `true` respond with `Fastify`, the same way that `https` is configured
  - `false` (default) redirect or possibility to specify a custom handler

* `handler` can be used to specify a custom handler for http requests. The callback
  used is:
  ```javascript
  // Example
  function (req, res) {
    res.writeHead(200, {"Content-Type": "text/plain"})
    res.write("Hello World!")
    res.end()
  }
  ```
  With `req` a Node [http.IncomingMessage](https://nodejs.org/api/http.html#http_class_http_incomingmessage) and
  `res` a [http.ServerResponse](https://nodejs.org/api/http.html#http_class_http_serverresponse).

### HTTP/1

Typical options

```javascript
{
  https: {
    cert: readFileSync(__dirname + "/cert.pem"),
    key: readFileSync(__dirname + "/key.pem")
  },
  serverFactory: require("fastify-http2https")()
}
```

### HTTP/2

Typical options

```javascript
{
  http2: true,
  https: {
    allowHTTP1: true, // fallback support for HTTP1, not needed
    cert: readFileSync(__dirname + "/cert.pem"),
    key: readFileSync(__dirname + "/key.pem")
  },
  serverFactory: require("fastify-http2https")()
}
```

### Full exemple

Code

```javascript
const http2https = require("fastify-http2https")
const fastify = require("fastify")

// Send Hello World! on HTTP, work normally on HTTPS
const http2httpsOptionsHelloWorld = {
  handler: function(req, res) {
    res.writeHead(200, {"Content-Type": "text/plain"})
    res.write("Hello World!")
    res.end()
  }
}

// Send fastify's response over HTTP and HTTPS
const http2httpsOptionsHttpToo = {
  http: true
}

// Redirect HTTP to HTTPS
const http2httpsOptionsRedirect = {} // or {http: false}

const app = fastify({
  http2: true,
  https: {
    allowHTTP1: true, // fallback support for HTTP1
    cert: readFileSync(__dirname + "/cert.pem"),
    key: readFileSync(__dirname + "/key.pem")
  },
  serverFactory: http2https(
    // http2httpsOptionsRedirect
    // http2httpsOptionsHttpToo
    // http2httpsOptionsHelloWorld
  )
})

app.get("/", function (request, reply) {
  reply.send({hello: "https"})
})

app.listen(3000, function (err, address) {
  if (err) {
    throw err
  }

  app.log.info("server listening on " + address)
})
```

Results

* Using nothing (default) or `http2httpsOptionsRedirect`

  Now, all requests to `http://localhost:3000/some/thing?or=not`
  are regirected to `http://localhost:3000/some/thing?or=not`
  with a `301 Moved Permanently`.

* Using `http2httpsOptionsHttpToo`

  Both HTTP and HTTPS send the same, work with `Fastify` instance, all
  without any redirection.

* Using `http2httpsOptionsHelloWorld`

  To respond to HTTP requests, the user's define callback will be used.
  HTTPS is responded by `Fastify`.
`
