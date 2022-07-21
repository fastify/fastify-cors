'use strict'

const test = require('tap').test
const createAddFieldnameToVary = require('../vary').createAddFieldnameToVary
const parse = require('../vary').parse

test('Should set * even if we set a specific field', t => {
  t.plan(1)

  const addOriginToVary = createAddFieldnameToVary('Origin')
  const replyMock = {
    getHeader (name) {
      return '*'
    },
    header (name, value) {
      t.fail('Should not be here')
    }
  }

  addOriginToVary(replyMock)
  t.pass()
})

test('Should set * even if we set a specific field', t => {
  t.plan(2)

  const addWildcardToVary = createAddFieldnameToVary('*')
  const replyMock = {
    getHeader (name) {
      return 'Origin'
    },
    header (name, value) {
      t.same(name, 'Vary')
      t.same(value, '*')
    }
  }

  addWildcardToVary(replyMock)
})

test('Should set * when field contains a *', t => {
  t.plan(3)

  const addOriginToVary = createAddFieldnameToVary('Origin')
  const replyMock = {
    getHeader (name) {
      return ['Origin', '*', 'Access-Control-Request-Headers']
    },
    header (name, value) {
      t.same(name, 'Vary')
      t.same(value, '*')
    }
  }

  addOriginToVary(replyMock)
  t.pass()
})

test('Should concat vary values', t => {
  t.plan(3)

  const addOriginToVary = createAddFieldnameToVary('Origin')
  const replyMock = {
    getHeader (name) {
      return 'Access-Control-Request-Headers'
    },
    header (name, value) {
      t.same(name, 'Vary')
      t.same(value, 'Access-Control-Request-Headers, Origin')
    }
  }

  addOriginToVary(replyMock)
  t.pass()
})

test('Should concat vary values ignoring consecutive commas', t => {
  t.plan(3)

  const addOriginToVary = createAddFieldnameToVary('Origin')
  const replyMock = {
    getHeader (name) {
      return ' Access-Control-Request-Headers,Access-Control-Request-Method'
    },
    header (name, value) {
      t.same(name, 'Vary')
      t.same(value, ' Access-Control-Request-Headers,Access-Control-Request-Method, Origin')
    }
  }

  addOriginToVary(replyMock)
  t.pass()
})

test('Should concat vary values ignoring whitespace', t => {
  t.plan(3)

  const addOriginToVary = createAddFieldnameToVary('Origin')
  const replyMock = {
    getHeader (name) {
      return ' Access-Control-Request-Headers ,Access-Control-Request-Method'
    },
    header (name, value) {
      t.same(name, 'Vary')
      t.same(value, ' Access-Control-Request-Headers ,Access-Control-Request-Method, Origin')
    }
  }

  addOriginToVary(replyMock)
  t.pass()
})

test('Should set the field as value for vary if no vary is defined', t => {
  t.plan(2)

  const addOriginToVary = createAddFieldnameToVary('Origin')
  const replyMock = {
    getHeader (name) {
      return undefined
    },
    header (name, value) {
      t.same(name, 'Vary')
      t.same(value, 'Origin')
    }
  }

  addOriginToVary(replyMock)
})

test('Should set * as value for vary if vary contains *', t => {
  t.plan(2)

  const addOriginToVary = createAddFieldnameToVary('Origin')
  const replyMock = {
    getHeader (name) {
      return 'Accept,*'
    },
    header (name, value) {
      t.same(name, 'Vary')
      t.same(value, '*')
    }
  }

  addOriginToVary(replyMock)
})

test('Should set Accept-Encoding as value for vary if vary is empty string', t => {
  t.plan(2)

  const addAcceptEncodingToVary = createAddFieldnameToVary('Accept-Encoding')
  const replyMock = {
    getHeader (name) {
      return ''
    },
    header (name, value) {
      t.same(name, 'Vary')
      t.same(value, 'Accept-Encoding')
    }
  }

  addAcceptEncodingToVary(replyMock)
})

test('Should have no issues with values containing dashes', t => {
  t.plan(2)

  const addXFooToVary = createAddFieldnameToVary('X-Foo')
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

  addXFooToVary(replyMock)
  addXFooToVary(replyMock)
})

test('Should ignore the header as value for vary if it is already in vary', t => {
  t.plan(1)

  const addOriginToVary = createAddFieldnameToVary('Origin')
  const replyMock = {
    getHeader (name) {
      return 'Origin'
    },
    header (name, value) {
      t.fail('Should not be here')
    }
  }
  addOriginToVary(replyMock)
  addOriginToVary(replyMock)
  t.pass()
})

test('parse', t => {
  t.plan(18)
  t.same(parse(''), [])
  t.same(parse('a'), ['a'])
  t.same(parse('a,b'), ['a', 'b'])
  t.same(parse('  a,b'), ['a', 'b'])
  t.same(parse('a,b  '), ['a', 'b'])
  t.same(parse('a,b,c'), ['a', 'b', 'c'])
  t.same(parse('A,b,c'), ['a', 'b', 'c'])
  t.same(parse('a,b,c,'), ['a', 'b', 'c'])
  t.same(parse('a,b,c, '), ['a', 'b', 'c'])
  t.same(parse(',a,b,c'), ['a', 'b', 'c'])
  t.same(parse(' ,a,b,c'), ['a', 'b', 'c'])
  t.same(parse('a,,b,c'), ['a', 'b', 'c'])
  t.same(parse('a,,,b,,c'), ['a', 'b', 'c'])
  t.same(parse('a, b,c'), ['a', 'b', 'c'])
  t.same(parse('a,   b,c'), ['a', 'b', 'c'])
  t.same(parse('a, , b,c'), ['a', 'b', 'c'])
  t.same(parse('a,  , b,c'), ['a', 'b', 'c'])

  // one for the cache
  t.same(parse('A,b,c'), ['a', 'b', 'c'])
})

test('createAddFieldnameToVary', t => {
  t.plan(2)
  t.same(typeof createAddFieldnameToVary('valid-header'), 'function')
  t.throws(() => createAddFieldnameToVary('invalid:header'), TypeError, 'Field contains invalid characters.')
})
