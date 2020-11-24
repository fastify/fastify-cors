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
    strictPreflight
  } = Object.assign({}, defaultOptions, opts)

  const resolveOriginOption = typeof origin === 'function' ? resolveOriginWrapper : (_, cb) => cb(null, origin)

  fastify.decorateRequest('corsPreflightEnabled', undefined)
  fastify.addHook('onRequest', onRequest)

  if (preflight === true) {
    fastify.options('*', { schema: { hide: hideOptionsRoute } }, preflightHandler)
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
        req.corsPreflightEnabled = false
        return next()
      }

      // Falsy values are invalid
      if (!resolvedOriginOption) {
        return next(new Error('Invalid CORS origin option'))
      }

      // Enable preflight
      req.corsPreflightEnabled = true

      reply.header('Access-Control-Allow-Origin',
        getAccessControlAllowOriginHeader(req.headers.origin, resolvedOriginOption))

      if (credentials) {
        reply.header('Access-Control-Allow-Credentials', 'true')
      }

      if (exposedHeaders !== null) {
        reply.header(
          'Access-Control-Expose-Headers',
          Array.isArray(exposedHeaders) ? exposedHeaders.join(', ') : exposedHeaders
        )
      }

      return next()
    })
  }

  function preflightHandler (req, reply) {
    // Do not handle preflight requests if the origin option disabled CORS
    if (!req.corsPreflightEnabled) {
      reply.code(404).type('text/plain').send('Not Found')
      return
    }

    // Strict mode enforces the required headers for preflight
    if (strictPreflight === true && (!req.headers.origin || !req.headers['access-control-request-method'])) {
      reply.status(400).type('text/plain').send('Invalid Preflight Request')
      return
    }

    // Handle preflight headers
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

    // Safari (and potentially other browsers) need content-length 0,
    // for 204 or they just hang waiting for a body
    reply
      .code(optionsSuccessStatus)
      .header('Content-Length', '0')
      .send()
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
