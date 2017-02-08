const exitHook = require('async-exit-hook')

const { callHook } = require('./hooks')

let shutdown = exports.shutdown = context => {
  return callHook('beforeShutdown', context)
}

exports.exitHooks = context => {
  exitHook(done => shutdown(context).then(done))
  exitHook.uncaughtExceptionHandler((e, done) => {
    return shutdown(context).then(done)
  })
}
