'use strict'

const getPaths = require('env-paths')
const { resolve } = require('path')

const { name } = require('../package.json')

let paths = getPaths(name, { suffix: '' })
paths.app = resolve(paths.data, '..')
paths.content = resolve(paths.data, 'content')

exports.paths = paths
exports.clientID = 'ejigh97i4w638sdoild5cvile1ajwim'
