const strat = require('strat')
const callsites = require('callsites')
const { sync: find } = require('find-up')
const { sync: getLocale } = require('os-locale')
const { dirname, resolve } = require('path')
const { exists, read, write, copy } = require('fs-jetpack')

const {
  get,
  set,
  toPath,
  isString
} = require('lodash')

const log = require('../../logger')
const { paths } = require('../../constants')

const EXISTING_FILE = 'Cannot overwrite existing language file.'
const MISSING_FILE = 'Language file not found.'
const MISSING_STRING = 'Unknown language string.'
const INVALID_PATH = 'Invalid language string, confirm language path.'

const directory = {
  'en_029': 'en_US',
  'en_AU': 'en_US',
  'en_BZ': 'en_US',
  'en_CA': 'en_US',
  'en_GB': 'en_US',
  'en_IE': 'en_US',
  'en_IN': 'en_US',
  'en_JM': 'en_US',
  'en_MY': 'en_US',
  'en_NZ': 'en_US',
  'en_PH': 'en_US',
  'en_SG': 'en_US',
  'en_TT': 'en_US',
  'en_ZA': 'en_US',
  'en_ZW': 'en_US'
}

let readCore = () => read(getPath(), 'json') || {}

let core = readCore()
let plugins = {}

module.exports = context => {
  function weave (key /*, ...replacements */) {
    let replacements = context.to.array(arguments, 1)
    let str = get(plugins, getKeyPath(callsites(), key))
    if (!str) return MISSING_STRING
    if (!isString(str)) return INVALID_PATH
    return strat(str, replacements)
  }

  weave.core = function (key /*, ...replacements */) {
    let replacements = context.to.array(arguments, 1)
    let keyPath = toPath(key)
    keyPath.unshift('bot', 'core')
    let str = get(core, keyPath)
    if (!str) return MISSING_STRING
    if (!isString(str)) return INVALID_PATH
    return strat(str, replacements)
  }

  weave.set = function (key, str) {
    if (arguments.length < 2 || !isString(key) || !isString(str)) {
      return false
    }

    set(plugins, getKeyPath(callsites(), key), str)
    return true
  }

  weave.fork = function (toFile) {
    let outFile = sanitizeFileName(toFile)
    let outPath = resolve(paths.data, 'lang', outFile)

    if (exists(outPath) === 'file') {
      log.error(EXISTING_FILE)
      return
    }

    copy(getPath(), outPath)
    setConfig('current', outPath)
    core = readCore()
  }

  context.extend({
    weave
  })
}

function sanitizeFileName (input) {
  // TODO
  return input
}

function getKeyPath (callsite, key) {
  let caller = callsite[1].getFileName()
  let manifest = find('package.json', { cwd: dirname(caller) })
  let { name } = read(manifest, 'json') || { name: '' }
  let keyPath = toPath(key)
  keyPath.unshift(name)
  return keyPath
}

function getPath () {
  let defaultPath = resolve(__dirname, '..', 'lang')
  let osLocale = getLocale()
  let locale = directory[osLocale] || osLocale || 'en_US'
  let fallback = resolve(defaultPath, `${locale}.json`)

  let current = getConfig('current', fallback)

  if (exists(current) !== 'file') {
    if (exists(fallback) !== 'file') {
      throw new Error(MISSING_FILE)
    } else {
      return fallback
    }
  } else {
    return current
  }
}

function getConfig (key, defaultValue) {
  let keyPath = toPath(key)
  return get(readConfig(), keyPath, defaultValue)
}

function setConfig (key, value) {
  let keyPath = toPath(key)
  let updated = set(readConfig(), keyPath, value)
  writeConfig(updated)
  return updated
}

function readConfig () {
  let configPath = resolve(paths.data, 'lang', 'config.json')
  return read(configPath, 'json') || {}
}

function writeConfig (data) {
  let configPath = resolve(paths.data, 'lang', 'config.json')
  return write(configPath, data)
}
