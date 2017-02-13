'use strict'

const Trilogy = require('trilogy')
const getPaths = require('env-paths')
const { join } = require('path')
const { readAsync } = require('fs-jetpack')

const Core = require('./core')

const paths = getPaths('singularity-bot', { suffix: '' })

module.exports = function startup (options) {
  console.log('starting up...')
  options.db = new Trilogy(join(paths.data, 'bot.db'))
  return readAsync(options.configPath, 'json')
    .then(config => new Core(config, options))
}
