'use strict'

const { EOL } = require('os')
const { resolve, normalize, isAbsolute } = require('path')
const isValidPath = require('is-valid-path')

const {
  readAsync,
  writeAsync,
  appendAsync,
  existsAsync
} = require('fs-jetpack')

const { paths } = require('../../constants')

module.exports = context => {
  context.extend({
    file: {
      read,
      write,
      exists
    }
  })

  /*
  context.on('beforeMessage', ($, e) => {
    let now = new Date().toISOString()
    return write('chat.txt', `${now} :: ${e.sender} -> ${e.raw}`, true)
  })
  */
}

function read (path, json) {
  if (!path || !isValidPath(path)) {
    let err = new Error('invalid file path')
    return Promise.reject(err)
  }

  return readAsync(sanitize(path), json ? 'json' : undefined)
}

function write (path, data, append) {
  if (!path || !isValidPath(path)) {
    let err = new Error('invalid file path')
    return Promise.reject(err)
  }

  if (append) {
    let writeable = String(data) + EOL
    return appendAsync(sanitize(path), writeable)
  } else {
    return writeAsync(sanitize(path), data)
  }
}

function exists (path) {
  if (!path || !isValidPath(path)) {
    let err = new Error('invalid file path')
    return Promise.reject(err)
  }

  return existsAsync(path).then(type => type === 'file')
}

function sanitize (path) {
  if (isAbsolute(path)) {
    let input = normalize(path)
    let target = normalize(paths.content)
    if (!input.startsWith(target)) return
  }

  return resolve(paths.content, path)
}
