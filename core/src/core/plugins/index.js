/**
 * @typedef {import("@converge/types").Core} Core
 * @typedef {import("@converge/types").PluginLifecycle} PluginLifecycle
 * @typedef {import("@converge/types").HookListener} HookListener
 * @typedef {import("@converge/state").Store} Store
 */

import { _ } from "param.macro"
import codegen from "codegen.macro"

import { isAbsolute, resolve } from "path"

import { exists, readAsync } from "fs-jetpack"
import FP from "functional-promises"
import getPackageProps from "npm-package-arg"
import { each, isFunction, partition, isObject, getType } from "stunsail"

import { setupCompiler } from "./compiler"
import { builtinHooks, registerHook, registerPluginHook } from "../hooks"
import log from "../../logger"

import {
  directory,
  install,
  getPlugins,
  getLocalPlugins
} from "./manager"

const modulePath = resolve(directory, "node_modules")
export const internalPluginDirectory = resolve(__dirname, "internal")
export { directory as externalPluginDirectory }

const internalPackages = codegen.require("./internal-packages")

/**
 * @param {Core} context
 */
const loadInternalPlugins = context =>
  internalPackages.map(load(context, _, true))

const extensions = [".js", ".ts"]

/**
 * @param {object} pkg
 * @param {string} atPath
 * @param {boolean} internal
 */
const validate = (pkg, atPath, internal) => {
  // if (internal) return pkg

  const main = [pkg.main, ...extensions.map(ext => "index" + ext)]
    .filter(Boolean)
    .find(name => exists(resolve(atPath, name)))

  if (!main) {
    log.error(`Could not resolve plugin entry point (${atPath})`)
    return
  }

  log.absurd(`Resolved plugin entry point: ${atPath} -> ${main}`)

  pkg.main = main
  return pkg
}

/**
 * @param {Core} context
 * @param {string} atPath
 * @param {PluginLifecycle} component
 * @returns {Promise<Store>}
 */
const registerHooks = async (context, atPath, component) => {
  if (!component) return

  const [builtins, plugins] = partition(component, (_, key) => {
    return builtinHooks.has(key)
  })

  const store = await component.setup?.call(context, context)

  each(builtins, (method, hook) => {
    if (hook === "setup") return

    if (!isFunction(method)) {
      context.log.error(
        "Hooks must be known methods or objects for plugins, but " +
        `${hook} was of type ${getType(method)}`
      )

      return
    }

    registerHook(hook, method, atPath, store ?? {})
  })

  each(plugins, (pluginHooks, plugin) => {
    if (!isObject(pluginHooks)) {
      context.log.error(
        "Hooks must be objects for plugins, but " +
        `${plugin} was of type ${getType(pluginHooks)}`
      )
    }

    each(pluginHooks,
      /**
       * @param {HookListener} method
       * @param {string} hook
       */
      (method, hook) => {
        registerPluginHook(plugin, hook, method)
      }
    )
  })

  return store
}

/**
 * @param {string} name
 */
const resolvePluginPath = name =>
  isAbsolute(name) ? name : resolve(modulePath, name)

/**
 * @param {string} atPath
 * @param {string} type
 * @returns {(e: Error) => undefined} e
 */
const handlePluginError = (atPath, type) => e => {
  log.error(`Error executing plugin ${type} (${atPath})`)
  log.error(e.message, e.stack)
}

/**
 * @param {Core} context
 * @param {string} atPath
 * @param {boolean} internal
 */
const load = async (context, atPath, internal) => {
  const pkg = await readAsync(resolve(atPath, "package.json"), "json")
    .catch(log.error(_.message))

  if (!validate(pkg, atPath, internal)) return

  /**
   * @type {import("@converge/types").Plugin}
   */
  const plugin = await import(resolve(atPath, pkg.main))

  await FP.resolve(plugin.strings?.(context))
    .catch(handlePluginError(atPath, "strings"))

  const store = await registerHooks(context, atPath, plugin.lifecycle)
    .catch(handlePluginError(atPath, "lifecycle"))

  await FP.resolve(plugin.setup?.(context, store))
    .catch(handlePluginError(atPath, "setup"))

  log.debug(`plugin loaded: '${pkg.name} (v${pkg.version})'`)
}

export const loadPlugins = async context => {
  log.trace("loading plugins...")

  await FP.all(loadInternalPlugins(context))
  await install(context)

  const [plugins, locals] = await FP.all([
    getPlugins(),
    getLocalPlugins()
  ])

  log.trace("setting up plugin compiler...")
  await setupCompiler({ plugins, localPlugins: locals })

  const all = [...plugins, ...locals]
  const paths = all.map(v => resolvePluginPath(getPackageProps(v).name))
  await FP.all(paths.map(load(context, _)))
}
