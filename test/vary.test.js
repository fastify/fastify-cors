'use strict'

const test = require('tap').test
const fieldnameRegex = require('../vary').fieldnameRegex
const vary = require('../vary').vary
const escapeRegex = require('../vary').escapeRegex

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

test('Should throw if field name is invalid', t => {
  t.plan(2)

  const replyMock = {
    getHeader (name) {
      return undefined
    },
    header (name, value) {
      t.fail('Should not be here')
    }
  }

  t.throws(() => vary(replyMock, 'invalid[]'), TypeError, 'Field contains invalid characters.')
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

test('Should concat vary values ignoring consecutive commas', t => {
  t.plan(3)

  const replyMock = {
    getHeader (name) {
      return ' Access-Control-Request-Headers,Access-Control-Request-Method'
    },
    header (name, value) {
      t.same(name, 'Vary')
      t.same(value, ' Access-Control-Request-Headers,Access-Control-Request-Method, Origin')
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

test('Should set * as value for vary if vary contains *', t => {
  t.plan(2)

  const replyMock = {
    getHeader (name) {
      return 'Accept,*'
    },
    header (name, value) {
      t.same(name, 'Vary')
      t.same(value, '*')
    }
  }

  vary(replyMock, 'Origin')
})

test('Should set Accept-Encoding as value for vary if vary is empty string', t => {
  t.plan(2)

  const replyMock = {
    getHeader (name) {
      return ''
    },
    header (name, value) {
      t.same(name, 'Vary')
      t.same(value, 'Accept-Encoding')
    }
  }

  vary(replyMock, 'Accept-Encoding')
})

test('Should have no issues with values containing dashes', t => {
  t.plan(2)

  const replyMock = {
    value: 'Accept-Encoding',
    getHeader (name) {
      return this.value
    },
    header (name, value) {
      t.same(name, 'Vary')
      t.same(value, 'Accept-Encoding, X-Foo')
      this.value = value
    }
  }

  vary(replyMock, 'X-Foo')
  vary(replyMock, 'X-Foo')
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

test('escapeRegex', t => {
  t.plan(15)
  t.same(escapeRegex('!'), '!')
  t.same(escapeRegex('#'), '#')
  t.same(escapeRegex('$'), '\\$')
  t.same(escapeRegex('%'), '%')
  t.same(escapeRegex('&'), '&')
  t.same(escapeRegex('\''), '\'')
  t.same(escapeRegex('*'), '\\*')
  t.same(escapeRegex('+'), '\\+')
  t.same(escapeRegex('-'), '\\-')
  t.same(escapeRegex('.'), '\\.')
  t.same(escapeRegex('^'), '\\^')
  t.same(escapeRegex('_'), '_')
  t.same(escapeRegex('`'), '`')
  t.same(escapeRegex('|'), '\\|')
  t.same(escapeRegex('~'), '~')
})

test('fieldnameRegex', t => {
  t.plan(17)
  t.throws(() => fieldnameRegex('invalid[]'), TypeError, 'Field contains invalid characters.')
  t.throws(() => fieldnameRegex('invalid:header'), TypeError, 'Field contains invalid characters.')
  t.throws(() => fieldnameRegex('invalid header'), TypeError, 'Field contains invalid characters.')
  t.throws(() => fieldnameRegex('invalid\nheader'), TypeError, 'Field contains invalid characters.')
  t.throws(() => fieldnameRegex('invalid\u0080header'), TypeError, 'Field contains invalid characters.')
  t.same(fieldnameRegex('Origin').test('Origin'), true)
  t.same(fieldnameRegex('Origin').test('Or igin'), false)
  t.same(fieldnameRegex('Origin').test('Origin,'), true)
  t.same(fieldnameRegex('Origin').test('Origin, '), true)
  t.same(fieldnameRegex('Origin').test(',Origin, '), true)
  t.same(fieldnameRegex('Origin').test(',,Origin,, '), true)
  t.same(fieldnameRegex('Origin').test(',Origin-Variant, '), false)
  t.same(fieldnameRegex('Origin').test(',Origin-Variant, Origin '), true)
  t.same(fieldnameRegex('Origin').test(',Origin-Variant, Or igin '), false)
  t.same(fieldnameRegex('Origin-Variant').test(',Origin'), false)
  t.same(fieldnameRegex('Origin-Variant').test(',Origin - Variant'), false)
  t.same(fieldnameRegex('Origin-Variant').test(',Origin-Variant'), true)
})
