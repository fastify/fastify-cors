'use strict'

const { test } = require('tap')
const Fastify = require('fastify')
const cors = require('../')

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
    t.match(res.headers, {
      'access-control-allow-origin': '*'
    })
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
    url: '/',
    headers: {
      'access-control-request-method': 'GET',
      origin: 'example.com'
    }
  }, (err, res) => {
    t.error(err)
    delete res.headers.date
    t.strictEqual(res.statusCode, 204)
    t.strictEqual(res.payload, '')
    t.match(res.headers, {
      'access-control-allow-origin': 'example.com',
      vary: 'Origin',
      'access-control-allow-credentials': 'true',
      'access-control-expose-headers': 'foo, bar',
      'access-control-allow-methods': 'GET',
      'access-control-allow-headers': 'baz, woo',
      'access-control-max-age': '123',
      'content-length': '0'
    })
  })

  fastify.inject({
    method: 'GET',
    url: '/'
  }, (err, res) => {
    t.error(err)
    delete res.headers.date
    t.strictEqual(res.statusCode, 200)
    t.strictEqual(res.payload, 'ok')
    t.match(res.headers, {
      'access-control-allow-origin': 'example.com',
      vary: 'Origin',
      'access-control-allow-credentials': 'true',
      'access-control-expose-headers': 'foo, bar',
      'content-length': '2'
    })
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
    t.match(res.headers, {
      'access-control-allow-origin': 'example.com',
      vary: 'Origin'
    })
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
    t.deepEqual(res.headers, {
      'content-length': '2',
      'content-type': 'text/plain; charset=utf-8',
      connection: 'keep-alive',
      vary: 'Origin'
    })
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
    t.match(res.headers, {
      'access-control-allow-origin': 'example.com',
      vary: 'Origin'
    })
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
    t.deepEqual(res.headers, {
      'content-length': '2',
      'content-type': 'text/plain; charset=utf-8',
      connection: 'keep-alive',
      vary: 'Origin'
    })
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

test('Should reply 404 without cors headers other than `vary` when origin is false', t => {
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
    t.strictEqual(res.statusCode, 404)
    t.strictEqual(res.payload, 'Not Found')
    t.deepEqual(res.headers, {
      'content-length': '9',
      'content-type': 'text/plain',
      connection: 'keep-alive',
      vary: 'Origin'
    })
  })

  fastify.inject({
    method: 'GET',
    url: '/'
  }, (err, res) => {
    t.error(err)
    delete res.headers.date
    t.strictEqual(res.statusCode, 200)
    t.strictEqual(res.payload, 'ok')
    t.deepEqual(res.headers, {
      'content-length': '2',
      'content-type': 'text/plain; charset=utf-8',
      connection: 'keep-alive',
      vary: 'Origin'
    })
  })
})

test('Allow only request from a specific origin', t => {
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
    t.match(res.headers, {
      'access-control-allow-origin': 'other.io',
      vary: 'Origin'
    })
  })
})

test('Allow only request from multiple specific origin', t => {
  t.plan(8)

  const fastify = Fastify()
  fastify.register(cors, { origin: ['other.io', 'example.com'] })

  fastify.get('/', (req, reply) => {
    reply.send('ok')
  })

  fastify.inject({
    method: 'GET',
    url: '/',
    headers: { origin: 'other.io' }
  }, (err, res) => {
    t.error(err)
    delete res.headers.date
    t.strictEqual(res.statusCode, 200)
    t.strictEqual(res.payload, 'ok')
    t.match(res.headers, {
      'access-control-allow-origin': 'other.io',
      vary: 'Origin'
    })
  })

  fastify.inject({
    method: 'GET',
    url: '/',
    headers: { origin: 'foo.com' }
  }, (err, res) => {
    t.error(err)
    delete res.headers.date
    t.strictEqual(res.statusCode, 200)
    t.strictEqual(res.payload, 'ok')
    t.match(res.headers, {
      'access-control-allow-origin': false,
      vary: 'Origin'
    })
  })
})

test('Allow only request from a specific origin using regex', t => {
  t.plan(4)

  const fastify = Fastify()
  fastify.register(cors, { origin: /^(example|other)\.com/ })

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
    t.match(res.headers, {
      'access-control-allow-origin': 'example.com',
      vary: 'Origin'
    })
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
    t.match(res.headers, {
      'access-control-allow-origin': '*'
    })
  })

  fastify.inject({
    method: 'GET',
    url: '/'
  }, (err, res) => {
    t.error(err)
    delete res.headers.date
    t.strictEqual(res.statusCode, 200)
    t.strictEqual(res.payload, 'ok')
    t.match(res.headers, {
      'access-control-allow-origin': '*'
    })
  })
})

test('Should always add vary header to `Origin` by default', t => {
  t.plan(12)

  const fastify = Fastify()
  fastify.register(cors)

  fastify.get('/', (req, reply) => {
    reply.send('ok')
  })

  // Invalid Preflight
  fastify.inject({
    method: 'OPTIONS',
    url: '/'
  }, (err, res) => {
    t.error(err)
    delete res.headers.date
    t.strictEqual(res.statusCode, 400)
    t.strictEqual(res.payload, 'Invalid Preflight Request')
    t.match(res.headers, {
      vary: 'Origin'
    })
  })

  // Valid Preflight
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
    t.strictEqual(res.statusCode, 204)
    t.strictEqual(res.payload, '')
    t.match(res.headers, {
      vary: 'Origin'
    })
  })

  // Other Route
  fastify.inject({
    method: 'GET',
    url: '/'
  }, (err, res) => {
    t.error(err)
    delete res.headers.date
    t.strictEqual(res.statusCode, 200)
    t.strictEqual(res.payload, 'ok')
    t.match(res.headers, {
      vary: 'Origin'
    })
  })
})

test('Should always add vary header to `Origin` by default (vary is array)', t => {
  t.plan(4)

  const fastify = Fastify()

  // Mock getHeader function
  fastify.decorateReply('getHeader', (name) => ['foo', 'bar'])

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
    t.match(res.headers, {
      vary: 'foo, bar, Origin'
    })
  })
})

test('Allow only request from with specific headers', t => {
  t.plan(7)

  const fastify = Fastify()
  fastify.register(cors, {
    allowedHeaders: 'foo',
    exposedHeaders: 'bar'
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
    t.strictEqual(res.statusCode, 204)
    t.match(res.headers, {
      'access-control-allow-headers': 'foo',
      vary: 'Origin'
    })
  })

  fastify.inject({
    method: 'GET',
    url: '/'
  }, (err, res) => {
    t.error(err)
    delete res.headers.date
    t.strictEqual(res.statusCode, 200)
    t.strictEqual(res.payload, 'ok')
    t.match(res.headers, {
      'access-control-expose-headers': 'bar'
    })
  })
})
