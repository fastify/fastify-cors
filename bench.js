'use strict'

const fastify = require('fastify')()

fastify.register((instance, opts, next) => {
  instance.register(require('./index'))
  instance.get('/fastify', (req, reply) => reply.send('ok'))
  next()
})

fastify.register((instance, opts, next) => {
  instance.use(require('cors')())
  instance.get('/express', (req, reply) => reply.send('ok'))
  next()
})

fastify.listen(3000)
