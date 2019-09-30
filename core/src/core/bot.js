import { basename, dirname } from 'path'

import callsites from 'callsites'
import { writeAsync } from 'fs-jetpack'
import FP from 'functional-promises'
import { once } from 'stunsail'
import TwitchClient from 'twitch'
import ChatClient from 'twitch-chat-client'
import PubSubClient from 'twitch-pubsub-client'
import Webhooks from 'twitch-webhooks'
import TOML from '@iarna/toml'

import log from '../logger'
import { callHook, callHookAndWait } from './hooks'

/**
 * @typedef {import('@converge/types/index').Bot} Bot
 * @typedef {import('@converge/types/index').Core} Core
 */

const getTwitchClient = async (config, options, isBot) => {
  const data = isBot ? config.bot : config.owner

  return TwitchClient.withCredentials(config.clientId, data.auth, undefined, {
    clientSecret: config.clientSecret,
    refreshToken: data.refreshToken,
    expiry: data.expiration === null ? null : new Date(data.expiration),
    onRefresh: async ({ accessToken, refreshToken, expiryDate }) => {
      data.auth = accessToken
      data.refreshToken = refreshToken
      data.expiration = expiryDate?.getTime() ?? 0

      if (isBot) {
        config.bot = data
      } else {
        config.owner = data
      }

      await writeAsync(options.configPath, config |> TOML.stringify)
    }
  })
}

/**
 * @type {() => Promise<Bot>}
 */
export const getInstance = once(async (config, options) => {
  const [client, botClient] = await FP.all([
    getTwitchClient(config, options),
    getTwitchClient(config, options, true)
  ])

  const [owner, bot] = await FP.all([
    ChatClient.forTwitchClient(client),
    ChatClient.forTwitchClient(botClient)
  ])

  await owner.connect()
  await owner.waitForRegistration()
  await bot.connect()
  await bot.waitForRegistration()

  const pubsub = new PubSubClient()
  await pubsub.registerUserListener(client)
  const webhooks = await Webhooks.create(client, { port: 9090 })
  webhooks.listen()

  return { client, botClient, bot, owner, pubsub, webhooks }
})

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

  return partial
}

const createPrevent = event => () => {
  event.isPrevented = true
  const caller = getCaller(callsites())
  log.debug(`command prevented by ${caller}`)
  callHook('preventedCommand', event)
}

const dispatcher = async (ctx, bot, prefix, type, user, message, rawMessage) => {
  if (type === 'action') return

  const event = await buildEvent(
    ctx, rawMessage, prefix, type === 'whisper'
  )

  await callHookAndWait('beforeMessage', event)

  if (event.isPrevented) return

  if (isCommand(message, prefix)) {
    return commandHandler(ctx, event)
  }
}

const setupListeners = (ctx, bot, prefix) => {
  log.trace('registering chat listeners')

  bot.onPrivmsg((source, ...args) =>
    dispatcher(ctx, bot, prefix, 'chat', ...args)
  )

  bot.onAction((source, ...args) =>
    dispatcher(ctx, bot, prefix, 'action', ...args)
  )

  bot.onWhisper((...args) =>
    dispatcher(ctx, bot, prefix, 'whisper', ...args)
  )
}

const aliasHandler = async (ctx, event) => {
  let original
  try {
    original = await ctx.command.getAlias(event.command)
  } catch (e) {
    log.error(`Failed to retrieve aliased command: ${e.message}`)
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

const updateChatUser = async (ctx, event) => {
  try {
    await ctx.db.updateOrCreate('users', {
      id: event.id
    }, {
      name: event.sender,
      mod: event.mod,
      seen: event.seen
    })
  } catch (e) {
    log.error(`Failed to update chat user: ${e.message}`, event)
  }
}

/**
 * @param {Core} ctx
 * @param {import('twitch-chat-client/lib/index').PrivateMessage} messageEvent
 * @param {string} prefix
 * @param {boolean} whispered
 */
const buildEvent = async (ctx, messageEvent, prefix, whispered) => {
  const { displayName, isMod, userId } = messageEvent.userInfo
  const message = messageEvent.message.value
  const mod = isMod || displayName === ctx.ownerName
  const args = getCommandArgs(message)

  const event = {
    id: messageEvent.userInfo.userId,
    sender: displayName,
    mention: `@${displayName}`,
    mod: mod || await ctx.user.isMod(userId),
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

  event.prevent = createPrevent(event)
  event.respond = createResponder(ctx, event)

  await updateChatUser(ctx, event)
  return event
}

/**
 * @param {Core} ctx
 * @returns {Core['createChatEvent']}
 */
const buildEventPublic = ctx => async (message = '', userInfo = {}, whispered = false) => {
  const messageEvent = {
    userInfo: {
      displayName: ctx.botName,
      isMod: true,
      userId: ctx.botId,
      ...userInfo
    },
    message: {
      value: message
    }
  }

  return buildEvent(ctx, messageEvent, await ctx.command.getPrefix(), whispered)
}

/**
 * @param {Core} context
 * @param {import('@converge/types/index').CoreConfig} config
 * @param {import('@converge/types/index').CoreOptions} options
 */
export const loadBot = async (context, config, options) => {
  log.trace('starting up bot instance')
  const { bot } = await getInstance(config, options)

  const shout = message => bot.say(context.ownerName, message)

  const whisper = (user, message) => {
    log.debug('note: outgoing whispers are currently unreliable or broken (thanks twitch)')
    bot.whisper(user, message)
  }

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

    createChatEvent: buildEventPublic(context),

    command: {
      getPrefix
    }
  })

  context.on('beforeShutdown', () => bot.quit())

  await bot.join(context.ownerName)
  const prefix = await getPrefix()
  await setupListeners(context, bot, prefix)

  return bot
}
