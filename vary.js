'use strict'

const LRUCache = require('mnemonist').LRUCache
const cache = new LRUCache(1000)

function parse (header) {
  if (Array.isArray(header)) {
    return header
  }

  if (!cache.has(header)) {
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
    cache.set(header, result)
  }

  return cache.get(header)
}

// https://github.com/fastify/fastify-sensible/blob/master/lib/vary.js
function vary (reply, field) {
  const header = reply.getHeader('Vary')

  if (!header) {
    reply.header('Vary', field)
    return
  }

  if (header === '*') {
    reply.header('Vary', '*')
    return
  }

  const vals = parse(header)

  if (vals.indexOf('*') !== -1) {
    reply.header('Vary', '*')
    return
  }

  if (vals.indexOf(field.toLowerCase()) === -1) {
    reply.header('Vary', header + ', ' + field)
  }
}

module.exports.vary = vary
module.exports.parse = parse
