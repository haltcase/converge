import { _, it } from 'param.macro'

import exitHook from 'async-exit-hook'
import FP from 'functional-promises'
import { once, getOr, has, set } from 'stunsail'

export const builtinHooks = new Set([
  'setup',
  'ready',
  'beforeMessage',
  'receivedCommand',
  'beforeCommand',
  'afterCommand',
  'beforeShutdown'
])

const hooks = [...builtinHooks.values()].reduce((final, current) => {
  final[current] = []
  return final
}, {})

export const loadHooks = once(context => context)

export const getHooks = () => Object.keys(hooks)

export const registerHook = (name, fn) => {
  hooks[name].push(fn)
}

export const registerPluginHook = (plugin, name, fn) => {
  if (!has(hooks, [plugin, name]) || !Array.isArray(hooks[plugin][name])) {
    set(hooks, [plugin, name], [])
  }

  hooks[plugin][name].push(fn)
}

export const callHook = (name, ...args) => {
  const context = loadHooks()
  args.unshift(context)

  context.emit(name, ...args)
  hooks[name] && hooks[name].forEach(it.apply(context, args))
}

export const callHookAndWait = (name, ...args) => {
  const hookList = getOr(hooks, name, [])
  if (!hookList.length) return

  const context = loadHooks()
  args.unshift(context)

  return FP.all([
    context.emitAsync(name, ...args),
    ...hookList.map(it.apply(context, args))
  ]).then(([events, hooks]) => { /* TODO: return something? */ })
}

export const exitHooks = context => {
  exitHook(context.shutdown().then(_))

  const uncaughtHandler = (e, done) => {
    return context.shutdown().then(done)
  }

  exitHook.uncaughtExceptionHandler(uncaughtHandler)
  exitHook.unhandledRejectionHandler(uncaughtHandler)
}
