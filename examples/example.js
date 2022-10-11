'use strict'

const fastify = require('fastify')()

fastify.register((instance, opts, next) => {
  instance.register(require('../index'))
  instance.get('/', (req, reply) => reply.send('ok'))
  next()
})

fastify.listen({ port: 3000 })
