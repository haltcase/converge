import { _ } from 'param.macro'

import { EOL } from 'os'
import { isAbsolute, resolve } from 'path'

import {
  exists,
  readAsync,
  writeAsync,
  appendAsync
} from 'fs-jetpack'

import strat from 'strat'
import { isObject, isArrayLike, toArray, isPrimitive } from 'stunsail'

import isSubdirectory from '../util/is-subdirectory'
import log from '../../logger'
import { paths } from '../../constants'

const chatLogFormat = strat('[{ts}] {sender} -> {message}')

/**
 * @function
 * @param {string}
 * @returns {boolean}
 */
const pathExists = exists(_) === 'file'

/**
 * @param {string} path
 * @returns {string}
 */
const sanitize = async path => {
  if (isAbsolute(path)) {
    if (!path || !isSubdirectory(path, paths.content)) {
      const message =
        'File paths must be within the bot\'s content directory ' +
        `(${paths.content})`

      log.error(message)
      throw new Error(message)
    }
  }

  return resolve(paths.content, path)
}

/**
 * @param {unknown} data
 * @returns {string}
 */
const serialize = data => {
  if (typeof data === 'string') {
    return data
  }

  if (isObject(data)) {
    return JSON.stringify(data, null, 2)
  }

  if (isArrayLike(data)) {
    return data |> toArray |> JSON.stringify(_, null, 2)
  }

  return isPrimitive(data) ? String(data) : data
}

/**
 * @param {string} path
 * @param {{ json: boolean }} [options]
 * @returns {Promise}
 */
const read = (path, { json = false } = {}) =>
  sanitize(path).then(cleaned => readAsync(cleaned, json ? 'json' : undefined))

/**
 * @param {string} path
 * @param {any} data
 * @param {{ append: boolean }} [options]
 * @returns {Promise}
 */
const write = (path, data, { append = false } = {}) =>
  sanitize(path).then(cleanPath => {
    const writeable = `${serialize(data)}${append ? EOL : ''}`

    return append
      ? appendAsync(cleanPath, writeable)
      : writeAsync(cleanPath, writeable)
  })

/**
 * @param {import('@converge/types/index').Core} context
 */
export default async context => {
  context.extend({
    file: {
      read,
      write,
      exists: pathExists
    }
  })

  context.on('beforeMessage', async ($, e) => {
    if (!await $.db.getConfig('enableChatLog', false)) return

    const line = chatLogFormat({
      ts: new Date().toISOString(),
      sender: e.sender,
      message: e.raw
    })

    return write('chat.txt', line, { append: true })
  })
}
