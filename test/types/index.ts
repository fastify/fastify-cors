import * as Fastify from 'fastify'
import * as fastifyCors from '../..'

const app = Fastify()

app.register(fastifyCors)

app.register(fastifyCors, {
  origin: true,
  allowedHeaders: 'authorization,content-type',
  methods: 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
  credentials: true,
  exposedHeaders: 'authorization',
  maxAge: 13000,
  preflightContinue: false,
  optionsSuccessStatus: 200,
  preflight: false
})

app.register(fastifyCors, {
  origin: true,
  allowedHeaders: ['authorization', 'content-type'],
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  credentials: true,
  exposedHeaders: ['authorization'],
  maxAge: 13000,
  preflightContinue: false,
  optionsSuccessStatus: 200,
  preflight: false
})

app.register(fastifyCors, {
  origin: '*',
  allowedHeaders: ['authorization', 'content-type'],
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  credentials: true,
  exposedHeaders: ['authorization'],
  maxAge: 13000,
  preflightContinue: false,
  optionsSuccessStatus: 200,
  preflight: false
})

app.register(fastifyCors, {
  origin: /\*/,
  allowedHeaders: ['authorization', 'content-type'],
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  credentials: true,
  exposedHeaders: ['authorization'],
  maxAge: 13000,
  preflightContinue: false,
  optionsSuccessStatus: 200,
  preflight: false
})

app.register(fastifyCors, {
  origin: ['*', 'something'],
  allowedHeaders: ['authorization', 'content-type'],
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  credentials: true,
  exposedHeaders: ['authorization'],
  maxAge: 13000,
  preflightContinue: false,
  optionsSuccessStatus: 200,
  preflight: false
})

app.register(fastifyCors, {
  origin: [/\*/, /something/],
  allowedHeaders: ['authorization', 'content-type'],
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  credentials: true,
  exposedHeaders: ['authorization'],
  maxAge: 13000,
  preflightContinue: false,
  optionsSuccessStatus: 200,
  preflight: false
})

app.register(fastifyCors, {
  origin: (origin: string, cb: (err: Error | null, allow: boolean) => void) => {
    if (/localhost/.test(origin) || typeof origin === 'undefined') {
      cb(null, true)
      return
    }
    cb(new Error(), false)
  },
  allowedHeaders: ['authorization', 'content-type'],
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  credentials: true,
  exposedHeaders: ['authorization'],
  maxAge: 13000,
  preflightContinue: false,
  optionsSuccessStatus: 200,
  preflight: false
})

const appHttp2 = Fastify({ http2: true })

appHttp2.register(fastifyCors)

appHttp2.register(fastifyCors, {
  origin: true,
  allowedHeaders: 'authorization,content-type',
  methods: 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
  credentials: true,
  exposedHeaders: 'authorization',
  maxAge: 13000,
  preflightContinue: false,
  optionsSuccessStatus: 200,
  preflight: false
})

appHttp2.register(fastifyCors, {
  origin: true,
  allowedHeaders: ['authorization', 'content-type'],
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  credentials: true,
  exposedHeaders: ['authorization'],
  maxAge: 13000,
  preflightContinue: false,
  optionsSuccessStatus: 200,
  preflight: false
})

appHttp2.register(fastifyCors, {
  origin: '*',
  allowedHeaders: ['authorization', 'content-type'],
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  credentials: true,
  exposedHeaders: ['authorization'],
  maxAge: 13000,
  preflightContinue: false,
  optionsSuccessStatus: 200,
  preflight: false
})

appHttp2.register(fastifyCors, {
  origin: /\*/,
  allowedHeaders: ['authorization', 'content-type'],
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  credentials: true,
  exposedHeaders: ['authorization'],
  maxAge: 13000,
  preflightContinue: false,
  optionsSuccessStatus: 200,
  preflight: false
})

appHttp2.register(fastifyCors, {
  origin: ['*', 'something'],
  allowedHeaders: ['authorization', 'content-type'],
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  credentials: true,
  exposedHeaders: ['authorization'],
  maxAge: 13000,
  preflightContinue: false,
  optionsSuccessStatus: 200,
  preflight: false
})

appHttp2.register(fastifyCors, {
  origin: [/\*/, /something/],
  allowedHeaders: ['authorization', 'content-type'],
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  credentials: true,
  exposedHeaders: ['authorization'],
  maxAge: 13000,
  preflightContinue: false,
  optionsSuccessStatus: 200,
  preflight: false
})

appHttp2.register(fastifyCors, {
  origin: (origin: string, cb: (err: Error | null, allow: boolean) => void) => {
    if (/localhost/.test(origin) || typeof origin === 'undefined') {
      cb(null, true)
      return
    }
    cb(new Error(), false)
  },
  allowedHeaders: ['authorization', 'content-type'],
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  credentials: true,
  exposedHeaders: ['authorization'],
  maxAge: 13000,
  preflightContinue: false,
  optionsSuccessStatus: 200,
  preflight: false
})
