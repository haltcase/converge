'use strict'

const { name } = require('../package.json')
const getPaths = require('env-paths')

exports.paths = getPaths(name, { suffix: '' })
