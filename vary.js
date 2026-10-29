'use strict'

const { FifoMap: FifoCache } = require('toad-cache')

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

const validFieldnameRE = /^[!#$%&'*+\-.^\w`|~]+$/u
function validateFieldname (fieldname) {
  if (validFieldnameRE.test(fieldname) === false) {
    throw new TypeError('Fieldname contains invalid characters.')
  }
}

function parse (header) {
  header = header.trim().toLowerCase()
  const result = []

  if (header.length === 0) {
    // pass through
  } else if (header.indexOf(',') === -1) {
    result.push(header)
  } else {
    const len = header.length
    let start = 0

    // tokenize the header
    for (let i = 0; i <= len; ++i) {
      if (i === len || header.charCodeAt(i) === 44) {
        let tokenStart = start
        let tokenEnd = i
        while (tokenStart < tokenEnd && (header.charCodeAt(tokenStart) === 32 || header.charCodeAt(tokenStart) === 9)) {
          tokenStart++
        }
        while (tokenEnd > tokenStart && (header.charCodeAt(tokenEnd - 1) === 32 || header.charCodeAt(tokenEnd - 1) === 9)) {
          tokenEnd--
        }
        if (tokenStart < tokenEnd) {
          result.push(header.slice(tokenStart, tokenEnd))
        }
        start = i + 1
      }
    }
  }

  return result
}

function createAddFieldnameToVary (fieldname) {
  const headerCache = new FifoCache(1000)

  validateFieldname(fieldname)

  return function (reply) {
    let header = reply.getHeader('Vary')

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

    if (Array.isArray(header)) {
      header = header.join(', ')
    }

    if (headerCache.get(header) === undefined) {
      const vals = parse(header)

      if (vals.indexOf('*') !== -1) {
        headerCache.set(header, '*')
      } else if (vals.indexOf(fieldname.toLowerCase()) === -1) {
        headerCache.set(header, header + ', ' + fieldname)
      } else {
        headerCache.set(header, null)
      }
    }
    const cached = headerCache.get(header)
    if (cached !== null) {
      reply.header('Vary', cached)
    }
  }
}

module.exports.createAddFieldnameToVary = createAddFieldnameToVary
module.exports.addOriginToVaryHeader = createAddFieldnameToVary('Origin')
module.exports.addAccessControlRequestHeadersToVaryHeader = createAddFieldnameToVary('Access-Control-Request-Headers')
module.exports.parse = parse
