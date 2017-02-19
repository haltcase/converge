'use strict'

const { join } = require('path')
const { create } = require('logger-neue')

const { paths } = require('./constants')

module.exports = create({
  file: {
    path: join(paths.log, 'app.log'),
    level: 'error'
  },
  console: {
    level: 'error',
    fullColor: true
  },
  levels: {
    /* eslint-disable key-spacing */
    error:  [0, ['red', 'bold', 'underline']],
    warn:   [1, 'yellow'],
    info:   [2, 'magenta'],
    debug:  [3, 'cyan'],
    trace:  [4],
    absurd: [5, 'gray']
    /* eslint-enable key-spacing */
  }
})
