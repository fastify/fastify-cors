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
    t.equal(res.statusCode, 200)
    t.equal(res.payload, 'ok')
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
    maxAge: 123,
    cacheControl: 321
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
    t.equal(res.statusCode, 204)
    t.equal(res.payload, '')
    t.match(res.headers, {
      'access-control-allow-origin': 'example.com',
      vary: 'Origin',
      'access-control-allow-credentials': 'true',
      'access-control-expose-headers': 'foo, bar',
      'access-control-allow-methods': 'GET',
      'access-control-allow-headers': 'baz, woo',
      'access-control-max-age': '123',
      'cache-control': 'max-age=321',
      'content-length': '0'
    })
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
      vary: 'Origin',
      'access-control-allow-credentials': 'true',
      'access-control-expose-headers': 'foo, bar',
      'content-length': '2'
    })
  })
})

test('Should support dynamic config (callback)', t => {
  t.plan(16)

  const configs = [{
    origin: 'example.com',
    methods: 'GET',
    credentials: true,
    exposedHeaders: ['foo', 'bar'],
    allowedHeaders: ['baz', 'woo'],
    maxAge: 123,
    cacheControl: 456
  }, {
    origin: 'sample.com',
    methods: 'GET',
    credentials: true,
    exposedHeaders: ['zoo', 'bar'],
    allowedHeaders: ['baz', 'foo'],
    maxAge: 321,
    cacheControl: '456'
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
  fastify.register(cors, () => configDelegation)

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
      vary: 'Origin',
      'access-control-allow-credentials': 'true',
      'access-control-expose-headers': 'foo, bar',
      'content-length': '2'
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
      vary: 'Origin',
      'access-control-allow-credentials': 'true',
      'access-control-expose-headers': 'zoo, bar',
      'access-control-allow-methods': 'GET',
      'access-control-allow-headers': 'baz, foo',
      'access-control-max-age': '321',
      'cache-control': '456',
      'content-length': '0'
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

test('Should support dynamic config (Promise)', t => {
  t.plan(23)

  const configs = [{
    origin: 'example.com',
    methods: 'GET',
    credentials: true,
    exposedHeaders: ['foo', 'bar'],
    allowedHeaders: ['baz', 'woo'],
    maxAge: 123,
    cacheControl: 456
  }, {
    origin: 'sample.com',
    methods: 'GET',
    credentials: true,
    exposedHeaders: ['zoo', 'bar'],
    allowedHeaders: ['baz', 'foo'],
    maxAge: 321,
    cacheControl: true // Invalid value should be ignored
  }, {
    origin: 'sample.com',
    methods: 'GET',
    credentials: true,
    exposedHeaders: ['zoo', 'bar'],
    allowedHeaders: ['baz', 'foo'],
    maxAge: 321,
    cacheControl: 'public, max-age=456'
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
  fastify.register(cors, () => configDelegation)

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
      vary: 'Origin',
      'access-control-allow-credentials': 'true',
      'access-control-expose-headers': 'foo, bar',
      'content-length': '2'
    })
  })

  fastify.inject({
    method: 'OPTIONS',
    url: '/',
    headers: {
      'access-control-request-method': 'GET',
      origin: 'sample.com'
    }
  }, (err, res) => {
    t.error(err)
    delete res.headers.date
    t.equal(res.statusCode, 204)
    t.equal(res.payload, '')
    t.match(res.headers, {
      'access-control-allow-origin': 'sample.com',
      vary: 'Origin',
      'access-control-allow-credentials': 'true',
      'access-control-expose-headers': 'zoo, bar',
      'access-control-allow-methods': 'GET',
      'access-control-allow-headers': 'baz, foo',
      'access-control-max-age': '321',
      'content-length': '0'
    })
    t.equal(res.headers['cache-control'], undefined, 'cache-control omitted (invalid value)')
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
      vary: 'Origin',
      'access-control-allow-credentials': 'true',
      'access-control-expose-headers': 'zoo, bar',
      'access-control-allow-methods': 'GET',
      'access-control-allow-headers': 'baz, foo',
      'access-control-max-age': '321',
      'cache-control': 'public, max-age=456', // cache-control included (custom string)
      'content-length': '0'
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

test('Should support dynamic config. (Invalid function)', t => {
  t.plan(2)

  const fastify = Fastify()
  fastify.register(cors, () => (a, b, c) => {})

  fastify.get('/', (req, reply) => {
    reply.send('ok')
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

test('Dynamic origin resolution (valid origin)', t => {
  t.plan(6)

  const fastify = Fastify()
  const origin = function (header, cb) {
    t.equal(header, 'example.com')
    t.same(this, fastify)
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
    t.equal(res.statusCode, 200)
    t.equal(res.payload, 'ok')
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
    t.equal(header, 'example.com')
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
    t.equal(res.statusCode, 200)
    t.equal(res.payload, 'ok')
    t.same(res.headers, {
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
    t.equal(header, 'example.com')
    cb(new Error('ouch'))
  }
  fastify.register(cors, { origin })

  fastify.inject({
    method: 'GET',
    url: '/',
    headers: { origin: 'example.com' }
  }, (err, res) => {
    t.error(err)
    t.equal(res.statusCode, 500)
  })
})

test('Dynamic origin resolution (invalid result)', t => {
  t.plan(3)

  const fastify = Fastify()
  const origin = (header, cb) => {
    t.equal(header, 'example.com')
    cb(null, undefined)
  }
  fastify.register(cors, { origin })

  fastify.inject({
    method: 'GET',
    url: '/',
    headers: { origin: 'example.com' }
  }, (err, res) => {
    t.error(err)
    t.equal(res.statusCode, 500)
  })
})

test('Dynamic origin resolution (valid origin - promises)', t => {
  t.plan(5)

  const fastify = Fastify()
  const origin = (header, cb) => {
    return new Promise((resolve, reject) => {
      t.equal(header, 'example.com')
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
    t.equal(res.statusCode, 200)
    t.equal(res.payload, 'ok')
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
      t.equal(header, 'example.com')
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
    t.equal(res.statusCode, 200)
    t.equal(res.payload, 'ok')
    t.same(res.headers, {
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
      t.equal(header, 'example.com')
      reject(new Error('ouch'))
    })
  }
  fastify.register(cors, { origin })

  fastify.inject({
    method: 'GET',
    url: '/',
    headers: { origin: 'example.com' }
  }, (err, res) => {
    t.error(err)
    t.equal(res.statusCode, 500)
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
    t.equal(res.statusCode, 404)
    t.equal(res.payload, '{"message":"Route OPTIONS:/ not found","error":"Not Found","statusCode":404}')
    t.same(res.headers, {
      'content-length': '76',
      'content-type': 'application/json; charset=utf-8',
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
    t.equal(res.statusCode, 200)
    t.equal(res.payload, 'ok')
    t.same(res.headers, {
      'content-length': '2',
      'content-type': 'text/plain; charset=utf-8',
      connection: 'keep-alive',
      vary: 'Origin'
    })
  })
})

test('Server error if origin option is falsy but not false', t => {
  t.plan(4)

  const fastify = Fastify()
  fastify.register(cors, { origin: '' })

  fastify.inject({
    method: 'GET',
    url: '/',
    headers: { origin: 'example.com' }
  }, (err, res) => {
    t.error(err)
    delete res.headers.date
    t.equal(res.statusCode, 500)
    t.same(res.json(), { statusCode: 500, error: 'Internal Server Error', message: 'Invalid CORS origin option' })
    t.same(res.headers, {
      'content-length': '89',
      'content-type': 'application/json; charset=utf-8',
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
    t.equal(res.statusCode, 200)
    t.equal(res.payload, 'ok')
    t.match(res.headers, {
      'access-control-allow-origin': 'other.io',
      vary: 'Origin'
    })
  })
})

test('Allow only request from multiple specific origin', t => {
  t.plan(9)

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
    t.equal(res.statusCode, 200)
    t.equal(res.payload, 'ok')
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
    t.equal(res.statusCode, 200)
    t.equal(res.payload, 'ok')
    t.match(res.headers, {
      vary: 'Origin'
    })
    t.equal(res.headers['access-control-allow-origin'], undefined)
  })
})

test('Allow only request from a specific origin using regex', t => {
  t.plan(8)

  const fastify = Fastify()
  fastify.register(cors, { origin: /(example|other)\.com/gi })

  fastify.get('/', (req, reply) => {
    reply.send('ok')
  })

  // .test was previously used, which caused 2 consecutive requests to return
  // different results with global (e.g. /g) regexes. Therefore, check this
  // twice to check consistency
  for (let i = 0; i < 2; i++) {
    fastify.inject({
      method: 'GET',
      url: '/',
      headers: { origin: 'https://www.example.com/' }
    }, (err, res) => {
      t.error(err)
      delete res.headers.date
      t.equal(res.statusCode, 200)
      t.equal(res.payload, 'ok')
      t.match(res.headers, {
        'access-control-allow-origin': 'https://www.example.com/',
        vary: 'Origin'
      })
    })
  }
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
    t.equal(res.statusCode, 404)
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
    t.equal(res.statusCode, 200)
    t.equal(res.payload, 'ok')
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
    t.equal(res.statusCode, 400)
    t.equal(res.payload, 'Invalid Preflight Request')
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
    t.equal(res.statusCode, 204)
    t.equal(res.payload, '')
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
    t.equal(res.statusCode, 200)
    t.equal(res.payload, 'ok')
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
    t.equal(res.statusCode, 200)
    t.equal(res.payload, 'ok')
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
    t.equal(res.statusCode, 204)
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
    t.equal(res.statusCode, 200)
    t.equal(res.payload, 'ok')
    t.match(res.headers, {
      'access-control-expose-headers': 'bar'
    })
  })
})

test('Should support wildcard config /1', t => {
  t.plan(4)

  const fastify = Fastify()
  fastify.register(cors, { origin: '*' })

  fastify.get('/', (req, reply) => {
    reply.send('ok')
  })

  fastify.inject({
    method: 'GET',
    url: '/'
  }, (err, res) => {
    t.error(err)
    t.equal(res.statusCode, 200)
    t.equal(res.payload, 'ok')
    t.equal(res.headers['access-control-allow-origin'], '*')
  })
})

test('Should support wildcard config /2', t => {
  t.plan(4)

  const fastify = Fastify()
  fastify.register(cors, { origin: ['*'] })

  fastify.get('/', (req, reply) => {
    reply.send('ok')
  })

  fastify.inject({
    method: 'GET',
    url: '/'
  }, (err, res) => {
    t.error(err)
    t.equal(res.statusCode, 200)
    t.equal(res.payload, 'ok')
    t.equal(res.headers['access-control-allow-origin'], '*')
  })
})
