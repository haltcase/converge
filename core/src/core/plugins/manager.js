/**
 * @typedef {import('@converge/types').Core} Core
 */

import { _, it } from 'param.macro'

import { join, resolve } from 'path'
import { extract, manifest } from 'pacote'
import getPackageProps from 'npm-package-arg'
import satisfies from 'semver/functions/satisfies'
import TOML from '@iarna/toml'

import {
  exists,
  readAsync,
  removeAsync,
  writeAsync
} from 'fs-jetpack'

import log from '../../logger'
import { paths, pluginPackageKey } from '../../constants'
import { name as appName, version as appVersion } from '../../../package.json'

export const directory = resolve(paths.data, 'plugins')
const modulesPath = resolve(directory, 'node_modules')
const manifestPath = resolve(directory, 'manifest.toml')

const defaultManifest = Object.freeze({
  plugins: [],
  localPlugins: []
})

const manifestParseError =
  `Failed to parse plugin manifest file as JSON, ${_.message}`

const localPluginNotFoundError =
  `Local plugin '${_}' is specified but wasn't found`

const pluginNotFoundError =
  `Could not fetch '${_.pkgid}' from npm, does the package exist?`

const readManifest = () =>
  readAsync(manifestPath)
    .then(TOML.parse(_))
    .then(it || { ...defaultManifest })
    .catch(e => log.error(manifestParseError(e)), { ...defaultManifest })

/**
 * @returns {Promise<string[]>}
 */
export const getPlugins = () =>
  readManifest().then(it.plugins)

/**
 * @returns {Promise<string[]>}
 */
export const getLocalPlugins = () =>
  readManifest().then(it.localPlugins)

/**
 * @type {typeof getPackageProps}
 */
const toPackageName = getPackageProps(_).name

/**
 * @param {Core} context
 */
export const install = async context => {
  context.emit('plugins:install:start')

  const manifest = await readManifest()

  for (const plugin of manifest.plugins) {
    await installPlugin(context, plugin)
  }

  for (const plugin of manifest.localPlugins) {
    if (!exists(join(modulesPath, toPackageName(plugin)))) {
      log.warn(localPluginNotFoundError(plugin))
    } else {
      await installPlugin(context, plugin, { isLocal: true })
    }
  }

  context.emit('plugins:install:done')
}

/**
 * @param {Error} error
 */
const handlePluginFetchError = error => {
  if (error.code === 'E404') {
    log.error(pluginNotFoundError(error))
  } else if (error.code === 'ETARGET') {
    log.error(error.message.split('\n')[0])
  }

  return {}
}

/**
 * @param {string} spec
 */
const getDependencies = spec => {
  const path = join(modulesPath, toPackageName(spec), 'package.json')
  return readAsync(path, 'json').then(it.dependencies || {})
}

/**
 * @param {string} range
 */
const isCompatible = range =>
  satisfies(appVersion, range, { includePrerelease: true })

/**
 * @param {Core} context
 * @param {string} spec
 * @param {{ isLocal?: boolean, isTransitive?: boolean, installPath?: string }} options
 */
export const installPlugin = async (context, spec, {
  isTransitive = false,
  installPath = modulesPath,
  isLocal = false
} = {}) => {
  const {
    name,
    dependencies,
    _resolved,
    [pluginPackageKey]: appData = {}
  } = isLocal
    ? { name: toPackageName(spec), dependencies: await getDependencies(spec) }
    : await manifest(spec).catch(handlePluginFetchError)

  const pkgRoot = join(installPath, name)

  if (!isLocal && !exists(pkgRoot)) {
    const kind = isTransitive ? 'dependency' : 'plugin'
    log.trace(`installing ${kind} ${name} from npm`)

    if (!_resolved) return false

    if (!isTransitive) {
      if (!isCompatible(appData.version)) {
        log.error(`'${name}' does not support ${appName} v${appVersion}`)
        return
      }

      const manifestFile = await readManifest()
      const i = manifestFile.plugins.findIndex(toPackageName(_) === name)
      const { version } = getPackageProps(spec)
      const versionRange = version ? '@' + version : ''

      if (i >= 0) {
        manifestFile.plugins[i] = name + versionRange
      } else {
        manifestFile.plugins.push(name + versionRange)
      }

      await writeAsync(manifestPath, TOML.stringify(manifestFile))
    }

    await extract(_resolved, pkgRoot)
  }

  // recursively install dependencies
  for (const [name, version] of Object.entries(dependencies)) {
    const pkgModules = join(pkgRoot, 'node_modules')
    await installPlugin(context, name + '@' + version, {
      isTransitive: true,
      installPath: pkgModules
    })
  }

  return true
}

/**
 * @param {Core} context
 * @param {string} name
 */
export const uninstallPlugin = async (context, name) => {
  const manifest = await readManifest()
  const i = manifest.plugins.findIndex(toPackageName(_) === name)

  if (i >= 0) {
    manifest.plugins.splice(i, 1)
    await writeAsync(manifestPath, TOML.stringify(manifest))
  }

  await removeAsync(join(modulesPath, name))
}
