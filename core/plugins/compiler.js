'use strict'

const register = require('babel-register')
const { resolve } = require('path')

const { paths } = require('../../constants')

register({
  only: resolve(paths.data, 'plugins', '**', '*.js'),
  babelrc: false,
  presets: [
    [require('babel-preset-env'), {
      targets: { node: true },
      loose: true
    }],
    require('babel-preset-stage-0')
  ],
  comments: false
})
