const pipe = require('stunsail/fn/pipe')
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
  if (!hooks[name]) return
  let args = toArray(arguments, 2)
  args.unshift(context)
  return pipe(hooks[name].map(fn => fn.bind.apply(fn, args)))
}
