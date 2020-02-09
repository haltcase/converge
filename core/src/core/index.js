/**
 * @typedef {import("trilogy").Trilogy} Trilogy
 * @typedef {import("@converge/types").Core} Core
 * @typedef {import("@converge/types").CoreConfig} CoreConfig
 * @typedef {import("@converge/types").CoreOptions} CoreOptions
 */

import { _, it } from "param.macro"
import importAll from "import-all.macro"

import EventEmitter from "eventemitter2"
import FP from "functional-promises"

import {
  defaults,
  each,
  isObject
} from "stunsail"

import log from "../logger"
import loadDatabase from "./db"
import { loadBot } from "./bot"
import { loadPlugins } from "./plugins"
import { loadRegistry, stageCommand } from "./registry"

import {
  loadHooks,
  exitHooks,
  callHook,
  callHookAndWait
} from "./hooks"

const loadOwnerInfo = async (context, config) => {
  context.extend({
    ownerId: config.owner.id,
    botId: config.bot.id
  })

  return FP.all([
    context.db.updateOrCreate("usertypes", {
      id: config.owner.id
    }, {
      name: context.ownerName,
      admin: true,
      mod: true
    }),

    context.db.updateOrCreate("usertypes", {
      id: config.bot.id
    }, {
      name: context.botName,
      admin: true,
      mod: true
    })
  ])
}

const loadLibraries = context => {
  log.trace("loading libraries")
  return importAll("./lib/*.js")
    .then(each(_, it.default(context)))
}

/**
 * The core functionality of the bot
 *
 * @export
 * @class Core
 * @extends {EventEmitter}
 * @type {Core}
 */
export default class Core extends EventEmitter {
  /**
   * Creates an instance of the bot's core
   *
   * @param {CoreConfig} config
   * @param {CoreOptions} options
   */
  constructor (config, options) {
    log.trace("starting up core")

    // initialize the emitter
    super({
      wildcard: true,
      delimiter: ":",
      newListener: false,
      maxListeners: 30
    })

    this.ownerName = config.owner.name
    this.botName = config.bot.name

    loadHooks(this)
    exitHooks(this)

    loadDatabase(this, options.db)
      .then(db => { this.db = db })
      .then(() => loadOwnerInfo(this, config))
      .then(() => loadBot(this, config, options))
      .then(() => loadLibraries(this))
      .then(() => loadRegistry(this))
      .then(() => loadPlugins(this))
      .then(() => {
        log.info("ready")
        callHook("ready")
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
    return this
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

    await callHookAndWait("beforeCommand", event)
    if (event.isPrevented) return
    const runner = stageCommand(command)

    try {
      await runner(this, event)
      return callHookAndWait("afterCommand", event)
    } catch (e) {
      log.error(`failed to run command '${command}': ${e.message}`)
      log.debug(e.stack)
    }
  }

  async shutdown () {
    if (this.shuttingDown) return
    this.shuttingDown = true
    log.info("shutting down")

    // tasks will be given 10 seconds to shut down before it's forced
    await Promise.race([
      FP.delay(10_000).then(() => log.debug("shutdown timed out")),
      callHookAndWait("beforeShutdown")
    ])

    await this.db.close()
    return this.emit("shutdown")
  }
}
