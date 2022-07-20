'use strict'

const LRUCache = require('mnemonist').LRUCache
const headerCache = new LRUCache(1000)
const fieldnameValidationCache = new LRUCache(1000)

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

const fieldnameRE = /^[!#$%&'*+\-.^_`|~0-9A-Za-z]+$/
function validateFieldname (fieldname) {
  if (!fieldnameValidationCache.has(fieldname)) {
    if (fieldnameRE.test(fieldname)) {
      fieldnameValidationCache.set(fieldname, false)
    } else {
      fieldnameValidationCache.set(fieldname, new TypeError('Field contains invalid characters.'))
    }
  }
  const result = fieldnameValidationCache.get(fieldname)
  if (result) {
    throw result
  }
}

function parse (header) {
  if (Array.isArray(header)) {
    header = header.join(', ')
  }
  const originalHeader = header

  if (!headerCache.has(originalHeader)) {
    header = header.trim().toLowerCase()
    const result = []

    if (header.length === 0) {
      // pass through
    } else if (header.indexOf(',') === -1) {
      result.push(header)
    } else {
      const il = header.length
      let i = 0
      let pos = 0
      let char

      // tokenize the header
      for (i = 0; i < il; ++i) {
        char = header[i]
        // when we have whitespace set the pos to the next position
        if (char === ' ') {
          pos = i + 1
        // `,` is the separator of vary-values
        } else if (char === ',') {
          // if pos and current position are not the same we have a valid token
          if (pos !== i) {
            result.push(header.slice(pos, i))
          }
          // reset the positions
          pos = i + 1
        }
      }

      if (pos !== i) {
        result.push(header.slice(pos, i))
      }
    }
    headerCache.set(originalHeader, result)
  }

  return headerCache.get(originalHeader)
}

// https://github.com/fastify/fastify-sensible/blob/master/lib/vary.js
function vary (reply, fieldname) {
  const header = reply.getHeader('Vary')

  validateFieldname(fieldname)

  if (!header) {
    reply.header('Vary', fieldname)
    return
  }

  if (header === '*') {
    return
  }

  if (fieldname === '*') {
    reply.header('Vary', '*')
    return
  }

  const vals = parse(header)

  if (vals.indexOf('*') !== -1) {
    reply.header('Vary', '*')
    return
  }

  if (vals.indexOf(fieldname.toLowerCase()) === -1) {
    reply.header('Vary', Array.isArray(header)
      ? header.join(', ') + ', ' + fieldname
      : header + ', ' + fieldname
    )
  }
}

module.exports.vary = vary
module.exports.parse = parse
