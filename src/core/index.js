'use strict'

const Promise = require('bluebird')
const reqAll = require('req-all')
const EventEmitter = require('eventemitter2')
const each = require('stunsail/each')
const isObject = require('stunsail/is-object')
const defaults = require('stunsail/defaults')

const log = require('../logger')
const loadDatabase = require('./db')
const { loadBot } = require('./bot')
const { loadPlugins } = require('./plugins')
const { loadRegistry, stageCommand } = require('./registry')

const {
  loadHooks,
  exitHooks,
  callHook,
  callHookAndWait
} = require('./hooks')

module.exports = class Core extends EventEmitter {
  constructor (config, options) {
    log.trace('starting up core')

    // initialize the emitter
    super({
      wildcard: true,
      delimiter: ':',
      newListener: false,
      maxListeners: 30
    })

    this.ownerName = config.ownerName
    this.botName = config.botName

    loadHooks(this)
    exitHooks(this)

    loadDatabase(this, options.db)
      .then(db => { this.db = db })
      .then(() => loadBot(this, config))
      .then(() => loadLibraries(this))
      .then(() => loadRegistry(this))
      .then(() => loadPlugins(this))
      .then(() => {
        log.info('ready')
        callHook('ready')
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

  runCommand (event) {
    let { command, subcommand } = event

    if (!this.command.exists(command)) {
      return Promise.resolve()
    }

    let subcommandExists = this.command.exists(command, subcommand)
    if (!event.subcommand || !subcommandExists) {
      event.subcommand = undefined
    }

    return callHookAndWait('beforeCommand', event)
      .then(() => {
        if (event.isPrevented) return
        let runner = stageCommand(command)
        return runner(this, event)
      })
      .then(() => callHook('afterCommand', event))
  }

  shutdown () {
    if (this.shuttingDown) return Promise.resolve()
    this.shuttingDown = true
    log.info('shutting down')
    return callHookAndWait('beforeShutdown')
      .then(() => this.emit('shutdown'))
  }
}

function loadLibraries (context) {
  log.trace('loading libraries')
  let modules = reqAll('./lib')

  each(lib => lib(context), modules)
}
