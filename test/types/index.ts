import * as Fastify from 'fastify'
import * as fastifyCors from '../..'

const app = Fastify()

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
  origin: (origin: string, cb: Function) => {
    if (/localhost/.test(origin)) {
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
