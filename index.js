'use strict'

const fp = require('fastify-plugin')
const append = require('vary').append

function fastifyCors (fastify, opts, next) {
  const {
    origin,
    credentials,
    exposedHeaders,
    allowedHeaders,
    methods,
    maxAge,
    preflightContinue,
    optionsSuccessStatus,
    preflight
  } = Object.assign({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    preflightContinue: false,
    optionsSuccessStatus: 204,
    credentials: false,
    exposedHeaders: null,
    allowedHeaders: null,
    maxAge: null,
    preflight: true
  }, opts)

  const isOriginFalsy = !origin
  const isOriginString = typeof origin === 'string'
  const isOriginFunction = typeof origin === 'function'

  if (preflight === true) {
    fastify.options('*', (req, reply) => reply.send())
  }
  fastify.addHook('onRequest', onRequest)
  function onRequest (req, reply, next) {
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

      if (req.raw.method === 'OPTIONS' && preflight === true) {
        // preflight
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

        if (preflightContinue) {
          next()
        } else {
          // Safari (and potentially other browsers) need content-length 0,
          // for 204 or they just hang waiting for a body
          reply
            .code(optionsSuccessStatus)
            .header('Content-Length', '0')
            .send()
        }
      } else {
        next()
      }
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
        vary(reply, 'Origin')
      } else {
        // reflect origin
        reply.header(
          'Access-Control-Allow-Origin',
          isOriginAllowed(reqOrigin, origin) ? reqOrigin : false
        )
        vary(reply, 'Origin')
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

// https://github.com/fastify/fastify-sensible/blob/master/lib/vary.js
function vary (reply, field) {
  var value = reply.getHeader('Vary') || ''
  var header = Array.isArray(value)
    ? value.join(', ')
    : String(value)

  // set new header
  if ((value = append(header, field))) {
    reply.header('Vary', value)
  }
}

module.exports = fp(fastifyCors, {
  fastify: '>=2.x',
  name: 'fastify-cors'
})
