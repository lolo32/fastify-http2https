/// <reference types="node" />

import * as fastify from "fastify"
import * as http from "http"
import * as net from "net"

export declare type IncomingMessage = http.IncomingMessage
export declare type ServerResponse = http.ServerResponse

export interface Http2HttpsOptions {
    handler?: (req: IncomingMessage, res: ServerResponse) => void
    http?: boolean
}

declare const _default:
  (options?: Http2HttpsOptions) => (fastifyHandler: any, opts: fastify.ServerOptionsAsSecureHttp2) => net.Server

export default _default
