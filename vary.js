'use strict'

function parse (header) {
  if (header.indexOf(',') === -1) {
    return [header.trim()]
  }

  const result = []

  let end = header.length
  let start = end
  let char
  let i

  for (i = end - 1; i >= 0; --i) {
    char = header[i]
    if (char === ' ') {
      (start === end) && (start = end = i)
    } else if (char === ',') {
      (start !== end) && result.push(header.slice(start, end))
      start = end = i
    } else {
      start = i
    }
  }

  (start !== end) && result.push(header.slice(start, end))

  return result
}

// https://github.com/fastify/fastify-sensible/blob/master/lib/vary.js
module.exports = function vary (reply, field) {
  const header = reply.getHeader('Vary')

  if (!header) {
    reply.header('Vary', field)
    return
  }

  if (header === '*') {
    reply.header('Vary', '*')
    return
  }

  const vals = (!Array.isArray(header) && parse(header.toLowerCase())) || header

  if (vals.indexOf('*') !== -1) {
    reply.header('Vary', '*')
    return
  }

  if (vals.indexOf(field.toLowerCase()) === -1) {
    reply.header('Vary', header + ', ' + field)
  }
}
