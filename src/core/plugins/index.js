import { _, it } from 'param.macro'
import codegen from 'codegen.macro'

import { isAbsolute, resolve } from 'path'

import FP from 'functional-promises'
import getPackageProps from 'npm-package-arg'
import { each, has, isFunction, partition, isObject, getType } from 'stunsail'

import './compiler'
import { pluginPackageKey } from '../../constants'
import { builtinHooks, registerHook, registerPluginHook } from '../hooks'
import log from '../../logger'

import {
  directory,
  install,
  getPlugins,
  getLocalPlugins
} from './manager'

const modulePath = resolve(directory, 'node_modules')
export const internalPluginDirectory = resolve(__dirname, 'internal')
export { directory as externalPluginDirectory }

const internalPackages = codegen.require('./internal-packages')

const interopRequire = path => {
  const o = require(path)
  return (o.__esModule && o.default) || o
}

const loadInternalPlugins = context =>
  internalPackages.map(load(context, _, true))

const loadFile = (atPath, file, load) =>
  resolve(atPath, file) |> interopRequire |> load

const validate = (pkg, atPath, internal) => {
  if (internal) return pkg

  if (!has(pkg, [pluginPackageKey, 'files'])) {
    log.error(`Invalid plugin package (${atPath})`)
    return
  }

  return pkg
}

const registerHooks = (context, component) => {
  const [builtins, plugins] = partition(component, (value, key) => {
    return builtinHooks.has(key)
  })

  each(builtins, (method, hook) => {
    if (!isFunction(method)) {
      context.log.error(
        'Hooks must be known methods or objects for plugins, but ' +
        `${hook} was of type ${getType(method)}`
      )

      return
    }

    if (hook === 'setup') {
      method.call(context, context)
    }

    registerHook(hook, method)
  })

  each(plugins, (pluginHooks, plugin) => {
    if (!isObject(pluginHooks)) {
      context.log.error(
        'Hooks must be known methods or objects for plugins, but ' +
        `${plugin} was of type ${getType(pluginHooks)}`
      )
    }

    each(pluginHooks, (method, hook) => {
      registerPluginHook(plugin, hook, method)
    })
  })
}

const resolvePluginPath = name =>
  isAbsolute(name) ? name : resolve(modulePath, name)

const loadError = (e, atPath, type) => {
  log.error(`Error loading plugin ${type} file (${atPath})`)
  log.error(e.message, e.stack)
}

const load = async (context, atPath, internal) => {
  let pkg
  try {
    pkg = require(resolve(atPath, 'package.json'))
  } catch (e) {
    log.error(e.message)
  }

  if (!validate(pkg, atPath, internal)) return

  const { files } = pkg[pluginPackageKey]

  if (files.language) {
    try {
      loadFile(atPath, files.language, it(context))
    } catch (e) {
      loadError(e, atPath, 'language')
    }
  }

  if (files.component) {
    try {
      loadFile(atPath, files.component, registerHooks(context, _))
    } catch (e) {
      loadError(e, atPath, 'component')
    }
  }

  if (files.module) {
    try {
      loadFile(atPath, files.module, it.setup(context))
    } catch (e) {
      loadError(e, atPath, 'module')
    }
  }

  log.debug(`plugin loaded: '${pkg.name} (v${pkg.version})'`)
}

export const loadPlugins = async context => {
  log.trace('loading plugins...')

  await FP.all(loadInternalPlugins(context))
  await install(context)

  const [plugins, locals] = await FP.all([
    getPlugins(),
    getLocalPlugins()
  ])

  const all = [...plugins, ...locals]
  const paths = all.map(getPackageProps(_).name |> resolvePluginPath)
  await FP.all(paths.map(load(context, _)))
}
