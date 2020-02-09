/**
 * @typedef {import("@converge/types").Core} Core
 * @typedef {(core: Core, ...args: any[]) => any} HookListener
 * @typedef {Record<string, HookListener[]>} PluginHook
 */

import { _, it } from "param.macro"

import exitHook from "async-exit-hook"
import FP from "functional-promises"
import { once, has, set, toObjectWith } from "stunsail"

export const builtinHooks = new Set([
  "setup",
  "ready",
  "beforeMessage",
  "receivedCommand",
  "beforeCommand",
  "afterCommand",
  "beforeShutdown"
])

/**
 * @type {Record<string, PluginHook | HookListener[]>}
 */
const hooks = toObjectWith(builtinHooks, () => [])

/**
 * @type {(context: Core) => Core}
 */
export const loadHooks = once(context => context)

export const getHooks = () => Object.keys(hooks)

/**
 * @type {Map<string, object>}
 */
export const pluginStores = new Map()

/**
 * @param {string} name
 * @param {HookListener} fn
 * @param {object} store
 */
export const registerHook = (name, fn, path, store) => {
  if (!pluginStores.has(path)) {
    pluginStores.set(path, store)
  }

  hooks[name].push({ path, fn, store })
}

/**
 * @param {string} plugin
 * @param {string} name
 * @param {HookListener} fn
 */
export const registerPluginHook = (plugin, name, fn) => {
  if (!has(hooks, [plugin, name]) || !Array.isArray(hooks[plugin][name])) {
    set(hooks, [plugin, name], [])
  }

  hooks[plugin][name].push(fn)
}

/**
 * @param {string} name
 * @param {...any} args
 */
export const callHook = (name, ...args) => {
  const context = loadHooks()
  args.unshift(context)

  context.emit(name, ...args)
  hooks[name]?.forEach(({ fn, store }) =>
    fn.apply(context, name === "setup" ? args : [...args, store])
  )
}

/**
 * @param {string} name
 * @param {...any} args
 */
export const callHookAndWait = async (name, ...args) => {
  const context = loadHooks()
  const hookList = hooks[name] ?? []

  if (!hookList.length && !context.listeners(name).length) return

  args.unshift(context)

  return FP.all([
    context.emitAsync(name, ...args),
    ...hooks[name].map(({ fn, store }) =>
      fn.apply(context, name === "setup" ? args : [...args, store])
    )
  ]).then(([events, hooks]) => { /* TODO: return something? */ })
}

/**
 * @param {Core} context
 */
export const exitHooks = context => {
  exitHook(() => FP.all([
    context.shutdown(),
    require("wtfnode").dump()
  ]))

  const uncaughtHandler = (e, done) => {
    return context.shutdown().then(done)
  }

  exitHook.uncaughtExceptionHandler(uncaughtHandler)
  exitHook.unhandledRejectionHandler(uncaughtHandler)
}
