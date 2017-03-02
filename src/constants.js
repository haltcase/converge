'use strict'

const getPaths = require('env-paths')
const { resolve } = require('path')

const { name } = require('../package.json')

let paths = getPaths(name, { suffix: '' })
paths.app = resolve(paths.data, '..')
paths.content = resolve(paths.data, 'content')

exports.paths = paths
