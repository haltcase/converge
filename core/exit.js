const exitHook = require('async-exit-hook')

exports.exitHooks = context => {
  exitHook(done => context.shutdown().then(done))
  exitHook.uncaughtExceptionHandler((e, done) => {
    return context.shutdown().then(done)
  })
}
