'use strict'

const benchmark = require('benchmark')
const vary = require('vary')
const corsVary = require('../vary').vary

const replyMock = (header) => ({
  getHeader () { return header },
  setHeader () { },
  header () { }
})

new benchmark.Suite()
  .add('vary - field to *', function () { vary(replyMock('*'), 'Accept-Encoding') }, { minSamples: 100 })
  .add('vary - * to field', function () { vary(replyMock('Accept-Encoding'), '*') }, { minSamples: 100 })
  .add('vary - field to empty', function () { vary(replyMock(''), 'Accept-Encoding') }, { minSamples: 100 })
  .add('vary - fields string to empty', function () { vary(replyMock(''), 'Accept') }, { minSamples: 100 })
  .add('vary - field to fields', function () { vary(replyMock('Accept, Accept-Encoding, Accept-Language'), 'X-Foo') }, { minSamples: 100 })

  .add('cors - field to *', function () { corsVary(replyMock('*'), 'Accept-Encoding') }, { minSamples: 100 })
  .add('cors - * to field', function () { corsVary(replyMock('Accept-Encoding'), '*') }, { minSamples: 100 })
  .add('cors - field to empty', function () { corsVary(replyMock(''), 'Accept-Encoding') }, { minSamples: 100 })
  .add('cors - fields string to empty', function () { corsVary(replyMock(''), 'Accept') }, { minSamples: 100 })
  .add('cors - field to fields', function () { corsVary(replyMock('Accept, Accept-Encoding, Accept-Language'), 'X-Foo') }, { minSamples: 100 })

  .on('cycle', function onCycle (event) { console.log(String(event.target)) })
  .run({ async: false })
