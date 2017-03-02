'use strict'

require('./compiler')
const Promise = require('bluebird')
const { readAsync } = require('fs-jetpack')
const has = require('stunsail/col/has')
const { isAbsolute, resolve } = require('path')
const getPackageProps = require('npm-package-arg')

const log = require('../../logger')
const { getHooks, registerHook } = require('../hooks')

const {
  directory,
  update,
  getPlugins,
  getLocalPlugins
} = require('./manager')

const modulePath = resolve(directory, 'node_modules')

exports.loadPlugins = context => {
  log.trace('loading plugins...')

  return update(context)
    .then(() => Promise.all([getPlugins(), getLocalPlugins()]))
    .then(([plugins, locals]) => {
      let all = plugins.concat(locals)
      return all.map(plugin => {
        let { name } = getPackageProps(plugin)
        return resolvePluginPath(name)
      })
    })
    .then(paths => paths.forEach(atPath => load(context, atPath)))
}

function load (context, atPath) {
  readAsync(resolve(atPath, 'package.json'), 'json')
  return readAsync(resolve(atPath, 'package.json'), 'json')
    .then(pkg => validate(pkg, atPath))
    .then(pkg => {
      if (!pkg) return

      let { files } = pkg.singularity

      if (files.language) {
        try {
          let location = resolve(atPath, files.language)
          let main = interopRequire(location)
          main(context)
        } catch (e) {
          log.error(`error loading plugin language file (${atPath})`)
        }
      }

      if (files.component) {
        try {
          let location = resolve(atPath, files.component)
          let main = interopRequire(location)
          registerHooks(context, main)
        } catch (e) {
          log.error(`error loading plugin component file (${atPath})`)
          log.error(e.message)
        }
      }

      if (files.module) {
        try {
          let location = resolve(atPath, files.module)
          let main = interopRequire(location)
          main(context)
        } catch (e) {
          log.error(`error loading plugin module file (${atPath})`)
          log.error(e.message)
        }
      }

      log.debug(`plugin loaded: '${pkg.name} (v${pkg.version})'`)
    })
    .catch(e => {
      // if (e.code === 'ENOENT') return null
      // TODO: friendly messages for plugin failures
      log.error(e)
    })
}

function validate (pkg, atPath) {
  if (!has('singularity.files', pkg)) {
    log.error(`invalid plugin package (${atPath})`)
    return
  }

  // TODO: other requirements like version compatibility

  return pkg
}

function registerHooks (context, component) {
  getHooks().forEach(hook => {
    let method = component[hook]
    if (method && typeof method === 'function') {
      if (hook === 'setup') {
        method.call(context, context)
      }

      registerHook(hook, method)
    }
  })
}

function resolvePluginPath (name) {
  return isAbsolute(name) ? name : resolve(modulePath, name)
}

function interopRequire (path) {
  let o = require(path)
  return o && o.__esModule ? o.default : o
}
