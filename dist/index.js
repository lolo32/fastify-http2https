var http = require("http");
var http2 = require("http2");
var https = require("https");
var net = require("net");

exports.default = (function (options) {
    if (options === void 0) { options = {}; }
    var httpsRedirect = function (req, res) {
        var host = req.headers.host;
        res.writeHead(301, { Location: "https://" + host + req.url });
        res.end();
    };
    return function (fastifyHandler, opts) {
        if (options.http) {
            options.handler = fastifyHandler;
        }
        var httpHandler = options.handler || httpsRedirect;
        var secur;
        var clear = http.default.createServer(httpHandler);
        if (opts.http2) {
            secur = http2.default.createSecureServer(opts.https, fastifyHandler);
        }
        else {
            secur = https.default.createServer(opts.https, fastifyHandler);
        }
        return net.default.createServer(function (socket) {
            socket.once("data", function (buffer) {
                socket.pause();
                var byte = buffer[0];
                var proxy;
                if (byte === 22) {
                    proxy = secur;
                }
                else if (32 < byte && byte < 127) {
                    proxy = clear;
                }
                if (proxy) {
                    socket.unshift(buffer);
                    proxy.emit("connection", socket);
                }
                process.nextTick(function () { return socket.resume(); });
            });
        });
    };
});
