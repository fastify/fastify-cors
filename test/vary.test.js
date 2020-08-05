'use strict'

const { test } = require('tap')
const vary = require('../vary')

test('Should not set reply header if none is passed', t => {
  t.plan(1)

  const replyMock = {
    getHeader (name) {
      return []
    },
    header (name, value) {
      t.fail('Should not be here')
    }
  }

  vary(replyMock, [])
  t.pass()
})
