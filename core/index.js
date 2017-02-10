'use strict'

const reqAll = require('req-all')
const EventEmitter = require('eventemitter2')
const isObject = require('stunsail/is/object')
const defaults = require('stunsail/to/defaults')

const loadDatabase = require('./db')
const { loadBot } = require('./bot')
const { loadRegistry } = require('./registry')
const { callHook } = require('./hooks')
const { exitHooks } = require('./exit')

module.exports = class Core extends EventEmitter {
  constructor (config, options) {
    console.log('starting up core')

    // initialize the emitter
    super({
      wildcard: true,
      delimiter: ':',
      newListener: false,
      maxListeners: 30
    })

    this.ownerName = config.ownerName
    this.botName = config.botName

    loadDatabase(this, options.db)
      .then(db => { this.db = db })
      .then(() => loadBot(this, config))
      .then(() => loadLibraries(this))
      .then(() => loadRegistry(this))
      .then(() => {
        // loadPlugins(this)

        console.log('ready')
        callHook('ready', this)
        exitHooks(this)
      })
  }

  extend (object) {
    if (isObject(object)) {
      return defaults(this, object)
    } else {
      return this
    }
  }

  on (channel, fn, duplicates) {
    if (!duplicates) this.off(channel, fn)
    super.on(channel, fn)
  }

  runCommand (event, prevent) {}

  shutdown () {
    if (this.shuttingDown) return Promise.resolve()
    this.shuttingDown = true
    console.log('shutting down core...')
    return callHook('beforeShutdown', this)
      .then(() => this.emit('shutdown'))
  }
}

function loadLibraries (context) {
  console.log('loading libraries')
  let modules = reqAll('./lib')

  Object.keys(modules).forEach(item => {
    if (typeof item === 'function') {
      item(context)
    }
  })
}
