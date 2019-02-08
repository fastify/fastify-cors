'use strict'

const { test } = require('tap')
const Fastify = require('fastify')
const cors = require('../index')

test('Should shortcircuits preflight requests', t => {
  t.plan(4)

  const fastify = Fastify()
  fastify.register(cors)

  fastify.options('/', (req, reply) => {
    t.fail('we should not be here')
  })

  fastify.inject({
    method: 'OPTIONS',
    url: '/'
  }, (err, res) => {
    t.error(err)
    delete res.headers.date
    t.strictEqual(res.statusCode, 204)
    t.strictEqual(res.payload, '')
    t.deepEqual({
      'access-control-allow-origin': '*',
      'access-control-allow-methods': 'GET,HEAD,PUT,PATCH,POST,DELETE',
      vary: 'Access-Control-Request-Headers',
      'content-length': '0',
      connection: 'keep-alive'
    }, res.headers)
  })
})

test('Should shortcircuits preflight requests with custom status code', t => {
  t.plan(4)

  const fastify = Fastify()
  fastify.register(cors, { optionsSuccessStatus: 200 })

  fastify.options('/', (req, reply) => {
    t.fail('we should not be here')
  })

  fastify.inject({
    method: 'OPTIONS',
    url: '/'
  }, (err, res) => {
    t.error(err)
    delete res.headers.date
    t.strictEqual(res.statusCode, 200)
    t.strictEqual(res.payload, '')
    t.deepEqual({
      'access-control-allow-origin': '*',
      'access-control-allow-methods': 'GET,HEAD,PUT,PATCH,POST,DELETE',
      vary: 'Access-Control-Request-Headers',
      'content-length': '0',
      connection: 'keep-alive'
    }, res.headers)
  })
})

test('Should not shortcircuits preflight requests with preflightContinue', t => {
  t.plan(4)

  const fastify = Fastify()
  fastify.register(cors, { preflightContinue: true })

  fastify.options('/', (req, reply) => {
    reply.send('ok')
  })

  fastify.inject({
    method: 'OPTIONS',
    url: '/'
  }, (err, res) => {
    t.error(err)
    delete res.headers.date
    t.strictEqual(res.statusCode, 200)
    t.strictEqual(res.payload, 'ok')
    t.deepEqual({
      'access-control-allow-origin': '*',
      'access-control-allow-methods': 'GET,HEAD,PUT,PATCH,POST,DELETE',
      vary: 'Access-Control-Request-Headers',
      'content-length': '2',
      'content-type': 'text/plain; charset=utf-8',
      connection: 'keep-alive'
    }, res.headers)
  })
})

test('Should create a options wildcard', t => {
  t.plan(4)

  const fastify = Fastify()
  fastify.register(cors)

  fastify.inject({
    method: 'OPTIONS',
    url: '/hello'
  }, (err, res) => {
    t.error(err)
    delete res.headers.date
    t.strictEqual(res.statusCode, 204)
    t.strictEqual(res.payload, '')
    t.deepEqual({
      'access-control-allow-origin': '*',
      'access-control-allow-methods': 'GET,HEAD,PUT,PATCH,POST,DELETE',
      vary: 'Access-Control-Request-Headers',
      'content-length': '0',
      connection: 'keep-alive'
    }, res.headers)
  })
})

test('Should create a options wildcard (with prefix)', t => {
  t.plan(6)

  const fastify = Fastify()
  fastify.register((instance, opts, next) => {
    instance.register(cors)
    next()
  }, { prefix: '/subsystem' })

  fastify.inject({
    method: 'OPTIONS',
    url: '/hello'
  }, (err, res) => {
    t.error(err)
    t.strictEqual(res.statusCode, 404)
  })

  fastify.inject({
    method: 'OPTIONS',
    url: '/subsystem/hello'
  }, (err, res) => {
    t.error(err)
    delete res.headers.date
    t.strictEqual(res.statusCode, 204)
    t.strictEqual(res.payload, '')
    t.deepEqual({
      'access-control-allow-origin': '*',
      'access-control-allow-methods': 'GET,HEAD,PUT,PATCH,POST,DELETE',
      vary: 'Access-Control-Request-Headers',
      'content-length': '0',
      connection: 'keep-alive'
    }, res.headers)
  })
})

test('Should add cors headers', t => {
  t.plan(4)

  const fastify = Fastify()
  fastify.register(cors)

  fastify.get('/', (req, reply) => {
    reply.send('ok')
  })

  fastify.inject({
    method: 'GET',
    url: '/'
  }, (err, res) => {
    t.error(err)
    delete res.headers.date
    t.strictEqual(res.statusCode, 200)
    t.strictEqual(res.payload, 'ok')
    t.deepEqual({
      'access-control-allow-origin': '*',
      'content-length': '2',
      'content-type': 'text/plain; charset=utf-8',
      connection: 'keep-alive'
    }, res.headers)
  })
})

test('Should add cors headers (custom values)', t => {
  t.plan(8)

  const fastify = Fastify()
  fastify.register(cors, {
    origin: 'example.com',
    methods: 'GET',
    credentials: true,
    exposedHeaders: ['foo', 'bar'],
    allowedHeaders: ['baz', 'woo'],
    maxAge: 123
  })

  fastify.get('/', (req, reply) => {
    reply.send('ok')
  })

  fastify.inject({
    method: 'OPTIONS',
    url: '/'
  }, (err, res) => {
    t.error(err)
    delete res.headers.date
    t.strictEqual(res.statusCode, 204)
    t.strictEqual(res.payload, '')
    t.deepEqual({
      'access-control-allow-origin': 'example.com',
      vary: 'Origin',
      'access-control-allow-credentials': 'true',
      'access-control-expose-headers': 'foo, bar',
      'access-control-allow-methods': 'GET',
      'access-control-allow-headers': 'baz, woo',
      'access-control-max-age': '123',
      'content-length': '0',
      connection: 'keep-alive'
    }, res.headers)
  })

  fastify.inject({
    method: 'GET',
    url: '/'
  }, (err, res) => {
    t.error(err)
    delete res.headers.date
    t.strictEqual(res.statusCode, 200)
    t.strictEqual(res.payload, 'ok')
    t.deepEqual({
      'access-control-allow-origin': 'example.com',
      vary: 'Origin',
      'access-control-allow-credentials': 'true',
      'access-control-expose-headers': 'foo, bar',
      'content-length': '2',
      'content-type': 'text/plain; charset=utf-8',
      connection: 'keep-alive'
    }, res.headers)
  })
})

test('Dynamic origin resolution (valid origin)', t => {
  t.plan(6)

  const fastify = Fastify()
  const origin = function (header, cb) {
    t.strictEqual(header, 'example.com')
    t.deepEqual(this, fastify)
    cb(null, true)
  }
  fastify.register(cors, { origin })

  fastify.get('/', (req, reply) => {
    reply.send('ok')
  })

  fastify.inject({
    method: 'GET',
    url: '/',
    headers: { origin: 'example.com' }
  }, (err, res) => {
    t.error(err)
    delete res.headers.date
    t.strictEqual(res.statusCode, 200)
    t.strictEqual(res.payload, 'ok')
    t.deepEqual({
      'access-control-allow-origin': 'example.com',
      vary: 'Origin',
      'content-length': '2',
      'content-type': 'text/plain; charset=utf-8',
      connection: 'keep-alive'
    }, res.headers)
  })
})

test('Dynamic origin resolution (not valid origin)', t => {
  t.plan(5)

  const fastify = Fastify()
  const origin = (header, cb) => {
    t.strictEqual(header, 'example.com')
    cb(null, false)
  }
  fastify.register(cors, { origin })

  fastify.get('/', (req, reply) => {
    reply.send('ok')
  })

  fastify.inject({
    method: 'GET',
    url: '/',
    headers: { origin: 'example.com' }
  }, (err, res) => {
    t.error(err)
    delete res.headers.date
    t.strictEqual(res.statusCode, 200)
    t.strictEqual(res.payload, 'ok')
    t.deepEqual({
      'content-length': '2',
      'content-type': 'text/plain; charset=utf-8',
      connection: 'keep-alive'
    }, res.headers)
  })
})

test('Dynamic origin resolution (errored)', t => {
  t.plan(3)

  const fastify = Fastify()
  const origin = (header, cb) => {
    t.strictEqual(header, 'example.com')
    cb(new Error('ouch'))
  }
  fastify.register(cors, { origin })

  fastify.get('/', (req, reply) => {
    reply.send('ok')
  })

  fastify.inject({
    method: 'GET',
    url: '/',
    headers: { origin: 'example.com' }
  }, (err, res) => {
    t.error(err)
    t.strictEqual(res.statusCode, 500)
  })
})

test('Dynamic origin resolution (valid origin - promises)', t => {
  t.plan(5)

  const fastify = Fastify()
  const origin = (header, cb) => {
    return new Promise((resolve, reject) => {
      t.strictEqual(header, 'example.com')
      resolve(true)
    })
  }
  fastify.register(cors, { origin })

  fastify.get('/', (req, reply) => {
    reply.send('ok')
  })

  fastify.inject({
    method: 'GET',
    url: '/',
    headers: { origin: 'example.com' }
  }, (err, res) => {
    t.error(err)
    delete res.headers.date
    t.strictEqual(res.statusCode, 200)
    t.strictEqual(res.payload, 'ok')
    t.deepEqual({
      'access-control-allow-origin': 'example.com',
      vary: 'Origin',
      'content-length': '2',
      'content-type': 'text/plain; charset=utf-8',
      connection: 'keep-alive'
    }, res.headers)
  })
})

test('Dynamic origin resolution (not valid origin - promises)', t => {
  t.plan(5)

  const fastify = Fastify()
  const origin = (header, cb) => {
    return new Promise((resolve, reject) => {
      t.strictEqual(header, 'example.com')
      resolve(false)
    })
  }
  fastify.register(cors, { origin })

  fastify.get('/', (req, reply) => {
    reply.send('ok')
  })

  fastify.inject({
    method: 'GET',
    url: '/',
    headers: { origin: 'example.com' }
  }, (err, res) => {
    t.error(err)
    delete res.headers.date
    t.strictEqual(res.statusCode, 200)
    t.strictEqual(res.payload, 'ok')
    t.deepEqual({
      'content-length': '2',
      'content-type': 'text/plain; charset=utf-8',
      connection: 'keep-alive'
    }, res.headers)
  })
})

test('Dynamic origin resolution (errored - promises)', t => {
  t.plan(3)

  const fastify = Fastify()
  const origin = (header, cb) => {
    return new Promise((resolve, reject) => {
      t.strictEqual(header, 'example.com')
      reject(new Error('ouch'))
    })
  }
  fastify.register(cors, { origin })

  fastify.get('/', (req, reply) => {
    reply.send('ok')
  })

  fastify.inject({
    method: 'GET',
    url: '/',
    headers: { origin: 'example.com' }
  }, (err, res) => {
    t.error(err)
    t.strictEqual(res.statusCode, 500)
  })
})

test('Should not add cors headers when origin is false', t => {
  t.plan(8)

  const fastify = Fastify()
  fastify.register(cors, {
    origin: false,
    methods: 'GET',
    credentials: true,
    exposedHeaders: ['foo', 'bar'],
    allowedHeaders: ['baz', 'woo'],
    maxAge: 123
  })

  fastify.get('/', (req, reply) => {
    reply.send('ok')
  })

  fastify.inject({
    method: 'OPTIONS',
    url: '/'
  }, (err, res) => {
    t.error(err)
    delete res.headers.date
    t.strictEqual(res.statusCode, 200)
    t.strictEqual(res.payload, '')
    t.deepEqual({
      'content-length': '0',
      connection: 'keep-alive'
    }, res.headers)
  })

  fastify.inject({
    method: 'GET',
    url: '/'
  }, (err, res) => {
    t.error(err)
    delete res.headers.date
    t.strictEqual(res.statusCode, 200)
    t.strictEqual(res.payload, 'ok')
    t.deepEqual({
      'content-length': '2',
      'content-type': 'text/plain; charset=utf-8',
      connection: 'keep-alive'
    }, res.headers)
  })
})

test('Allow only request from a specifc origin', t => {
  t.plan(4)

  const fastify = Fastify()
  fastify.register(cors, { origin: 'other.io' })

  fastify.get('/', (req, reply) => {
    reply.send('ok')
  })

  fastify.inject({
    method: 'GET',
    url: '/',
    headers: { origin: 'example.com' }
  }, (err, res) => {
    t.error(err)
    delete res.headers.date
    t.strictEqual(res.statusCode, 200)
    t.strictEqual(res.payload, 'ok')
    t.deepEqual({
      'access-control-allow-origin': 'other.io',
      vary: 'Origin',
      'content-length': '2',
      'content-type': 'text/plain; charset=utf-8',
      connection: 'keep-alive'
    }, res.headers)
  })
})

test('Disable preflight', t => {
  t.plan(7)

  const fastify = Fastify()
  fastify.register(cors, { preflight: false })

  fastify.get('/', (req, reply) => {
    reply.send('ok')
  })

  fastify.inject({
    method: 'OPTIONS',
    url: '/hello'
  }, (err, res) => {
    t.error(err)
    delete res.headers.date
    t.strictEqual(res.statusCode, 404)
    t.deepEqual({
      'access-control-allow-origin': '*',
      'content-length': '60',
      'content-type': 'application/json; charset=utf-8',
      connection: 'keep-alive'
    }, res.headers)
  })

  fastify.inject({
    method: 'GET',
    url: '/'
  }, (err, res) => {
    t.error(err)
    delete res.headers.date
    t.strictEqual(res.statusCode, 200)
    t.strictEqual(res.payload, 'ok')
    t.deepEqual({
      'access-control-allow-origin': '*',
      'content-length': '2',
      'content-type': 'text/plain; charset=utf-8',
      connection: 'keep-alive'
    }, res.headers)
  })
})
