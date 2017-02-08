const callsites = require('callsites')

let registry = exports.registry = {}

exports.addCommand = (context, name, options) => {
  if (!name) return

  let object = Object.assign({
    name: name.toLowerCase(),
    handler: name,
    cooldown: 30,
    permission: 5,
    status: true,
    price: 0
  }, options)

  let caller = callsites()[1].getFileName()
  return registerCommand(context, object, caller)
}

exports.addSubcommand = (context, name, parent, options) => {
  if (!name || !parent || !registry[parent]) return

  let object = Object.assign({
    name: name.toLowerCase(),
    parent,
    cooldown: -1,
    permission: -1,
    // status: true,
    price: -1
  }, options)

  let caller = callsites()[1].getFileName()
  return registerSubcommand(context, object, caller)
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

  return registry
}

function registerCommand (context, command, caller) {
  let { name, handler } = command
  if (registry[name]) {
    if (registry[name].caller === caller) return

    console.debug(`Duplicate command registration attempted by '${caller}'`)
    console.debug(`!${name} already registered to '${registry[name].caller}'`)

    return
  }

  registry[name] = {
    name,
    handler,
    caller,
    subcommands: {}
  }

  console.debug(`\`- Command loaded:: '${name}' (${caller})`)
  return context
}

function registerSubcommand (context, command, caller, parent) {
  // TODO
  return context
}

function save (context) {
  // persist the commands to the database
  // should do this on an interval and before shutdowns
}
