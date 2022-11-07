'use strict'

const { test } = require('tap')
const Fastify = require('fastify')
const cors = require('..')

test('Should error on invalid hook option', async (t) => {
  t.plan(1)

  const fastify = Fastify()
  t.rejects(fastify.register(cors, { hook: 'invalid' }), new TypeError('@fastify/cors: Invalid hook option provided.'))
})
