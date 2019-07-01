import { _ } from 'param.macro'

import { basename, dirname } from 'path'

import callsites from 'callsites'
import FP from 'functional-promises'
import { once } from 'stunsail'
import { Client } from 'twitch-js'

import log from '../logger'
import { callHook, callHookAndWait } from './hooks'

const getInstance = once(config =>
  new Client({
    options: {
      debug: false
    },
    connection: {
      reconnect: true
    },
    identity: {
      username: config.botName,
      password: config.botAuth
    },
    channels: ['#' + config.ownerName]
  })
)

const isCommand = (message, prefix) =>
  message.substr(0, prefix.length) === prefix &&
  message.length > prefix.length &&
  message.charAt(prefix.length) !== ' '

const getCommand = (message, prefix) =>
  message.slice(prefix.length).split(' ', 1)[0].toLowerCase()

const getCommandArgs = message =>
  message.split(' ').slice(1)

const getCommandArgString = message =>
  getCommandArgs(message).join(' ')

const getCommandSubArgString = message =>
  getCommandArgs(message).slice(1).join(' ')

const getCaller = callsite => {
  const caller = callsite[1].getFileName()
  const parent = caller |> dirname |> basename
  return `${parent}/${basename(caller)}`
}

const createResponder = (context, event) => {
  const partial = event.whispered
    ? message => context.whisper(event.sender, message)
    : message => context.say(event.sender, message)

  return partial(_)
}

const createPrevent = event => () => {
  event.isPrevented = true
  const caller = getCaller(callsites())
  log.debug(`command prevented by ${caller}`)
  callHook('preventedCommand', event)
}

const dispatcher = (ctx, bot, prefix, type) => {
  log.trace(`attaching ${type} event dispatcher`)
  return async (source, user, message, self) => {
    if (self) return
    if (type === 'action') return

    const event = await buildEvent(
      ctx, user, message, prefix, type === 'whisper'
    )

    event.respond = createResponder(ctx, event)
    event.prevent = createPrevent(event)
    await callHookAndWait('beforeMessage', event)

    if (event.isPrevented) return

    if (isCommand(message, prefix)) {
      return commandHandler(ctx, event)
    }
  }
}

const setupListeners = (ctx, bot, prefix) => {
  log.trace('registering chat listeners')
  bot.on('chat', dispatcher(ctx, bot, prefix, 'chat'))
  bot.on('whisper', dispatcher(ctx, bot, prefix, 'whisper'))
  bot.on('action', dispatcher(ctx, bot, prefix, 'action'))
}

const aliasHandler = async (ctx, event) => {
  let original
  try {
    original = await ctx.command.getAlias(event.command)
  } catch (e) {
    log.error(e.message)
  }

  if (!original) return
  const [command, subcommand, ...rest] = original.split(' ')
  if (!ctx.command.exists(command)) return

  const args = [subcommand, ...rest, ...event.args]
  const argString = args.join(' ')
  const subArgs = [...rest, ...event.args]
  Object.assign(event, {
    command,
    subcommand,
    args,
    argString,
    subArgs,
    subArgString: subArgs.join(' '),
    raw: `${command} ${argString}`
  })

  return commandHandler(ctx, event)
}

const commandHandler = async (ctx, event) => {
  await callHookAndWait('receivedCommand', event)
  if (!event.isPrevented && !await ctx.runCommand(event)) {
    return aliasHandler(ctx, event)
  }
}

const buildEvent = async (ctx, user, message, prefix, whispered) => {
  const { 'display-name': name, 'user-type': type } = user
  const mod = type === 'mod' || name === ctx.ownerName
  const args = getCommandArgs(message)
  const event = {
    id: user['user-id'],
    sender: name,
    mention: `@${name}`,
    mod: mod || await ctx.user.isMod(user['user-id']),
    seen: new Date(),
    raw: message,
    whispered,
    command: getCommand(message, prefix),
    args,
    subArgs: args.slice(1),
    subcommand: args[0],
    argString: getCommandArgString(message),
    subArgString: getCommandSubArgString(message),
    isPrevented: false
  }

  await ctx.db.updateOrCreate('users', {
    id: event.id
  }, {
    name: event.sender,
    mod: event.mod,
    seen: event.seen
  })

  return event
}

export const loadBot = async (context, config) => {
  log.trace('starting up bot instance')
  const bot = getInstance(config)

  const shout = message => bot.say(context.ownerName, message)
  const whisper = (user, message) => bot.whisper(user, message)

  const say = async (user, ...args) => {
    if (!args.length) return shout(user)

    const [mentions, whispers] = await FP.all([
      context.db.getConfig('responseMention', false),
      context.db.getConfig('whisperMode', false)
    ])

    const [message] = args
    const mention = mentions ? `${user}: ` : ''

    if (!whispers) {
      return shout(`${mention}${message}`)
    } else {
      return whisper(user, message)
    }
  }

  const getPrefix = () => context.db.getConfig('prefix', '!')

  context.extend({
    say,
    shout,
    whisper,

    command: {
      getPrefix
    }
  })

  context.on('beforeShutdown', () => bot.disconnect())

  await bot.connect()
  const prefix = await getPrefix()
  await setupListeners(context, bot, prefix)

  return bot
}
