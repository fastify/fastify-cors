'use strict'

const { test } = require('tap')
const vary = require('../vary')

test('Should set * even if we set a specific field', t => {
  t.plan(3)

  const replyMock = {
    getHeader (name) {
      return '*'
    },
    header (name, value) {
      t.same(name, 'Vary')
      t.same(value, '*')
    }
  }

  vary(replyMock, 'Origin')
  t.pass()
})

test('Should set * when field contains a *', t => {
  t.plan(3)

  const replyMock = {
    getHeader (name) {
      return ['Origin', '*', 'Access-Control-Request-Headers']
    },
    header (name, value) {
      t.same(name, 'Vary')
      t.same(value, '*')
    }
  }

  vary(replyMock, 'Origin')
  t.pass()
})

test('Should concat vary values', t => {
  t.plan(3)

  const replyMock = {
    getHeader (name) {
      return 'Access-Control-Request-Headers'
    },
    header (name, value) {
      t.same(name, 'Vary')
      t.same(value, 'Access-Control-Request-Headers, Origin')
    }
  }

  vary(replyMock, 'Origin')
  t.pass()
})

test('Should concat vary values ignoring whitespace', t => {
  t.plan(3)

  const replyMock = {
    getHeader (name) {
      return ' Access-Control-Request-Headers ,Access-Control-Request-Method'
    },
    header (name, value) {
      t.same(name, 'Vary')
      t.same(value, ' Access-Control-Request-Headers ,Access-Control-Request-Method, Origin')
    }
  }

  vary(replyMock, 'Origin')
  t.pass()
})

test('Should set the field as value for vary if no vary is defined', t => {
  t.plan(2)

  const replyMock = {
    getHeader (name) {
      return undefined
    },
    header (name, value) {
      t.same(name, 'Vary')
      t.same(value, 'Origin')
    }
  }

  vary(replyMock, 'Origin')
})

test('Should ignore the header as value for vary if it is already in vary', t => {
  t.plan(1)

  const replyMock = {
    getHeader (name) {
      return 'Origin'
    },
    header (name, value) {
      t.fail('Should not be here')
    }
  }

  vary(replyMock, 'Origin')
  t.pass()
})
