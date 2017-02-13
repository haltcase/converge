'use strict'

const { join } = require('path')
const { create } = require('logger-neue').default

const { paths } = require('../constants')

// const isDev = process.env.NODE_ENV === 'development'

module.exports = create({
  file: {
    path: join(paths.log, 'app.log'),
    level: 'error'
  },
  console: {
    level: /* isDev ? 'trace' : 'error' */ 'absurd',
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
