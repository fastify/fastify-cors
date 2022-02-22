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
  strictPreflight: true
}

function fastifyCors (fastify, opts, next) {
  fastify.decorateRequest('corsPreflightEnabled', false)

  let hideOptionsRoute = true
  if (typeof opts === 'function') {
    handleCorsOptionsDelegator(opts, fastify)
  } else {
    if (opts.hideOptionsRoute !== undefined) hideOptionsRoute = opts.hideOptionsRoute
    const corsOptions = Object.assign({}, defaultOptions, opts)
    fastify.addHook('onRequest', (req, reply, next) => {
      onRequest(fastify, corsOptions, req, reply, next)
    })
  }

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

  next()
}

function handleCorsOptionsDelegator (optionsResolver, fastify) {
  fastify.addHook('onRequest', (req, reply, next) => {
    if (optionsResolver.length === 2) {
      handleCorsOptionsCallbackDelegator(optionsResolver, fastify, req, reply, next)
      return
    } else {
      // handle delegator based on Promise
      const ret = optionsResolver(req)
      if (ret && typeof ret.then === 'function') {
        ret.then(options => Object.assign({}, defaultOptions, options))
          .then(corsOptions => onRequest(fastify, corsOptions, req, reply, next)).catch(next)
        return
      }
    }
    next(new Error('Invalid CORS origin option'))
  })
}

function handleCorsOptionsCallbackDelegator (optionsResolver, fastify, req, reply, next) {
  optionsResolver(req, (err, options) => {
    if (err) {
      next(err)
    } else {
      const corsOptions = Object.assign({}, defaultOptions, options)
      onRequest(fastify, corsOptions, req, reply, next)
    }
  })
}

function onRequest (fastify, options, req, reply, next) {
  // Always set Vary header
  // https://github.com/rs/cors/issues/10
  vary(reply, 'Origin')
  const resolveOriginOption = typeof options.origin === 'function' ? resolveOriginWrapper(fastify, options.origin) : (_, cb) => cb(null, options.origin)

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

    addCorsHeaders(req, reply, resolvedOriginOption, options)

    if (req.raw.method === 'OPTIONS' && options.preflight === true) {
      // Strict mode enforces the required headers for preflight
      if (options.strictPreflight === true && (!req.headers.origin || !req.headers['access-control-request-method'])) {
        reply.status(400).type('text/plain').send('Invalid Preflight Request')
        return
      }

      req.corsPreflightEnabled = true

      addPreflightHeaders(req, reply, options)

      if (!options.preflightContinue) {
        // Do not call the hook callback and terminate the request
        // Safari (and potentially other browsers) need content-length 0,
        // for 204 or they just hang waiting for a body
        reply
          .code(options.optionsSuccessStatus)
          .header('Content-Length', '0')
          .send()
        return
      }
    }

    return next()
  })
}

function addCorsHeaders (req, reply, originOption, corsOptions) {
  const origin = getAccessControlAllowOriginHeader(req.headers.origin, originOption)
  // In the case of origin not allowed the header is not
  // written in the response.
  // https://github.com/fastify/fastify-cors/issues/127
  if (origin) {
    reply.header('Access-Control-Allow-Origin', origin)
  }

  if (corsOptions.credentials) {
    reply.header('Access-Control-Allow-Credentials', 'true')
  }

  if (corsOptions.exposedHeaders !== null) {
    reply.header(
      'Access-Control-Expose-Headers',
      Array.isArray(corsOptions.exposedHeaders) ? corsOptions.exposedHeaders.join(', ') : corsOptions.exposedHeaders
    )
  }
}

function addPreflightHeaders (req, reply, corsOptions) {
  reply.header(
    'Access-Control-Allow-Methods',
    Array.isArray(corsOptions.methods) ? corsOptions.methods.join(', ') : corsOptions.methods
  )

  if (corsOptions.allowedHeaders === null) {
    vary(reply, 'Access-Control-Request-Headers')
    const reqAllowedHeaders = req.headers['access-control-request-headers']
    if (reqAllowedHeaders !== undefined) {
      reply.header('Access-Control-Allow-Headers', reqAllowedHeaders)
    }
  } else {
    reply.header(
      'Access-Control-Allow-Headers',
      Array.isArray(corsOptions.allowedHeaders) ? corsOptions.allowedHeaders.join(', ') : corsOptions.allowedHeaders
    )
  }

  if (corsOptions.maxAge !== null) {
    reply.header('Access-Control-Max-Age', String(corsOptions.maxAge))
  }
}

function resolveOriginWrapper (fastify, origin) {
  return function (req, cb) {
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
    allowedOrigin.lastIndex = 0
    return allowedOrigin.test(reqOrigin)
  } else {
    return !!allowedOrigin
  }
}

module.exports = fp(fastifyCors, {
  fastify: '3.x',
  name: 'fastify-cors'
})
