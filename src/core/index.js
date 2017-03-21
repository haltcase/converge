'use strict'

const Promise = require('bluebird')
const reqAll = require('req-all')
const EventEmitter = require('eventemitter2')
const get = require('stunsail/get')
const map = require('stunsail/map')
const each = require('stunsail/each')
const isObject = require('stunsail/is-object')
const defaults = require('stunsail/defaults')

const log = require('../logger')
const getAPI = require('./api')
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
    this.api = getAPI(config.ownerAuth)

    loadHooks(this)
    exitHooks(this)

    loadDatabase(this, options.db)
      .then(db => { this.db = db })
      .then(() => loadOwnerInfo(this))
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
      return Promise.resolve(false)
    }

    let isSubcommand = () => this.command.exists(command, subcommand)
    if (!event.subcommand || !isSubcommand()) {
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

function loadOwnerInfo (context) {
  let params = { login: [context.ownerName, context.botName] }
  return context.api('users', { params })
    .then(res => {
      let [ownerID, botID] = map(get('_id'), res.users)
      context.extend({ ownerID, botID })

      return Promise.all([
        context.db.updateOrCreate('usertypes', {
          id: ownerID
        }, {
          name: context.ownerName,
          admin: true,
          mod: true
        }),

        context.db.updateOrCreate('usertypes', {
          id: botID
        }, {
          name: context.botName,
          admin: true,
          mod: true
        })
      ])
    })
  /*
  return context.api('')
    .then(get('token.user_id'))
    .then(id => context.extend({ ownerID: id }))

  // TODO: also load the bot id here
  let getID = get('token.user_id')

  return Promise.all([
    context.api('').then(getID)
  ]).then(([id]) => {
    context.extend({ ownerID: id })

    return Promise.all([
      context.db.updateOrCreate('usertypes', {
        id,
        name: context.ownerName,
        admin: true,
        mod: true
      })
    ])
  })
  */
}

function loadLibraries (context) {
  log.trace('loading libraries')
  let modules = reqAll('./lib')

  each(lib => lib(context), modules)
}
