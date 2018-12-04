'use strict'
const {readFileSync} = require("fs")

const fastify = require('fastify')(
  {
    https: {
      cert: readFileSync(__dirname + "/cert.pem"),
      key: readFileSync(__dirname + "/key.pem")
    },
    logger: false,
    serverFactory: require("..")()
  }
)

const schema = {
  schema: {
    response: {
      200: {
        type: 'object',
        properties: {
          hello: {
            type: 'string'
          }
        }
      }
    }
  }
}

fastify
  .get('/', schema, function (req, reply) {
    reply
      .send({ hello: 'world' })
  })

fastify.listen(3000, (err, address) => {
  if (err) throw err
  fastify.log.info(`server listening on ${address}`)
})
