'use strict'

const fastify = require('fastify')()

const corsConfigDelegation = function (req, cb) {
  return {
    origin: 'sample.com',
    methods: 'GET',
    credentials: true,
    exposedHeaders: ['zoo', 'bar'],
    allowedHeaders: ['baz', 'foo'],
    maxAge: 321
  }
}

fastify.register((instance, opts, next) => {
  instance.register(require('../index'), corsConfigDelegation)
  instance.get('/', (req, reply) => reply.send('ok'))
  next()
})

fastify.listen({ port: 3000 })
