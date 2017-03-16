'use strict'

const Promise = require('bluebird')
const callsites = require('callsites')
const once = require('stunsail/once')
const { client: Client } = require('tmi.js')
const { basename, dirname } = require('path')

const log = require('../logger')
const { callHook, callHookAndWait } = require('./hooks')

let getInstance = once(config => {
  return new Client({
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
})

exports.loadBot = (context, config) => {
  log.trace('starting up bot instance')
  let bot = getInstance(config)

  let shout = message => bot.say(context.ownerName, message)
  let whisper = (user, message) => bot.whisper(user, message)

  function say (user, message) {
    if (arguments.length === 1) {
      message = user
      shout(message)
      return
    }

    return Promise.all([
      context.db.getConfig('responseMention', false),
      context.db.getConfig('whisperMode', false)
    ]).then(([mentions, whispers]) => {
      let mention = mentions ? `${user}: ` : ''

      if (!whispers) {
        shout(`${mention}${message}`)
      } else {
        whisper(user, message)
      }
    })
  }

  let getPrefix = () => context.db.getConfig('prefix', '!')

  context.extend({
    say,
    shout,
    whisper,

    command: {
      getPrefix
    }
  })

  context.on('beforeShutdown', () => bot.disconnect())

  return bot.connect()
    .then(() => getPrefix())
    .then(prefix => setupListeners(context, bot, prefix))
    .then(() => bot)
}

function isCommand (message, prefix) {
  return (
    message.substr(0, prefix.length) === prefix &&
    message.length > prefix.length &&
    message.charAt(prefix.length) !== ' '
  )
}

function getCommand (message, prefix) {
  return message.slice(prefix.length).split(' ', 1)[0].toLowerCase()
}

const getCommandArgs = message => message.split(' ').slice(1)
const getCommandArgString = message => getCommandArgs(message).join(' ')

function setupListeners (ctx, bot, prefix) {
  log.trace('registering chat listeners')
  bot.on('chat', dispatcher(ctx, bot, prefix, 'chat'))
  bot.on('whisper', dispatcher(ctx, bot, prefix, 'whisper'))
  bot.on('action', dispatcher(ctx, bot, prefix, 'action'))
}

function dispatcher (ctx, bot, prefix, type) {
  log.trace(`attaching ${type} event dispatcher`)
  return function (source, user, message, self) {
    if (self) return
    if (type === 'action') return

    return buildEvent(ctx, user, message, prefix, type === 'whisper')
      .then(event => {
        event.respond = createResponder(ctx, event)
        event.prevent = createPrevent(event)
        return callHookAndWait('beforeMessage', event).then(() => event)
      })
      .then(event => {
        if (!event.isPrevented && isCommand(message, prefix)) {
          return commandHandler(ctx, event)
        }
      })
  }
}

function commandHandler (ctx, event) {
  return callHookAndWait('receivedCommand', event)
    .then(() => !event.isPrevented && ctx.runCommand(event))
}

function buildEvent (ctx, user, message, prefix, whispered) {
  let { 'display-name': name, 'user-type': type } = user
  let mod = type === 'mod' || name === ctx.ownerName

  let args = getCommandArgs(message)

  let event = {
    id: user['user-id'],
    sender: name,
    mention: `@${name}`,
    mod: mod || ctx.user.isMod(user['user-id']),
    seen: new Date(),
    raw: message,
    whispered,
    command: getCommand(message, prefix),
    args,
    subcommand: args[0],
    argString: getCommandArgString(message),
    isPrevented: false
  }

  return Promise.props(event)
    .then(event => {
      return ctx.db.updateOrCreate('users', {
        id: event.id
      }, {
        name: event.sender,
        mod: event.mod,
        seen: event.seen
      }).then(() => event)
    })
}

function createPrevent (event) {
  return () => {
    event.isPrevented = true
    let caller = getCaller(callsites())
    log.debug(`command prevented by ${caller}`)
    callHook('preventedCommand', event)
  }
}

function createResponder (context, event) {
  let partial = event.whispered
    ? message => context.whisper(event.sender, message)
    : message => context.say(event.sender, message)

  return message => partial(message)
}

function getCaller (callsite) {
  let caller = callsite[1].getFileName()
  let parent = basename(dirname(caller))
  return `${parent}/${basename(caller)}`
}
