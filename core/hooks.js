const pipe = require('stunsail/fn/pipe')
const apply = require('stunsail/fn/apply')
'use strict'

const toArray = require('stunsail/to/array')

let hooks = exports.hooks = {
  ready: [],
  beforeMessage: [],
  receivedCommand: [],
  beforeCommand: [],
  afterCommand: [],
  beforeShutdown: []
}

exports.getHooks = () => Object.keys(hooks)

exports.callHook = (name, context) => {
  let args = toArray(arguments, 2)
  args.unshift(context)

  return Promise.all([
    apply(context.emitAsync, context, [name].concat(args)),
    hooks[name] && pipe(hooks[name].map(fn => apply(fn.bind, fn, args)))
  ])
}
