'use strict'

const callsites = require('callsites')
const map = require('stunsail/util/map')

let registry = exports.registry = {}

exports.addCommand = (context, name, options) => {
  if (!name) return

  let object = Object.assign({
    handler: name,
    cooldown: 30,
    permission: 5,
    status: 1,
    price: 0
  }, options, {
    name: name.toLowerCase()
  })

  let caller = callsites()[1].getFileName()
  return registerCommand(context, object, caller)
}

exports.addSubcommand = (context, name, parent, options) => {
  if (!name || !parent || !registry[parent]) return

  let caller = callsites()[1].getFileName()
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

exports.loadRegistry = context => {
  let addCommand = (name, options) => exports.addCommand(context, name, options)
  let addSubcommand = (name, options) => exports.addSubcommand(context, name, options)

  context.extend({
    addCommand,
    addSubcommand
  })

  context.on('beforeShutdown', save)

  return loadTables(context)
    .then(() => loadCommands(context))
    .then(() => registry)
}

function registerCommand (context, command) {
  let { name, handler, caller } = command
  if (registry[name]) {
    if (registry[name].caller === caller) return

    console.debug(`Duplicate command registration attempted by '${caller}'`)
    console.debug(`!${name} already registered to '${registry[name].caller}'`)

    return
  }

  registry[name] = Object.assign({}, command, { subcommands: {} })

  console.debug(`\`- Command loaded:: '${name}' (${caller})`)
  return context
}

function registerSubcommand (context, command, caller, parent) {
  // TODO
  return context
}

function save (context) {
  console.log('saving commands')

  return Promise.all(
    map(command => {
      return context.db.updateOrCreate('commands', {
        name: command.name,
        caller: command.caller,
        status: command.status,
        cooldown: command.cooldown,
        permission: command.permission,
        price: command.price
      }).then(() => {
        return Promise.all(
          map(sub => {
            return context.db.updateOrCreate('subcommands', {
              name: sub.name,
              parent: command.name,
              status: sub.status,
              cooldown: sub.cooldown,
              permission: sub.permission,
              price: sub.price
            })
          }, command.subcommands)
        )
      })
    }, registry)
  ).then(() => console.log('saved commands'))
}

function loadTables (context) {
  return Promise.all([
    context.db.model('commands', {
      name: { type: String, primary: true },
      caller: { type: String, notNullable: true },
      status: { type: Number, defaultTo: 0 },
      cooldown: { type: Number, defaultTo: 30 },
      permission: { type: Number, defaultTo: 5 },
      price: { type: Number, defaultTo: 0 }
    }),

    context.db.model('subcommands', {
      name: String,
      parent: String,
      status:  { type: Number, defaultTo: -1 },
      cooldown: { type: Number, defaultTo: -1 },
      permission: { type: Number, defaultTo: -1 },
      price: { type: Number, defaultTo: -1 }
    }, {
      primary: ['name', 'parent']
    })
  ])
}

function loadCommands (context) {
  return Promise.all([
    context.db.find('commands').then(commands => {
      commands.forEach(command => {
        registerCommand(context, command.name, command)
      })
    }),

    context.db.find('subcommands').then(subs => {
      subs.forEach(sub => {
        registerSubcommand(context, sub.name, sub)
      })
    })
  ])
}
