'use strict'

const fp = require('fastify-plugin')
const vary = require('./vary')

const defaultOptions = {
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
  strictPreflight: true
}

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
    strictPreflight,
    preflightContinue
  } = Object.assign({}, defaultOptions, opts)

  const resolveOriginOption = typeof origin === 'function' ? resolveOriginWrapper : (_, cb) => cb(null, origin)

  fastify.decorateRequest('corsPreflightEnabled', false)
  fastify.addHook('onRequest', onRequest)

  if (preflight === true) {
    // The preflight reply must occur in the hook. This allows fastify-cors to reply to
    // preflight requests BEFORE possible authentication plugins. If the preflight reply
    // occurred in this handler, other plugins may deny the request since the browser will
    // remove most headers (such as the Authentication header).
    //
    // This route simply enables fastify to accept preflight requests.
    fastify.options('*', { schema: { hide: hideOptionsRoute } }, (req, reply) => {
      if (!req.corsPreflightEnabled) {
        // Do not handle preflight requests if the origin option disabled CORS
        reply.callNotFound()
        return
      }

      reply.send()
    })
  }

  next()

  function onRequest (req, reply, next) {
    // Always set Vary header
    // https://github.com/rs/cors/issues/10
    vary(reply, 'Origin')

    resolveOriginOption(req, (error, resolvedOriginOption) => {
      if (error !== null) {
        return next(error)
      }

      // Disable CORS and preflight if false
      if (resolvedOriginOption === false) {
        return next()
      }

      // Falsy values are invalid
      if (!resolvedOriginOption) {
        return next(new Error('Invalid CORS origin option'))
      }

      addCorsHeaders(req, reply, resolvedOriginOption)

      if (req.raw.method === 'OPTIONS' && preflight === true) {
        // Strict mode enforces the required headers for preflight
        if (strictPreflight === true && (!req.headers.origin || !req.headers['access-control-request-method'])) {
          reply.status(400).type('text/plain').send('Invalid Preflight Request')
          return
        }

        req.corsPreflightEnabled = true

        addPreflightHeaders(req, reply)

        if (!preflightContinue) {
          // Do not call the hook callback and terminate the request
          // Safari (and potentially other browsers) need content-length 0,
          // for 204 or they just hang waiting for a body
          reply
            .code(optionsSuccessStatus)
            .header('Content-Length', '0')
            .send()
          return
        }
      }

      return next()
    })
  }

  function addCorsHeaders (req, reply, originOption) {
    reply.header('Access-Control-Allow-Origin',
      getAccessControlAllowOriginHeader(req.headers.origin, originOption))

    if (credentials) {
      reply.header('Access-Control-Allow-Credentials', 'true')
    }

    if (exposedHeaders !== null) {
      reply.header(
        'Access-Control-Expose-Headers',
        Array.isArray(exposedHeaders) ? exposedHeaders.join(', ') : exposedHeaders
      )
    }
  }

  function addPreflightHeaders (req, reply) {
    reply.header(
      'Access-Control-Allow-Methods',
      Array.isArray(methods) ? methods.join(', ') : methods
    )

    if (allowedHeaders === null) {
      vary(reply, 'Access-Control-Request-Headers')
      const reqAllowedHeaders = req.headers['access-control-request-headers']
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

  function resolveOriginWrapper (req, cb) {
    const result = origin.call(fastify, req.headers.origin, cb)

    // Allow for promises
    if (result && typeof result.then === 'function') {
      result.then(res => cb(null, res), cb)
    }
  }
}

function getAccessControlAllowOriginHeader (reqOrigin, originOption) {
  if (originOption === '*') {
    // allow any origin
    return '*'
  }

  if (typeof originOption === 'string') {
    // fixed origin
    return originOption
  }

  // reflect origin
  return isRequestOriginAllowed(reqOrigin, originOption) ? reqOrigin : false
}

function isRequestOriginAllowed (reqOrigin, allowedOrigin) {
  if (Array.isArray(allowedOrigin)) {
    for (let i = 0; i < allowedOrigin.length; ++i) {
      if (isRequestOriginAllowed(reqOrigin, allowedOrigin[i])) {
        return true
      }
    }
    return false
  } else if (typeof allowedOrigin === 'string') {
    return reqOrigin === allowedOrigin
  } else if (allowedOrigin instanceof RegExp) {
    return allowedOrigin.test(reqOrigin)
  } else {
    return !!allowedOrigin
  }
}

module.exports = fp(fastifyCors, {
  fastify: '3.x',
  name: 'fastify-cors'
})
