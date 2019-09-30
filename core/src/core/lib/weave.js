import { get, getOr, isString, pathDots, pathLinks, set } from 'stunsail'

import strat from 'strat'
import callsites from 'callsites'
import { sync as find } from 'find-up'
import { sync as getLocale } from 'os-locale'
import { dirname, resolve } from 'path'
import { exists, read, write, copy } from 'fs-jetpack'

import log from '../../logger'
import { paths } from '../../constants'

const EXISTING_FILE = 'Cannot overwrite existing language file.'
const MISSING_FILE = 'Language file not found.'
const MISSING_STRING = 'Unknown language string.'
const INVALID_PATH = 'Invalid language string, confirm language path.'

const directory = {
  en_029: 'en-US',
  en_AU: 'en-US',
  en_BZ: 'en-US',
  en_CA: 'en-US',
  en_GB: 'en-US',
  en_IE: 'en-US',
  en_IN: 'en-US',
  en_JM: 'en-US',
  en_MY: 'en-US',
  en_NZ: 'en-US',
  en_PH: 'en-US',
  en_SG: 'en-US',
  en_TT: 'en-US',
  en_ZA: 'en-US',
  en_ZW: 'en-US'
}

const readConfig = () => {
  const configPath = resolve(paths.data, 'lang', 'config.json')
  return read(configPath, 'json') || {}
}

const writeConfig = data => {
  const configPath = resolve(paths.data, 'lang', 'config.json')
  return write(configPath, data)
}

const getConfig = (key, defaultValue) => {
  const keyPath = pathLinks(key)
  return getOr(readConfig(), pathDots(keyPath), defaultValue)
}

const setConfig = (key, value) => {
  const keyPath = pathLinks(key)
  const updated = set(readConfig(), keyPath, value)
  writeConfig(updated)
  return updated
}

const getPath = () => {
  const defaultPath = resolve(__dirname, '..', 'lang')
  const osLocale = getLocale()
  const locale = directory[osLocale] || osLocale || 'en-US'
  const fallback = resolve(defaultPath, `${locale}.json`)
  const current = getConfig('current', fallback)

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

const readCore = () => read(getPath(), 'json') || {}

const plugins = {}
let core = readCore()

const sanitizeFileName = input => {
  // TODO
  return input
}

const getKeyPath = (callsite, key) => {
  const caller = callsite[1].getFileName()
  const manifest = find('package.json', { cwd: dirname(caller) })
  const { name } = read(manifest, 'json') || { name: '' }
  const keyPath = pathLinks(key)

  keyPath.unshift(name)
  return keyPath
}

/**
 * @param {import('@converge/types/index').Core} context
 */
export default context => {
  const weave = (key, ...replacements) => {
    const str = get(plugins, getKeyPath(callsites(), key))

    if (!str) return MISSING_STRING
    if (!isString(str)) return INVALID_PATH

    return strat(str, replacements)
  }

  weave.core = (key, ...replacements) => {
    const keyPath = pathLinks(key)
    keyPath.unshift('bot', 'core')
    const str = get(core, pathDots(keyPath))

    if (!str) return MISSING_STRING
    if (!isString(str)) return INVALID_PATH

    return strat(str, replacements)
  }

  weave.set = (key, str) => {
    if (!isString(key) || !isString(str)) {
      return false
    }

    set(plugins, getKeyPath(callsites(), key), str)
    return true
  }

  weave.fork = toFile => {
    const outFile = sanitizeFileName(toFile)
    const outPath = resolve(paths.data, 'lang', outFile)

    if (exists(outPath) === 'file') {
      log.error(EXISTING_FILE)
      return
    }

    copy(getPath(), outPath)
    setConfig('current', outPath)
    core = readCore()
  }

  context.extend({ weave })
}
