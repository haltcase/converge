import { _, it } from 'param.macro'
import importAll from 'import-all.macro'

import EventEmitter from 'eventemitter2'
import FP from 'functional-promises'

import {
  defaults,
  each,
  isObject,
  map
} from 'stunsail'

import log from '../logger'
import getApi from './api'
import loadDatabase from './db'
import { loadBot } from './bot'
import { loadPlugins } from './plugins'
import { loadRegistry, stageCommand } from './registry'

import {
  loadHooks,
  exitHooks,
  callHook,
  callHookAndWait
} from './hooks'

const loadOwnerInfo = async context => {
  const params = { login: [context.ownerName, context.botName] }
  const { users } = await context.api('users', { params }, { users: [] })
  const [ownerID, botID] = map(users, it._id)
  context.extend({ ownerID, botID })

  return FP.all([
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
}

const loadLibraries = context => {
  log.trace('loading libraries')
  return importAll('./lib/*.js')
    .then(each(_, it.default(context)))
}
/**
 * The core functionality of the bot
 *
 * @export
 * @class Core
 * @extends {EventEmitter}
 * @property {string} ownerName
 * @property {string} botName
 */
export default class Core extends EventEmitter {
  /**
   * Creates an instance of the bot's core
   *
   * @param {object} config
   * @param {string} config.ownerName
   * @param {string} config.ownerAuth
   * @param {string} config.botName
   * @param {string} config.botAuth
   * @param {object} options
   * @param {string} options.configPath
   * @param {import('trilogy').Trilogy} options.db
   * @memberof Core
   */
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
    this.api = getApi(config.ownerAuth)

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

  callHook (name, ...args) {
    return callHook(name, ...args)
  }

  callHookAndWait (name, ...args) {
    return callHookAndWait(name, ...args)
  }

  async runCommand (event) {
    const { command, subcommand } = event

    if (!this.command.exists(command)) {
      return false
    }

    const isSubcommand = () => this.command.exists(command, subcommand)
    if (!event.subcommand || !isSubcommand()) {
      event.subcommand = undefined
      event.subArgs = undefined
      event.subArgString = undefined
    }

    await callHookAndWait('beforeCommand', event)
    if (event.isPrevented) return
    const runner = stageCommand(command)

    try {
      await runner(this, event)
      return callHookAndWait('afterCommand', event)
    } catch (e) {
      log.error(`failed to run command '${command}': ${e.message}`)
      log.debug(e.stack)
    }
  }

  async shutdown () {
    if (this.shuttingDown) return
    this.shuttingDown = true
    log.info('shutting down')
    await callHookAndWait('beforeShutdown')
    return this.emit('shutdown')
  }
}
