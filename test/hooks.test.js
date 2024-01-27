'use strict'

const { test } = require('tap')
const Fastify = require('fastify')
const kFastifyContext = require('fastify/lib/symbols').kRouteContext
const cors = require('..')

test('Should error on invalid hook option', async (t) => {
  t.plan(1)

  const fastify = Fastify()
  t.rejects(fastify.register(cors, { hook: 'invalid' }), new TypeError('@fastify/cors: Invalid hook option provided.'))
})

test('Should set hook onRequest if hook option is not set', async (t) => {
  t.plan(10)

  const fastify = Fastify()

  fastify.register(cors)

  fastify.addHook('onResponse', (request, reply, done) => {
    t.equal(request[kFastifyContext].onError, null)
    t.equal(request[kFastifyContext].onRequest.length, 1)
    t.equal(request[kFastifyContext].onSend, null)
    t.equal(request[kFastifyContext].preHandler, null)
    t.equal(request[kFastifyContext].preParsing, null)
    t.equal(request[kFastifyContext].preSerialization, null)
    t.equal(request[kFastifyContext].preValidation, null)
    done()
  })

  fastify.get('/', (req, reply) => {
    reply.send('ok')
  })

  await fastify.ready()

  const res = await fastify.inject({
    method: 'GET',
    url: '/'
  })
  delete res.headers.date
  t.equal(res.statusCode, 200)
  t.equal(res.payload, 'ok')
  t.match(res.headers, {
    'access-control-allow-origin': '*'
  })
})

test('Should set hook onRequest if hook option is set to onRequest', async (t) => {
  t.plan(10)

  const fastify = Fastify()

  fastify.register(cors, {
    hook: 'onRequest'
  })

  fastify.addHook('onResponse', (request, reply, done) => {
    t.equal(request[kFastifyContext].onError, null)
    t.equal(request[kFastifyContext].onRequest.length, 1)
    t.equal(request[kFastifyContext].onSend, null)
    t.equal(request[kFastifyContext].preHandler, null)
    t.equal(request[kFastifyContext].preParsing, null)
    t.equal(request[kFastifyContext].preSerialization, null)
    t.equal(request[kFastifyContext].preValidation, null)
    done()
  })

  fastify.get('/', (req, reply) => {
    reply.send('ok')
  })

  await fastify.ready()

  const res = await fastify.inject({
    method: 'GET',
    url: '/'
  })
  delete res.headers.date
  t.equal(res.statusCode, 200)
  t.equal(res.payload, 'ok')
  t.match(res.headers, {
    'access-control-allow-origin': '*'
  })
})

test('Should set hook preParsing if hook option is set to preParsing', async (t) => {
  t.plan(11)

  const fastify = Fastify()

  fastify.register(cors, {
    hook: 'preParsing'
  })

  fastify.addHook('onResponse', (request, reply, done) => {
    t.equal(request[kFastifyContext].onError, null)
    t.equal(request[kFastifyContext].onRequest, null)
    t.equal(request[kFastifyContext].onSend, null)
    t.equal(request[kFastifyContext].preHandler, null)
    t.equal(request[kFastifyContext].preParsing.length, 1)
    t.equal(request[kFastifyContext].preSerialization, null)
    t.equal(request[kFastifyContext].preValidation, null)
    done()
  })

  fastify.get('/', (req, reply) => {
    reply.send('ok')
  })

  await fastify.ready()

  const res = await fastify.inject({
    method: 'GET',
    url: '/'
  })
  delete res.headers.date
  t.equal(res.statusCode, 200)
  t.equal(res.payload, 'ok')
  t.match(res.headers, {
    'access-control-allow-origin': '*'
  })
  t.notMatch(res.headers, { vary: 'Origin' })
})

test('Should set hook preValidation if hook option is set to preValidation', async (t) => {
  t.plan(11)

  const fastify = Fastify()

  fastify.register(cors, {
    hook: 'preValidation'
  })

  fastify.addHook('onResponse', (request, reply, done) => {
    t.equal(request[kFastifyContext].onError, null)
    t.equal(request[kFastifyContext].onRequest, null)
    t.equal(request[kFastifyContext].onSend, null)
    t.equal(request[kFastifyContext].preHandler, null)
    t.equal(request[kFastifyContext].preParsing, null)
    t.equal(request[kFastifyContext].preSerialization, null)
    t.equal(request[kFastifyContext].preValidation.length, 1)
    done()
  })

  fastify.get('/', (req, reply) => {
    reply.send('ok')
  })

  await fastify.ready()

  const res = await fastify.inject({
    method: 'GET',
    url: '/'
  })
  delete res.headers.date
  t.equal(res.statusCode, 200)
  t.equal(res.payload, 'ok')
  t.match(res.headers, {
    'access-control-allow-origin': '*'
  })
  t.notMatch(res.headers, { vary: 'Origin' })
})

test('Should set hook preParsing if hook option is set to preParsing', async (t) => {
  t.plan(11)

  const fastify = Fastify()

  fastify.register(cors, {
    hook: 'preParsing'
  })

  fastify.addHook('onResponse', (request, reply, done) => {
    t.equal(request[kFastifyContext].onError, null)
    t.equal(request[kFastifyContext].onRequest, null)
    t.equal(request[kFastifyContext].onSend, null)
    t.equal(request[kFastifyContext].preHandler, null)
    t.equal(request[kFastifyContext].preParsing.length, 1)
    t.equal(request[kFastifyContext].preSerialization, null)
    t.equal(request[kFastifyContext].preValidation, null)
    done()
  })

  fastify.get('/', (req, reply) => {
    reply.send('ok')
  })

  await fastify.ready()

  const res = await fastify.inject({
    method: 'GET',
    url: '/'
  })
  delete res.headers.date
  t.equal(res.statusCode, 200)
  t.equal(res.payload, 'ok')
  t.match(res.headers, {
    'access-control-allow-origin': '*'
  })
  t.notMatch(res.headers, { vary: 'Origin' })
})

test('Should set hook preHandler if hook option is set to preHandler', async (t) => {
  t.plan(11)

  const fastify = Fastify()

  fastify.register(cors, {
    hook: 'preHandler'
  })

  fastify.addHook('onResponse', (request, reply, done) => {
    t.equal(request[kFastifyContext].onError, null)
    t.equal(request[kFastifyContext].onRequest, null)
    t.equal(request[kFastifyContext].onSend, null)
    t.equal(request[kFastifyContext].preHandler.length, 1)
    t.equal(request[kFastifyContext].preParsing, null)
    t.equal(request[kFastifyContext].preSerialization, null)
    t.equal(request[kFastifyContext].preValidation, null)
    done()
  })

  fastify.get('/', (req, reply) => {
    reply.send('ok')
  })

  await fastify.ready()

  const res = await fastify.inject({
    method: 'GET',
    url: '/'
  })
  delete res.headers.date
  t.equal(res.statusCode, 200)
  t.equal(res.payload, 'ok')
  t.match(res.headers, {
    'access-control-allow-origin': '*'
  })
  t.notMatch(res.headers, { vary: 'Origin' })
})

test('Should set hook onSend if hook option is set to onSend', async (t) => {
  t.plan(11)

  const fastify = Fastify()

  fastify.register(cors, {
    hook: 'onSend'
  })

  fastify.addHook('onResponse', (request, reply, done) => {
    t.equal(request[kFastifyContext].onError, null)
    t.equal(request[kFastifyContext].onRequest, null)
    t.equal(request[kFastifyContext].onSend.length, 1)
    t.equal(request[kFastifyContext].preHandler, null)
    t.equal(request[kFastifyContext].preParsing, null)
    t.equal(request[kFastifyContext].preSerialization, null)
    t.equal(request[kFastifyContext].preValidation, null)
    done()
  })

  fastify.get('/', (req, reply) => {
    reply.send('ok')
  })

  await fastify.ready()

  const res = await fastify.inject({
    method: 'GET',
    url: '/'
  })
  delete res.headers.date
  t.equal(res.statusCode, 200)
  t.equal(res.payload, 'ok')
  t.match(res.headers, {
    'access-control-allow-origin': '*'
  })
  t.notMatch(res.headers, { vary: 'Origin' })
})

test('Should set hook preSerialization if hook option is set to preSerialization', async (t) => {
  t.plan(11)

  const fastify = Fastify()

  fastify.register(cors, {
    hook: 'preSerialization'
  })

  fastify.addHook('onResponse', (request, reply, done) => {
    t.equal(request[kFastifyContext].onError, null)
    t.equal(request[kFastifyContext].onRequest, null)
    t.equal(request[kFastifyContext].onSend, null)
    t.equal(request[kFastifyContext].preHandler, null)
    t.equal(request[kFastifyContext].preParsing, null)
    t.equal(request[kFastifyContext].preSerialization.length, 1)
    t.equal(request[kFastifyContext].preValidation, null)
    done()
  })

  fastify.get('/', (req, reply) => {
    reply.send({ nonString: true })
  })

  await fastify.ready()

  const res = await fastify.inject({
    method: 'GET',
    url: '/'
  })
  delete res.headers.date
  t.equal(res.statusCode, 200)
  t.equal(res.payload, '{"nonString":true}')
  t.match(res.headers, {
    'access-control-allow-origin': '*'
  })
  t.notMatch(res.headers, { vary: 'Origin' })
})

test('Should support custom hook with dynamic config', t => {
  t.plan(16)

  const configs = [{
    origin: 'example.com',
    methods: 'GET',
    credentials: true,
    exposedHeaders: ['foo', 'bar'],
    allowedHeaders: ['baz', 'woo'],
    maxAge: 123
  }, {
    origin: 'sample.com',
    methods: 'GET',
    credentials: true,
    exposedHeaders: ['zoo', 'bar'],
    allowedHeaders: ['baz', 'foo'],
    maxAge: 321
  }]

  const fastify = Fastify()
  let requestId = 0
  const configDelegation = function (req, cb) {
    // request should have id
    t.ok(req.id)
    // request should not have send
    t.notOk(req.send)
    const config = configs[requestId]
    requestId++
    if (config) {
      cb(null, config)
    } else {
      cb(new Error('ouch'))
    }
  }
  fastify.register(cors, {
    hook: 'preHandler',
    delegator: configDelegation
  })

  fastify.get('/', (req, reply) => {
    reply.send('ok')
  })

  fastify.inject({
    method: 'GET',
    url: '/'
  }, (err, res) => {
    t.error(err)
    delete res.headers.date
    t.equal(res.statusCode, 200)
    t.equal(res.payload, 'ok')
    t.match(res.headers, {
      'access-control-allow-origin': 'example.com',
      'access-control-allow-credentials': 'true',
      'access-control-expose-headers': 'foo, bar',
      'content-length': '2',
      vary: 'Origin'
    })
  })

  fastify.inject({
    method: 'OPTIONS',
    url: '/',
    headers: {
      'access-control-request-method': 'GET',
      origin: 'example.com'
    }
  }, (err, res) => {
    t.error(err)
    delete res.headers.date
    t.equal(res.statusCode, 204)
    t.equal(res.payload, '')
    t.match(res.headers, {
      'access-control-allow-origin': 'sample.com',
      'access-control-allow-credentials': 'true',
      'access-control-expose-headers': 'zoo, bar',
      'access-control-allow-methods': 'GET',
      'access-control-allow-headers': 'baz, foo',
      'access-control-max-age': '321',
      'content-length': '0',
      vary: 'Origin'
    })
  })

  fastify.inject({
    method: 'GET',
    url: '/',
    headers: {
      'access-control-request-method': 'GET',
      origin: 'example.com'
    }
  }, (err, res) => {
    t.error(err)
    t.equal(res.statusCode, 500)
  })
})

test('Should support custom hook with dynamic config (callback)', t => {
  t.plan(16)

  const configs = [{
    origin: 'example.com',
    methods: 'GET',
    credentials: true,
    exposedHeaders: ['foo', 'bar'],
    allowedHeaders: ['baz', 'woo'],
    maxAge: 123
  }, {
    origin: 'sample.com',
    methods: 'GET',
    credentials: true,
    exposedHeaders: ['zoo', 'bar'],
    allowedHeaders: ['baz', 'foo'],
    maxAge: 321
  }]

  const fastify = Fastify()
  let requestId = 0
  const configDelegation = function (req, cb) {
    // request should have id
    t.ok(req.id)
    // request should not have send
    t.notOk(req.send)
    const config = configs[requestId]
    requestId++
    if (config) {
      cb(null, config)
    } else {
      cb(new Error('ouch'))
    }
  }
  fastify.register(cors, {
    hook: 'preParsing',
    delegator: configDelegation
  })

  fastify.get('/', (req, reply) => {
    reply.send('ok')
  })

  fastify.inject({
    method: 'GET',
    url: '/'
  }, (err, res) => {
    t.error(err)
    delete res.headers.date
    t.equal(res.statusCode, 200)
    t.equal(res.payload, 'ok')
    t.match(res.headers, {
      'access-control-allow-origin': 'example.com',
      'access-control-allow-credentials': 'true',
      'access-control-expose-headers': 'foo, bar',
      'content-length': '2',
      vary: 'Origin'
    })
  })

  fastify.inject({
    method: 'OPTIONS',
    url: '/',
    headers: {
      'access-control-request-method': 'GET',
      origin: 'example.com'
    }
  }, (err, res) => {
    t.error(err)
    delete res.headers.date
    t.equal(res.statusCode, 204)
    t.equal(res.payload, '')
    t.match(res.headers, {
      'access-control-allow-origin': 'sample.com',
      'access-control-allow-credentials': 'true',
      'access-control-expose-headers': 'zoo, bar',
      'access-control-allow-methods': 'GET',
      'access-control-allow-headers': 'baz, foo',
      'access-control-max-age': '321',
      'content-length': '0',
      vary: 'Origin'
    })
  })

  fastify.inject({
    method: 'GET',
    url: '/',
    headers: {
      'access-control-request-method': 'GET',
      origin: 'example.com'
    }
  }, (err, res) => {
    t.error(err)
    t.equal(res.statusCode, 500)
  })
})

test('Should support custom hook with dynamic config (Promise)', t => {
  t.plan(16)

  const configs = [{
    origin: 'example.com',
    methods: 'GET',
    credentials: true,
    exposedHeaders: ['foo', 'bar'],
    allowedHeaders: ['baz', 'woo'],
    maxAge: 123
  }, {
    origin: 'sample.com',
    methods: 'GET',
    credentials: true,
    exposedHeaders: ['zoo', 'bar'],
    allowedHeaders: ['baz', 'foo'],
    maxAge: 321
  }]

  const fastify = Fastify()
  let requestId = 0
  const configDelegation = function (req) {
    // request should have id
    t.ok(req.id)
    // request should not have send
    t.notOk(req.send)
    const config = configs[requestId]
    requestId++
    if (config) {
      return Promise.resolve(config)
    } else {
      return Promise.reject(new Error('ouch'))
    }
  }

  fastify.register(cors, {
    hook: 'preParsing',
    delegator: configDelegation
  })

  fastify.get('/', (req, reply) => {
    reply.send('ok')
  })

  fastify.inject({
    method: 'GET',
    url: '/'
  }, (err, res) => {
    t.error(err)
    delete res.headers.date
    t.equal(res.statusCode, 200)
    t.equal(res.payload, 'ok')
    t.match(res.headers, {
      'access-control-allow-origin': 'example.com',
      'access-control-allow-credentials': 'true',
      'access-control-expose-headers': 'foo, bar',
      'content-length': '2',
      vary: 'Origin'
    })
  })

  fastify.inject({
    method: 'OPTIONS',
    url: '/',
    headers: {
      'access-control-request-method': 'GET',
      origin: 'example.com'
    }
  }, (err, res) => {
    t.error(err)
    delete res.headers.date
    t.equal(res.statusCode, 204)
    t.equal(res.payload, '')
    t.match(res.headers, {
      'access-control-allow-origin': 'sample.com',
      'access-control-allow-credentials': 'true',
      'access-control-expose-headers': 'zoo, bar',
      'access-control-allow-methods': 'GET',
      'access-control-allow-headers': 'baz, foo',
      'access-control-max-age': '321',
      'content-length': '0',
      vary: 'Origin'
    })
  })

  fastify.inject({
    method: 'GET',
    url: '/',
    headers: {
      'access-control-request-method': 'GET',
      origin: 'example.com'
    }
  }, (err, res) => {
    t.error(err)
    t.equal(res.statusCode, 500)
  })
})

test('Should support custom hook with dynamic config (Promise), but should error /1', t => {
  t.plan(6)

  const fastify = Fastify()
  const configDelegation = function () {
    return false
  }

  fastify.register(cors, {
    hook: 'preParsing',
    delegator: configDelegation
  })

  fastify.get('/', (req, reply) => {
    reply.send('ok')
  })

  fastify.inject({
    method: 'OPTIONS',
    url: '/',
    headers: {
      'access-control-request-method': 'GET',
      origin: 'example.com'
    }
  }, (err, res) => {
    t.error(err)
    delete res.headers.date
    t.equal(res.statusCode, 500)
    t.equal(res.payload, '{"statusCode":500,"error":"Internal Server Error","message":"Invalid CORS origin option"}')
    t.match(res.headers, {
      'content-length': '89'
    })
  })

  fastify.inject({
    method: 'GET',
    url: '/',
    headers: {
      'access-control-request-method': 'GET',
      origin: 'example.com'
    }
  }, (err, res) => {
    t.error(err)
    t.equal(res.statusCode, 500)
  })
})

test('Should support custom hook with dynamic config (Promise), but should error /2', t => {
  t.plan(6)

  const fastify = Fastify()
  const configDelegation = function () {
    return false
  }

  fastify.register(cors, {
    delegator: configDelegation
  })

  fastify.get('/', (req, reply) => {
    reply.send('ok')
  })

  fastify.inject({
    method: 'OPTIONS',
    url: '/',
    headers: {
      'access-control-request-method': 'GET',
      origin: 'example.com'
    }
  }, (err, res) => {
    t.error(err)
    delete res.headers.date
    t.equal(res.statusCode, 500)
    t.equal(res.payload, '{"statusCode":500,"error":"Internal Server Error","message":"Invalid CORS origin option"}')
    t.match(res.headers, {
      'content-length': '89'
    })
  })

  fastify.inject({
    method: 'GET',
    url: '/',
    headers: {
      'access-control-request-method': 'GET',
      origin: 'example.com'
    }
  }, (err, res) => {
    t.error(err)
    t.equal(res.statusCode, 500)
  })
})
