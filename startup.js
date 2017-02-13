'use strict'

const Trilogy = require('trilogy')
const { join } = require('path')
const { readAsync } = require('fs-jetpack')

const Core = require('./core')
const log = require('./core/logger')
const { paths } = require('./constants')


module.exports = function startup (options) {
  log.trace('starting up...')
  options.db = new Trilogy(join(paths.data, 'bot.db'))
  return readAsync(options.configPath, 'json')
    .then(config => new Core(config, options))
}
