'use strict'

const fp = require('fastify-plugin')
const vary = require('./vary')

function fastifyCors (fastify, opts, next) {
  const {
    origin,
    credentials,
    exposedHeaders,
    allowedHeaders,
    methods,
    maxAge,
    optionsSuccessStatus,
    preflight,
    hideOptionsRoute,
    strictPreflight
  } = Object.assign({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    preflightContinue: false,
    optionsSuccessStatus: 204,
    credentials: false,
    exposedHeaders: null,
    allowedHeaders: null,
    maxAge: null,
    preflight: true,
    hideOptionsRoute: true,
    strictPreflight: false
  }, opts)

  const isOriginFalsy = !origin
  const isOriginString = typeof origin === 'string'
  const isOriginFunction = typeof origin === 'function'

  if (preflight === true) {
    fastify.options('*', { schema: { hide: hideOptionsRoute } }, (req, reply) => {
      if (origin === false) {
        reply.send()
        return
      }

      if (strictPreflight === true && (!req.headers.origin || !req.headers['access-control-request-method'])) {
        reply.status(400).type('text/html').send('Invalid preflight request')
        return
      }

      // Normal preflight response
      // Safari (and potentially other browsers) need content-length 0,
      // for 204 or they just hang waiting for a body
      reply
        .code(optionsSuccessStatus)
        .header('Content-Length', '0')
        .send()
    })
  }
  fastify.addHook('onRequest', onRequest)
  function onRequest (req, reply, next) {
    // Always set Vary header
    // https://github.com/rs/cors/issues/10
    vary(reply, 'Origin')

    if (isOriginFalsy) return next()

    configureOrigin(req, reply, (err, origin) => {
      if (err !== null) return next(err)
      if (origin === false) return next()

      if (credentials) {
        reply.header('Access-Control-Allow-Credentials', 'true')
      }

      if (exposedHeaders !== null) {
        reply.header(
          'Access-Control-Expose-Headers',
          Array.isArray(exposedHeaders) ? exposedHeaders.join(', ') : exposedHeaders
        )
      }

      // Handle preflight headers (if strict mode is enabled, then the valid preflight headers must exit)
      if (req.raw.method === 'OPTIONS' && preflight === true && (strictPreflight === false || (req.headers.origin && req.headers['access-control-request-method']))) {
        reply.header(
          'Access-Control-Allow-Methods',
          Array.isArray(methods) ? methods.join(', ') : methods
        )

        if (allowedHeaders === null) {
          vary(reply, 'Access-Control-Request-Headers')
          var reqAllowedHeaders = req.headers['access-control-request-headers']
          if (reqAllowedHeaders !== undefined) {
            reply.header('Access-Control-Allow-Headers', reqAllowedHeaders)
          }
        } else {
          reply.header(
            'Access-Control-Allow-Headers',
            Array.isArray(allowedHeaders) ? allowedHeaders.join(', ') : allowedHeaders
          )
        }

        if (maxAge !== null) {
          reply.header('Access-Control-Max-Age', String(maxAge))
        }
      }
      next()
    })
  }

  function configureOrigin (req, reply, callback) {
    var reqOrigin = req.headers.origin
    if (isOriginFunction) {
      var result = origin.call(fastify, reqOrigin, _onOrigin)
      if (result && typeof result.then === 'function') {
        result.then(res => _onOrigin(null, res), callback)
      }
    } else {
      _configureOrigin(origin)
    }

    function _onOrigin (err, origin) {
      if (err !== null || origin === false) {
        return callback(err, origin)
      }

      _configureOrigin(origin)
    }

    function _configureOrigin (origin) {
      if (!origin || origin === '*') {
        // allow any origin
        reply.header('Access-Control-Allow-Origin', '*')
      } else if (isOriginString) {
        // fixed origin
        reply.header('Access-Control-Allow-Origin', origin)
      } else {
        // reflect origin
        reply.header(
          'Access-Control-Allow-Origin',
          isOriginAllowed(reqOrigin, origin) ? reqOrigin : false
        )
      }

      callback(null, origin)
    }
  }

  function isOriginAllowed (reqOrigin, origin) {
    if (Array.isArray(origin)) {
      for (var i = 0; i < origin.length; ++i) {
        if (isOriginAllowed(reqOrigin, origin[i])) {
          return true
        }
      }
      return false
    } else if (typeof origin === 'string') {
      return reqOrigin === origin
    } else if (origin instanceof RegExp) {
      return origin.test(reqOrigin)
    } else {
      return !!origin
    }
  }

  next()
}

module.exports = fp(fastifyCors, {
  fastify: '3.x',
  name: 'fastify-cors'
})
