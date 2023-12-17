'use strict'

const { test } = require('tap')
const Fastify = require('fastify')
const cors = require('../')

test('Should reply to preflight requests', t => {
  t.plan(4)

  const fastify = Fastify()
  fastify.register(cors)

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
      'access-control-allow-origin': '*',
      'access-control-allow-methods': 'GET,HEAD,PUT,PATCH,POST,DELETE',
      vary: 'Origin, Access-Control-Request-Headers',
      'content-length': '0'
    })
  })
})

test('Should add access-control-allow-headers to response if preflight req has access-control-request-headers', t => {
  t.plan(4)

  const fastify = Fastify()
  fastify.register(cors)

  fastify.inject({
    method: 'OPTIONS',
    url: '/',
    headers: {
      'access-control-request-headers': 'x-requested-with',
      'access-control-request-method': 'GET',
      origin: 'example.com'
    }

  }, (err, res) => {
    t.error(err)
    delete res.headers.date
    t.equal(res.statusCode, 204)
    t.equal(res.payload, '')
    t.match(res.headers, {
      'access-control-allow-origin': '*',
      'access-control-allow-methods': 'GET,HEAD,PUT,PATCH,POST,DELETE',
      'access-control-allow-headers': 'x-requested-with',
      vary: 'Origin, Access-Control-Request-Headers',
      'content-length': '0'
    })
  })
})

test('Should reply to preflight requests with custom status code', t => {
  t.plan(4)

  const fastify = Fastify()
  fastify.register(cors, { optionsSuccessStatus: 200 })

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
    t.equal(res.statusCode, 200)
    t.equal(res.payload, '')
    t.match(res.headers, {
      'access-control-allow-origin': '*',
      'access-control-allow-methods': 'GET,HEAD,PUT,PATCH,POST,DELETE',
      vary: 'Origin, Access-Control-Request-Headers',
      'content-length': '0'
    })
  })
})

test('Should be able to override preflight response with a route', t => {
  t.plan(4)

  const fastify = Fastify()
  fastify.register(cors, { preflightContinue: true })

  fastify.options('/', (req, reply) => {
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
    t.equal(res.statusCode, 200)
    t.equal(res.payload, 'ok')
    t.match(res.headers, {
      // Only the base cors headers and no preflight headers
      'access-control-allow-origin': '*',
      vary: 'Origin'
    })
  })
})

test('Should reply to all options requests', t => {
  t.plan(4)

  const fastify = Fastify()
  fastify.register(cors)

  fastify.inject({
    method: 'OPTIONS',
    url: '/hello',
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
      'access-control-allow-origin': '*',
      'access-control-allow-methods': 'GET,HEAD,PUT,PATCH,POST,DELETE',
      vary: 'Origin, Access-Control-Request-Headers',
      'content-length': '0'
    })
  })
})

test('Should support a prefix for preflight requests', t => {
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
    t.equal(res.statusCode, 404)
  })

  fastify.inject({
    method: 'OPTIONS',
    url: '/subsystem/hello',
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
      'access-control-allow-origin': '*',
      'access-control-allow-methods': 'GET,HEAD,PUT,PATCH,POST,DELETE',
      vary: 'Origin, Access-Control-Request-Headers',
      'content-length': '0'
    })
  })
})

test('hide options route by default', t => {
  t.plan(2)

  const fastify = Fastify()

  fastify.addHook('onRoute', (route) => {
    if (route.method === 'OPTIONS' && route.url === '*') {
      t.equal(route.schema.hide, true)
    }
  })
  fastify.register(cors)

  fastify.ready(err => {
    t.error(err)
  })
})

test('show options route', t => {
  t.plan(2)

  const fastify = Fastify()

  fastify.addHook('onRoute', (route) => {
    if (route.method === 'OPTIONS' && route.url === '*') {
      t.equal(route.schema.hide, false)
    }
  })
  fastify.register(cors, { hideOptionsRoute: false })

  fastify.ready(err => {
    t.error(err)
  })
})

test('Allow only request from with specific methods', t => {
  t.plan(3)

  const fastify = Fastify()
  fastify.register(cors, { methods: ['GET', 'POST'] })

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
      'access-control-allow-methods': 'GET, POST',
      vary: 'Origin'
    })
  })
})

test('Should reply with 400 error to OPTIONS requests missing origin header when default strictPreflight', t => {
  t.plan(3)

  const fastify = Fastify()
  fastify.register(cors)

  fastify.inject({
    method: 'OPTIONS',
    url: '/',
    headers: {
      'access-control-request-method': 'GET'
    }
  }, (err, res) => {
    t.error(err)
    t.equal(res.statusCode, 400)
    t.equal(res.payload, 'Invalid Preflight Request')
  })
})

test('Should reply with 400 to OPTIONS requests when missing Access-Control-Request-Method header when default strictPreflight', t => {
  t.plan(3)

  const fastify = Fastify()
  fastify.register(cors, {
    strictPreflight: true
  })

  fastify.inject({
    method: 'OPTIONS',
    url: '/',
    headers: {
      origin: 'example.com'
    }
  }, (err, res) => {
    t.error(err)
    t.equal(res.statusCode, 400)
    t.equal(res.payload, 'Invalid Preflight Request')
  })
})

test('Should reply to all preflight requests when strictPreflight is disabled', t => {
  t.plan(4)

  const fastify = Fastify()
  fastify.register(cors, { strictPreflight: false })

  fastify.inject({
    method: 'OPTIONS',
    url: '/'
    // No access-control-request-method or origin headers
  }, (err, res) => {
    t.error(err)
    delete res.headers.date
    t.equal(res.statusCode, 204)
    t.equal(res.payload, '')
    t.match(res.headers, {
      'access-control-allow-origin': '*',
      'access-control-allow-methods': 'GET,HEAD,PUT,PATCH,POST,DELETE',
      vary: 'Origin, Access-Control-Request-Headers',
      'content-length': '0'
    })
  })
})

test('Default empty 200 response with preflightContinue on OPTIONS routes', t => {
  t.plan(4)

  const fastify = Fastify()
  fastify.register(cors, { preflightContinue: true })

  fastify.inject({
    method: 'OPTIONS',
    url: '/doesnotexist',
    headers: {
      'access-control-request-method': 'GET',
      origin: 'example.com'
    }
  }, (err, res) => {
    t.error(err)
    delete res.headers.date
    t.equal(res.statusCode, 200)
    t.equal(res.payload, '')
    t.match(res.headers, {
      'access-control-allow-origin': '*',
      'access-control-allow-methods': 'GET,HEAD,PUT,PATCH,POST,DELETE',
      vary: 'Origin, Access-Control-Request-Headers'
    })
  })
})

test('Can override preflight response with preflightContinue', t => {
  t.plan(4)

  const fastify = Fastify()
  fastify.register(cors, { preflightContinue: true })

  fastify.options('/', (req, reply) => {
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
    t.equal(res.statusCode, 200)
    t.equal(res.payload, 'ok')
    t.match(res.headers, {
      'access-control-allow-origin': '*',
      'access-control-allow-methods': 'GET,HEAD,PUT,PATCH,POST,DELETE',
      vary: 'Origin, Access-Control-Request-Headers'
    })
  })
})
