# @fastify/cors

![CI](https://github.com/fastify/fastify-cors/workflows/CI/badge.svg)
[![NPM version](https://img.shields.io/npm/v/@fastify/cors.svg?style=flat)](https://www.npmjs.com/package/@fastify/cors)
[![js-standard-style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg?style=flat)](https://standardjs.com/)


`@fastify/cors` enables the use of [CORS](https://en.wikipedia.org/wiki/Cross-origin_resource_sharing) in a Fastify application.

Supports Fastify versions `4.x`.

- Please refer to [7.x](https://github.com/fastify/fastify-cors/tree/v7.0.0) for Fastify `^3.x` compatibility.
- Please refer to [3.x](https://github.com/fastify/fastify-cors/tree/3.x) for Fastify `^2.x` compatibility.
- Please refer to [1.x](https://github.com/fastify/fastify-cors/tree/v1.0.0) for Fastify `^1.x` compatibility.

## Install
```
npm i @fastify/cors
```

## Usage
Require `@fastify/cors` and register it as any other plugin, it will add a `onRequest` hook and a [wildcard options route](https://github.com/fastify/fastify/issues/326#issuecomment-411360862).
```js
import Fastify from 'fastify'
import cors from '@fastify/cors'

const fastify = Fastify()
await fastify.register(cors, { 
  // put your options here
})

fastify.get('/', (req, reply) => {
  reply.send({ hello: 'world' })
})

await fastify.listen({ port: 3000 })
```
You can use it as is without passing any option or you can configure it as explained below.
### Options
* `origin`: Configures the **Access-Control-Allow-Origin** CORS header. The value of origin could be of different types:
  - `Boolean` - set `origin` to `true` to reflect the [request origin](http://tools.ietf.org/html/draft-abarth-origin-09), or set it to `false` to disable CORS.
  - `String` - set `origin` to a specific origin. For example if you set it to `"http://example.com"` only requests from "http://example.com" will be allowed. The special `*` value (default) allows any origin.
  - `RegExp` - set `origin` to a regular expression pattern that will be used to test the request origin. If it is a match, the request origin will be reflected. For example, the pattern `/example\.com$/` will reflect any request that is coming from an origin ending with "example.com".
  - `Array` - set `origin` to an array of valid origins. Each origin can be a `String` or a `RegExp`. For example `["http://example1.com", /\.example2\.com$/]` will accept any request from "http://example1.com" or from a subdomain of "example2.com".
  - `Function` - set `origin` to a function implementing some custom logic. The function takes the request origin as the first parameter and a callback as a second (which expects the signature `err [Error | null], origin`), where `origin` is a non-function value of the origin option. *Async-await* and promises are supported as well. The Fastify instance is bound to function call and you may access via `this`. For example: 
  ```js
  origin: (origin, cb) => {
    const hostname = new URL(origin).hostname
    if(hostname === "localhost"){
      //  Request from localhost will pass
      cb(null, true)
      return
    }
    // Generate an error on other origins, disabling access
    cb(new Error("Not allowed"), false)
  }
  ```
* `methods`: Configures the **Access-Control-Allow-Methods** CORS header. Expects a comma-delimited string (ex: 'GET,PUT,POST') or an array (ex: `['GET', 'PUT', 'POST']`).
* `hook`: See the section `Custom Fastify hook name` (default: `onResponse`)
* `allowedHeaders`: Configures the **Access-Control-Allow-Headers** CORS header. Expects a comma-delimited string (ex: `'Content-Type,Authorization'`) or an array (ex: `['Content-Type', 'Authorization']`). If not specified, defaults to reflecting the headers specified in the request's **Access-Control-Request-Headers** header.
* `exposedHeaders`: Configures the **Access-Control-Expose-Headers** CORS header. Expects a comma-delimited string (ex: `'Content-Range,X-Content-Range'`) or an array (ex: `['Content-Range', 'X-Content-Range']`). If not specified, no custom headers are exposed.
* `credentials`: Configures the **Access-Control-Allow-Credentials** CORS header. Set to `true` to pass the header, otherwise it is omitted.
* `maxAge`: Configures the **Access-Control-Max-Age** CORS header. In seconds. Set to an integer to pass the header, otherwise it is omitted.
* `preflightContinue`: Pass the CORS preflight response to the route handler (default: `false`).
* `optionsSuccessStatus`: Provides a status code to use for successful `OPTIONS` requests, since some legacy browsers (IE11, various SmartTVs) choke on `204`.
* `preflight`: if needed you can entirely disable preflight by passing `false` here (default: `true`).
* `strictPreflight`: Enforces strict requirement of the CORS preflight request headers (**Access-Control-Request-Method** and **Origin**) as defined by the [W3C CORS specification](https://www.w3.org/TR/2020/SPSD-cors-20200602/#resource-preflight-requests) (the current [fetch living specification](https://fetch.spec.whatwg.org/) does not define server behavior for missing headers). Preflight requests without the required headers will result in 400 errors when set to `true` (default: `true`).
* `hideOptionsRoute`: hide options route from the documentation built using [@fastify/swagger](https://github.com/fastify/fastify-swagger) (default: `true`).

### Configuring CORS Asynchronously

```js
const fastify = require('fastify')()

fastify.register(require('@fastify/cors'), (instance) => {
  return (req, callback) => {
    const corsOptions = {
      // This is NOT recommended for production as it enables reflection exploits
      origin: true
    };

    // do not include CORS headers for requests from localhost
    if (/^localhost$/m.test(req.headers.origin)) {
      corsOptions.origin = false
    }

    // callback expects two parameters: error and options
    callback(null, corsOptions)
  }
})

fastify.register(async function (fastify) {
  fastify.get('/', (req, reply) => {
    reply.send({ hello: 'world' })
  })
})

fastify.listen({ port: 3000 })
```

### Custom Fastify hook name

By default, `@fastify/cors` adds a `onRequest` hook where the validation and header injection are executed. This can be customized by passing `hook` in the options. Valid values are `onRequest`, `preParsing`, `preValidation`, `preHandler`, `preSerialization`, and `onSend`.

```js
import Fastify from 'fastify'
import cors from '@fastify/cors'

const fastify = Fastify()
await fastify.register(cors, { 
  hook: 'preHandler',
})

fastify.get('/', (req, reply) => {
  reply.send({ hello: 'world' })
})

await fastify.listen({ port: 3000 })
```

When configuring CORS asynchronously, an object with `delegator` key is expected:

```js
const fastify = require('fastify')()

fastify.register(require('@fastify/cors'), {
  hook: 'preHandler',
  delegator: (req, callback) => {
    const corsOptions = {
      // This is NOT recommended for production as it enables reflection exploits
      origin: true
    };

    // do not include CORS headers for requests from localhost
    if (/^localhost$/m.test(req.headers.origin)) {
      corsOptions.origin = false
    }

    // callback expects two parameters: error and options
    callback(null, corsOptions)
  },
})

fastify.register(async function (fastify) {
  fastify.get('/', (req, reply) => {
    reply.send({ hello: 'world' })
  })
})

fastify.listen({ port: 3000 })
```

## Acknowledgements

The code is a port for Fastify of [`expressjs/cors`](https://github.com/expressjs/cors).

## License

Licensed under [MIT](./LICENSE).<br/>
[`expressjs/cors` license](https://github.com/expressjs/cors/blob/master/LICENSE)
