'use strict'

const Promise = require('bluebird')
const callsites = require('callsites')
const map = require('stunsail/map')
const once = require('stunsail/once')
const isOneOf = require('stunsail/is-one-of')

const log = require('../logger')

let registry = exports.registry = {}

exports.stageCommand = name => {
  let { caller, handler } = registry[name]
  delete require.cache[caller]
  return require(caller)[handler]
}

exports.addCommand = (context, name, options) => {
  if (!name) return

  let caller = callsites()[2].getFileName()
  let object = Object.assign({
    handler: name,
    cooldown: 30,
    permission: 5,
    status: 1,
    price: 0
  }, options, {
    name: name.toLowerCase(),
    caller
  })

  return registerCommand(context, object)
}

exports.addSubcommand = (context, name, parent, options) => {
  if (!name || !parent || !registry[parent]) return

  let caller = callsites()[2].getFileName()
  let object = Object.assign({
    cooldown: -1,
    permission: -1,
    status: -1,
    price: -1
  }, options, {
    name: name.toLowerCase(),
    caller,
    parent
  })

  return registerSubcommand(context, object)
}

exports.getCommand = name => registry[name]
exports.getSubcommand = (parent, name) => registry[parent][name]

exports.loadRegistry = once(context => {
  log.trace('creating registry')

  function addCommand (name, options) {
    return exports.addCommand(context, name, options)
  }

  function addSubcommand (name, parent, options) {
    return exports.addSubcommand(context, name, parent, options)
  }

  context.extend({
    addCommand,
    addSubcommand,

    command: {
      exists: commandExists,
      getProperty: getCommandProperty,
      isEnabled: (name, sub) => getCommandProperty(name, sub, 'status') > 0
    }
  })

  context.on('beforeShutdown', save)

  return loadTables(context)
    .then(() => loadCommands(context))
    .then(() => registry)
})

function getCommandProperty (command, property) {
  let sub
  if (arguments.length === 3) {
    sub = property
    property = arguments[2]
  }

  if (!commandExists(command, sub)) return

  let options = [
    'cooldown',
    'permission',
    'status',
    'price'
  ]

  if (isOneOf(options, property)) {
    if (!sub) return registry[command][property]
    return registry[command].subcommands[sub][property]
  }
}

function commandExists (name, sub) {
  let command = registry[name]
  if (!command) return false
  return sub ? !!command[sub] : true
}

function registerCommand (context, command) {
  let { name, caller } = command
  if (registry[name]) {
    if (registry[name].caller === caller) return

    log.debug(`Duplicate command registration attempted by '${caller}'`)
    log.debug(`!${name} already registered to '${registry[name].caller}'`)

    return
  }

  registry[name] = Object.assign({}, command, { subcommands: {} })

  log.absurd(`\`- Command loaded:: '${name}' (${caller})`)
  return context
}

function registerSubcommand (context, command, caller, parent) {
  // TODO
  return context
}

function save (context) {
  log.trace('saving commands')

  return Promise.props(map(command => {
    return Promise.all([
      context.db.updateOrCreate('commands', {
        name: command.name
      }, {
        handler: command.handler,
        caller: command.caller,
        status: command.status,
        cooldown: command.cooldown,
        permission: command.permission,
        price: command.price
      }),

      Promise.all([
        map(sub => {
          return context.db.updateOrCreate('subcommands', {
            name: sub.name
          }, {
            parent: command.name,
            status: sub.status,
            cooldown: sub.cooldown,
            permission: sub.permission,
            price: sub.price
          })
        }, command.subcommands)
      ])
    ])
  }, registry)).then(() => log.trace('saved commands'))
}

function loadTables (context) {
  return Promise.all([
    context.db.model('commands', {
      name: { type: String, primary: true },
      caller: { type: String, notNullable: true },
      handler: { type: String, notNullable: true },
      status: { type: Number, defaultTo: 0 },
      cooldown: { type: Number, defaultTo: 30 },
      permission: { type: Number, defaultTo: 5 },
      price: { type: Number, defaultTo: 0 }
    }),

    context.db.model('subcommands', {
      name: String,
      parent: String,
      status: { type: Number, defaultTo: -1 },
      cooldown: { type: Number, defaultTo: -1 },
      permission: { type: Number, defaultTo: -1 },
      price: { type: Number, defaultTo: -1 }
    }, {
      primary: ['name', 'parent']
    })
  ])
}

function loadCommands (context) {
  log.trace('loading commands')

  return Promise.all([
    context.db.find('commands').then(commands => {
      commands.forEach(command => {
        registerCommand(context, command)
      })
    }),

    context.db.find('subcommands').then(subs => {
      subs.forEach(sub => {
        registerSubcommand(context, sub)
      })
    })
  ])
}
