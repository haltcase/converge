/**
 * @typedef {import('@converge/types').Core} Core
 * @typedef {import('@converge/types').CommandAttributes} CommandAttributes
 * @typedef {import('@converge/types').SubcommandAttributes} SubcommandAttributes
 * @typedef {import('@converge/types').CommandRegistry} CommandRegistry
 * @typedef {import('@converge/types').SubcommandRegistry} SubcommandRegistry
 */

import { _, it } from 'param.macro'

import { dirname, join, isAbsolute, sep, relative } from 'path'

import { sync as find } from 'find-up'
import FP from 'functional-promises'
import throttle from 'p-throttle'
import callsites from 'callsites'
import {
  get,
  has,
  map,
  once,
  set
} from 'stunsail'

import log from '../logger'
import isSubdirectory from './util/is-subdirectory'

import {
  internalPluginDirectory,
  externalPluginDirectory
} from './plugins'

/**
 * @type {Record<string, CommandRegistry>}
 */
export const registry = {}

const commandProperties = new Set([
  'cooldown',
  'permission',
  'status',
  'price'
])

/**
 * @param {string} command
 * @param {string} property
 */
const getCommandProperty = (command, property) => {
  if (!commandExists(command)) return

  if (commandProperties.has(property)) {
    return get(registry, [command, property])
  }
}

/**
 * @param {string} command
 * @param {string} sub
 * @param {string} property
 * @returns {SubcommandRegistry}
 */
const getSubcommandProperty = (command, sub, property) => {
  if (!commandExists(command)) return

  if (commandProperties.has(property)) {
    return get(registry, [command, 'subcommands', sub, property])
  }
}

/**
 * @param {string} command
 * @param {string} property
 * @param {any} value
 */
const setCommandProperty = (command, property, value) => {
  if (!commandExists(command)) return

  if (commandProperties.has(property)) {
    set(registry, [command, property], value)
  }
}

/**
 * @param {string} command
 * @param {string} sub
 * @param {string} property
 * @param {any} value
 */
const setSubcommandProperty = (command, sub, property, value) => {
  if (!commandExists(command)) return

  if (commandProperties.has(property)) {
    set(registry, [command, 'subcommands', sub, property], value)
  }
}

/**
 * @param {string} name
 * @param {string} sub
 */
const commandExists = (name, sub) =>
  has(registry, [name, ...(sub ? ['subcommands', sub] : [])])

/**
 * @param {CommandRegistry} existing
 * @param {string} incoming
 */
const callerPackagesMatch = (existing, incoming) => {
  const existingPkgPath = find('package.json', { cwd: dirname(existing.caller) })
  const incomingPkgPath = find('package.json', { cwd: dirname(incoming) })
  return dirname(existingPkgPath) === dirname(incomingPkgPath)
}

/**
 * @param {Core} context
 * @param {CommandAttributes} command
 */
const registerCommand = (context, command) => {
  const { name, caller } = command

  if (registry[name]) {
    if (callerPackagesMatch(registry[name], caller)) {
      // the package is the same, but the file could have changed
      registry[name].caller = caller
      return
    }

    log.debug(`Duplicate command registration attempted by '${caller}'`)
    log.debug(`!${name} already registered to '${registry[name].caller}'`)

    return
  }

  registry[name] = { ...command, ...{ subcommands: {} } }

  log.absurd(`command loaded: '!${name}' (${caller})`)
  return context
}

const registerSubcommand = (context, subcommand) => {
  const { name, parent } = subcommand

  const container = registry[parent]

  if (!container) {
    log.error(`Parent command '${parent}' does not exist. (${name})`)
    return context
  }

  const pair = `${parent} ${name}`
  const reference = container.subcommands[name]

  if (reference) {
    if (reference.parent === parent) return context

    log.debug('Duplicate subcommand registration attempted')
    log.debug(`!${pair} is already registered`)

    return context
  }

  registry[parent].subcommands[name] = Object.assign({}, subcommand)

  log.absurd(`subcommand loaded: '!${pair}' (${container.caller})`)
  return context
}

const registerCustomCommand = (context, command) => {
  const { name } = command

  if (registry[name]) {
    log.debug(`'${name}' already in use. Custom command not added.`)
    return context
  }

  const flags = {
    caller: 'custom',
    subcommands: {}
  }

  registry[name] = { ...command, ...flags }
  log.absurd(`command loaded: '!${name}' (custom)`)
  return context
}

/**
 * @param {Core} context
 * @param {CommandRegistry} command
 */
const updateCommand = async (context, command) =>
  context.db.updateOrCreate('commands', {
    name: command.name
  }, {
    handler: command.handler,
    caller: command.caller,
    status: command.status ?? false,
    cooldown: command.cooldown,
    permission: command.permission,
    price: command.price
  })

const updateSubcommand = async (context, parent, subcommand) =>
  context.db.updateOrCreate('subcommands', {
    name: subcommand.name,
    parent
  }, {
    status: subcommand.status,
    cooldown: subcommand.cooldown,
    permission: subcommand.permission,
    price: subcommand.price
  })

const save = throttle(async context => {
  log.trace('saving commands')

  await FP.all(
    map(registry, command =>
      FP.all([
        updateCommand(context, command),
        ...(
          map(Object.values(command.subcommands), sub =>
            updateSubcommand(context, command.name, sub))
        )
      ])
    )
  )

  log.trace('saved commands')
}, 1, 10_000)

const loadTables = context =>
  FP.all([
    context.db.model('commands', {
      name: { type: String, primary: true },
      caller: { type: String, notNullable: true },
      handler: { type: String, notNullable: true },
      status: { type: Boolean, defaultTo: false },
      cooldown: { type: Number, defaultTo: 30 },
      permission: { type: Number, defaultTo: 5 },
      price: { type: Number, defaultTo: 0 }
    }),

    context.db.model('subcommands', {
      name: String,
      parent: String,
      status: { type: Boolean, defaultTo: null },
      cooldown: { type: Number, defaultTo: -1 },
      permission: { type: Number, defaultTo: -1 },
      price: { type: Number, defaultTo: -1 }
    }, {
      primary: ['name', 'parent']
    })
  ])

/**
 * @param {Core} context
 */
const loadCommands = context => {
  log.trace('loading commands')

  return FP.all([
    context.db.find('commands').then(commands => {
      commands.forEach(command => {
        if (command.caller === 'custom') {
          registerCustomCommand(context, command)
          return
        }

        registerCommand(context, command)
      })
    }),

    context.db.find('subcommands')
      .then(it.forEach(registerSubcommand(context, _)))
  ])
}

/**
 * @param {string} caller
 * @param {string} kind
 */
const isCommandType = (caller, kind) =>
  caller.split(sep)[0] === kind

/**
 * @param {string} caller
 */
const isInternalCommand = caller =>
  isCommandType(caller, 'internal')

/**
 * @param {string} caller
 */
const isExternalCommand = caller =>
  isCommandType(caller, 'plugins')

/**
 * @param {string} caller
 */
const deserializePath = caller => {
  if (isAbsolute(caller)) {
    return caller
  }

  if (isInternalCommand(caller)) {
    return join(internalPluginDirectory, '..', caller)
  }

  if (isExternalCommand(caller)) {
    return join(externalPluginDirectory, '..', caller)
  }
}

/**
 * @param {string} name
 */
export const stageCommand = name => {
  const { caller, handler } = registry[name]

  if (caller === 'custom') {
    return (context, event) =>
      context.params(event, handler)
        .then(context.say)
  }

  const callerPath = deserializePath(caller)

  if (!callerPath) return

  delete require.cache[callerPath]
  return require(callerPath)[handler]
}

/**
 * @param {string} caller
 */
const serializePath = caller => {
  if (isSubdirectory(caller, internalPluginDirectory)) {
    return join('internal', relative(internalPluginDirectory, caller))
  }

  if (isSubdirectory(caller, externalPluginDirectory)) {
    return join('plugins', relative(externalPluginDirectory, caller))
  }

  return caller
}

/**
 * @param {Core} context
 * @param {string} name
 * @param {CommandAttributes} options
 */
export const addCommand = (context, name, options = {}) => {
  if (!name) return

  const caller = serializePath(callsites()[2].getFileName())

  const object = {
    handler: name,
    cooldown: 30,
    permission: 5,
    status: true,
    price: 0,
    ...options,
    name: name.toLowerCase(),
    caller
  }

  return registerCommand(context, object)
}

/**
 * @param {Core} context
 * @param {string} name
 * @param {string} parent
 * @param {SubcommandAttributes} options
 */
export const addSubcommand = (context, name, parent, options = {}) => {
  if (!name || !parent || !registry[parent]) return

  const caller = callsites()[2].getFileName()
  const object = {
    cooldown: -1,
    permission: -1,
    // TODO!: make sure null works the same way as the old -1 did
    // TODO!: this means that for subcommands, `null` should use the same
    // TODO!: value that the parent command is set to
    status: null,
    price: -1,
    ...options,
    name: name.toLowerCase(),
    caller,
    parent
  }

  return registerSubcommand(context, object)
}

/**
 * @param {Core} context
 * @param {string} name
 * @param {CommandAttributes} options
 */
export const addCustomCommand = (context, name, options = {}) => {
  if (!name) return

  const object = {
    cooldown: 30,
    permission: 5,
    status: true,
    price: 0,
    ...options,
    name: name.toLowerCase(),
    caller: 'custom',
    handler: options.response || options.handler
  }

  return registerCustomCommand(context, object)
}

/**
 * @type {(commandName: string) => CommandRegistry}
 */
export const getCommand = registry[_]

/**
 * @type {(commandName: string, subcommandName: string) => SubcommandRegistry}
 */
export const getSubcommand = registry[_].subcommands[_]

const getProperty = (command, ...args) => {
  let sub
  let property = args[0]
  if (args.length === 2) {
    ;[sub, property] = args
  }

  return sub
    ? getSubcommandProperty(command, sub, property)
    : getCommandProperty(command, property)
}

const setProperty = context => (command, ...args) => {
  if (args.length !== 2 && args.length !== 3) return

  let sub
  let property = args[0]
  let value = args[1]
  if (args.length === 3) {
    ;[sub, property, value] = args
  }

  const result = sub
    ? setSubcommandProperty(command, sub, property, value)
    : setCommandProperty(command, property, value)

  save(context)

  return result
}

/**
 * @type {(context: Core) => Promise<typeof registry>}
 */
export const loadRegistry = once(async context => {
  log.trace('creating registry')

  const _addCommand = addCommand(context, _, _)
  const _addSubcommand = addSubcommand(context, _, _, _)
  const _addCustomCommand = addCustomCommand(context, _, _)
  const _setProperty = setProperty(context)

  context.extend({
    addCommand: _addCommand,
    addSubcommand: _addSubcommand,
    addCustomCommand: _addCustomCommand,

    command: {
      exists: commandExists,
      getProperty: getProperty,
      setProperty: _setProperty,
      enable: (name, sub) =>
        _setProperty(name, sub, 'status', true),
      disable: (name, sub) =>
        _setProperty(name, sub, 'status', false),
      isEnabled: (name, sub) =>
        getProperty(name, sub, 'status'),
      getPermLevel: (name, sub) =>
        getProperty(name, sub, 'permission')
    }
  })

  context.on('beforeShutdown', () => save(context))

  await loadTables(context)
  await loadCommands(context)
  return registry
})
