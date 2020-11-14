'use strict'

const append = require('vary').append

// https://github.com/fastify/fastify-sensible/blob/master/lib/vary.js
module.exports = function vary (reply, field) {
  let value = reply.getHeader('Vary') || ''
  const header = Array.isArray(value)
    ? value.join(', ')
    : String(value)

  // set new header
  if ((value = append(header, field))) {
    reply.header('Vary', value)
  }
}
