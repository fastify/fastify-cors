'use strict'

const LRU = require('tiny-lru')
const regexCache = new LRU(1000)

/**
 * RegExp to match field-name in RFC 7230 sec 3.2
 *
 * field-name    = token
 * token         = 1*tchar
 * tchar         = "!" / "#" / "$" / "%" / "&" / "'" / "*"
 *               / "+" / "-" / "." / "^" / "_" / "`" / "|" / "~"
 *               / DIGIT / ALPHA
 *               ; any VCHAR, except delimiters
 */

const fieldnameChars = '!#$%&\'*+-.^_`|~0-9A-Za-z'
const fieldNameRE = new RegExp(`^[${fieldnameChars}]+$`)
const wildcardRE = fieldRegex('*', '')

function escapeRegex (value) {
  return value.replace(/[$*+-.^|]/g, '\\$&')
}

function fieldRegex (field, flags = 'i') {
  if (fieldNameRE.test(field) === false) {
    throw new TypeError('field argument contains an invalid header name')
  }
  const escapedField = escapeRegex(field)
  return new RegExp(`(^|(.*,))[^${fieldnameChars}]*${escapedField}[^${fieldnameChars}]*(,.*|$)`, flags)
}

// https://github.com/fastify/fastify-sensible/blob/master/lib/vary.js
function vary (reply, field) {
  let header = reply.getHeader('Vary')

  if (!header) {
    if (fieldNameRE.test(field) === false) {
      throw new TypeError('field argument contains an invalid header name')
    }
    reply.header('Vary', field)
    return
  }

  if (Array.isArray(header)) {
    header = header.join(', ')
  }

  if (wildcardRE.test(header)) {
    reply.header('Vary', '*')
    return
  }

  if (!regexCache.has(field)) {
    regexCache.set(field, fieldRegex(field))
  }

  if (regexCache.get(field).test(header) === false) {
    reply.header('Vary', header + ', ' + field)
  }
}

module.exports.escapeRegex = escapeRegex
module.exports.fieldRegex = fieldRegex
module.exports.vary = vary
