'use strict'

const LRU = require('tiny-lru')
const regexCache = new LRU(1000)

/**
 * Field Value Components
 * Most HTTP header field values are defined using common syntax
 * components (token, quoted-string, and comment) separated by
 * whitespace or specific delimiting characters.  Delimiters are chosen
 * from the set of US-ASCII visual characters not allowed in a token
 * (DQUOTE and "(),/:;<=>?@[\]{}").
 *
 * field-name    = token
 * token         = 1*tchar
 * tchar         = "!" / "#" / "$" / "%" / "&" / "'" / "*"
 *               / "+" / "-" / "." / "^" / "_" / "`" / "|" / "~"
 *               / DIGIT / ALPHA
 *               ; any VCHAR, except delimiters
 *
 * @see https://datatracker.ietf.org/doc/html/rfc7230#section-3.2.6
 */

const tcharRFC7230 = '!#$%&\'*+-.^_`|~0-9A-Za-z'
const fieldnameRE = new RegExp(`^[${tcharRFC7230}]+$`)
const wildcardRE = fieldRegex('*', '')

function escapeRegex (value) {
  return value.replace(/[$*+-.^|]/g, '\\$&')
}

function fieldRegex (field, flags = 'i') {
  if (fieldnameRE.test(field) === false) {
    throw new TypeError('Field contains invalid characters.')
  }
  const escapedField = escapeRegex(field)
  return new RegExp(`(^|(.*,))[^${tcharRFC7230}]*${escapedField}[^${tcharRFC7230}]*(,.*|$)`, flags)
}

function vary (reply, fieldname) {
  let header = reply.getHeader('Vary')

  if (!header) {
    // looking up in the cache is cheaper than validating the fieldname per Regex
    if (!regexCache.has(fieldname)) {
      regexCache.set(fieldname, fieldRegex(fieldname))
    }
    reply.header('Vary', fieldname)
    return
  }

  if (Array.isArray(header)) {
    header = header.join(', ')
  }

  if (header === '*') {
    reply.header('Vary', '*')
    return
  }

  if (wildcardRE.test(fieldname) || wildcardRE.test(header)) {
    reply.header('Vary', '*')
    return
  }

  if (!regexCache.has(fieldname)) {
    regexCache.set(fieldname, fieldRegex(fieldname))
  }

  if (regexCache.get(fieldname).test(header) === false) {
    reply.header('Vary', header + ', ' + fieldname)
  }
}

module.exports.escapeRegex = escapeRegex
module.exports.fieldnameRegex = fieldRegex
module.exports.vary = vary
