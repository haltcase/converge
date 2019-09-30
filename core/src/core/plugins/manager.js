import { _, it } from 'param.macro'

import { join, resolve } from 'path'
import { extract, manifest } from 'pacote'
import getPackageProps from 'npm-package-arg'
import { satisfies } from 'semver'
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

export const getPlugins = () =>
  readManifest().then(it.plugins)

export const getLocalPlugins = () =>
  readManifest().then(it.localPlugins)

const toPackageName = getPackageProps(_).name

export const install = async context => {
  context.emit('plugins:install:start')

  const manifest = await readManifest()

  for (const plugin of manifest.plugins) {
    await installPlugin(context, plugin)
  }

  for (const plugin of manifest.localPlugins) {
    if (!(plugin |> toPackageName |> join(modulesPath, _) |> exists)) {
      plugin |> localPluginNotFoundError |> log.warn
    } else {
      await installPlugin(context, plugin, { isLocal: true })
    }
  }

  context.emit('plugins:install:done')
}

const handlePluginFetchError = error => {
  if (error.code === 'E404') {
    error |> pluginNotFoundError |> log.error
  } else if (error.code === 'ETARGET') {
    error.message.split('\n')[0] |> log.error
  }

  return {}
}

const getDependencies =
  _ |> toPackageName |> join(modulesPath, _, 'package.json')
    |> readAsync(_, 'json').then(it.dependencies || {})

const isCompatible = range =>
  satisfies(appVersion, range, { includePrerelease: true })

export const installPlugin = async (context, spec, {
  isTransitive = false,
  installPath = modulesPath,
  isLocal = false
} = {}) => {
  const {
    name,
    dependencies,
    _resolved,
    engines
  } = isLocal
    ? { name: toPackageName(spec), dependencies: await getDependencies(spec) }
    : await manifest(spec).catch(handlePluginFetchError)

  const pkgRoot = join(installPath, name)

  if (!isLocal && !exists(pkgRoot)) {
    ;(isTransitive ? 'dependency' : 'plugin')
      |> log.trace(`installing ${_} ${name} from npm`)

    if (!_resolved) return false

    if (!isTransitive) {
      if (!isCompatible(engines?.[pluginPackageKey])) {
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

export const uninstallPlugin = async (context, name) => {
  const manifest = await readManifest()
  const i = manifest.plugins.findIndex(toPackageName(_) === name)

  if (i >= 0) {
    manifest.plugins.splice(i, 1)
    await writeAsync(manifestPath, TOML.stringify(manifest))
  }

  await removeAsync(join(modulesPath, name))
}
