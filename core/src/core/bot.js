/**
 * @typedef {import('@converge/types').Bot} Bot
 * @typedef {import('@converge/types').Core} Core
 * @typedef {import('@converge/types').CoreConfig} CoreConfig
 * @typedef {import('@converge/types').CoreOptions} CoreOptions
 * @typedef {import('@converge/types').ChatEvent} ChatEvent
 * @typedef {import('twitch-chat-client').PrivateMessage} PrivateMessage
 */

import { it } from 'param.macro'

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
* @param {CoreConfig} config
* @param {CoreOptions} options
* @param {boolean} isBot
* @returns {Promise<TwitchClient>}
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

      await writeAsync(options.configPath, TOML.stringify(config))
    }
  })
}

/**
 * @param {TwitchClient} twitchClient
 * @param {{ port: number }} webhookOptions
 */
const getWebhookClient = async (twitchClient, webhookOptions) => {
  try {
    const webhooks = await Webhooks.create(twitchClient, webhookOptions)
    webhooks.listen()
    return webhooks
  } catch (e) {
    log.error(`Failed to set up webhooks: ${e.message}. They will be unavailable.`)
  }
}

/**
 * @type {(config: CoreConfig, options: CoreOptions) => Promise<Bot>}
 */
export const getInstance = once(
  /**
   * @param {CoreConfig} config
   * @param {CoreOptions} options
   */
  async (config, options) => {
    /**
     * @type {[TwitchClient, TwitchClient]}
     */
    const [client, botClient] = await FP.all([
      getTwitchClient(config, options),
      getTwitchClient(config, options, true)
    ])

    /**
     * @type {[ChatClient, ChatClient]}
     */
    const [owner, bot] = await FP.all([
      ChatClient.forTwitchClient(client),
      ChatClient.forTwitchClient(botClient)
    ])

    owner.onRegister(() => owner.join(config.owner.name))
    bot.onRegister(() => bot.join(config.owner.name))
    await FP.all([owner.connect(), bot.connect()])

    const pubsub = new PubSubClient()
    await pubsub.registerUserListener(client)

    const webhooks = await getWebhookClient(client, { port: 8686 })

    return { client, botClient, bot, owner, pubsub, webhooks }
  }
)

/**
 * @param {string} message
 * @param {string} prefix
 */
const isCommand = (message, prefix) =>
  message.substr(0, prefix.length) === prefix &&
  message.length > prefix.length &&
  message.charAt(prefix.length) !== ' '

/**
 * @param {string} message
 * @param {string} prefix
 */
const getCommand = (message, prefix) =>
  message.slice(prefix.length).split(' ', 1)[0].toLowerCase()

/**
 * @param {string} message
 */
const getCommandArgs = message =>
  message.split(' ').slice(1)

/**
 * @param {string} message
 */
const getCommandArgString = message =>
  getCommandArgs(message).join(' ')

/**
 * @param {string} message
 */
const getCommandSubArgs = message =>
  getCommandArgs(message).slice(1)

/**
 * @param {string} message
 */
const getCommandSubArgString = message =>
  getCommandArgs(message).slice(1).join(' ')

/**
 * @param {string} message
 * @param {string} prefix
 */
const getCommandData = (message, prefix) => {
  if (!isCommand(message, prefix)) {
    return {
      command: '',
      subcommand: '',
      args: [],
      subArgs: [],
      argString: '',
      subArgString: ''
    }
  } else {
    const args = getCommandArgs(message)
    return {
      command: getCommand(message, prefix),
      subcommand: args[0],
      args,
      argString: getCommandArgString(message),
      subArgs: getCommandSubArgs(message),
      subArgString: getCommandSubArgString(message)
    }
  }
}

/**
 * @param {ReturnType<import('callsites')>} callsite
 */
const getCaller = callsite => {
  const caller = callsite[1].getFileName()
  const parent = basename(dirname(caller))
  return `${parent}/${basename(caller)}`
}

/**
 * @param {Core} context
 * @param {ChatEvent} event
 */
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

/**
 * @param {Core} ctx
 * @param {ChatClient} bot
 * @param {string} prefix
 * @param {string} type
 * @param {string} user
 * @param {string} message
 * @param {PrivateMessage} rawMessage
 */
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

/**
 * @param {Core} ctx
 * @param {ChatClient} bot
 * @param {string} prefix
 */
const setupListeners = async (ctx, bot, prefix) => {
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

/**
 * @param {Core} ctx
 * @param {ChatEvent} event
 */
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

  const newMessage = [command, subcommand, ...rest, ...event.args]
    .filter(it != null)
    .join(' ')

  const prefix = await ctx.command.getPrefix()
  const data = getCommandData(prefix + newMessage.trimLeft(), prefix)
  return commandHandler(ctx, { ...event, ...data })
}

/**
 * @param {Core} ctx
 * @param {ChatEvent} event
 */
const commandHandler = async (ctx, event) => {
  await callHookAndWait('receivedCommand', event)
  if (!event.isPrevented && !await ctx.runCommand(event)) {
    return aliasHandler(ctx, event)
  }
}

/**
 * @param {Core} ctx
 * @param {ChatEvent} event
 */
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
 * @param {PrivateMessage} messageEvent
 * @param {string} prefix
 * @param {boolean} whispered
 * @returns {Promise<ChatEvent>}
 */
const buildEvent = async (ctx, messageEvent, prefix, whispered) => {
  const { displayName, isMod, userId } = messageEvent.userInfo
  const message = messageEvent.message.value
  const mod = isMod || displayName === ctx.ownerName

  const event = {
    id: messageEvent.userInfo.userId,
    sender: displayName,
    mention: `@${displayName}`,
    mod: mod || await ctx.user.isMod(userId),
    seen: new Date(),
    raw: message,
    whispered,
    isPrevented: false,
    ...getCommandData(message, prefix)
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
 * @param {CoreConfig} config
 * @param {CoreOptions} options
 * @returns {Promise<ChatClient>}
 */
export const loadBot = async (context, config, options) => {
  log.trace('starting up bot instance')
  const {
    bot,
    owner,
    webhooks
  } = await getInstance(config, options)

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

  context.on('beforeShutdown', () => FP.all([
    bot.quit(),
    owner.quit(),
    webhooks?.unlisten()
  ]))

  const prefix = await getPrefix()
  await setupListeners(context, bot, prefix)

  return bot
}
