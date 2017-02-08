const { client: Client } = require('tmi.js')
const once = require('stunsail/fn/once')
const isObject = require('stunsail/is/object')

const { callHook } = require('./hooks')

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
  console.log('starting up bot instance')
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
  console.log('registering chat listeners')
  bot.on('chat', dispatcher(ctx, bot, prefix, 'chat'))
  bot.on('whisper', dispatcher(ctx, bot, prefix, 'whisper'))
  bot.on('action', dispatcher(ctx, bot, prefix, 'action'))
}

function dispatcher (ctx, bot, prefix, type) {
  console.log(`attaching ${type} event dispatcher`)
  return function (source, user, message, self) {
    if (self) return
    if (type === 'action') return

    let event = buildEvent(ctx, user, message, prefix, type === 'whisper')

    let prevent = createPrevent(event)
    let extend = v => isObject(v) && Object.assign(event, v)
    return callHook('beforeMessage', ctx, extend, prevent)
      .then(() => {
        if (!event.prevented && isCommand(message, prefix)) {
          commandHandler(ctx, event, prevent)
        }
      })
  }
}

function commandHandler (ctx, event, prevent) {
  let extend = v => isObject(v) && Object.assign(event, v)
  return callHook('receivedCommand', ctx, extend, prevent)
    .then(() => !event.prevented && ctx.runCommand(event, prevent))
}

function buildEvent (ctx, user, message, prefix, whispered) {
  let event = {
    id: user['user-id'],
    sender: user['display-name'],
    mod: user['user-type'] === 'mod',
    seen: new Date(),
    raw: message,
    whispered,
    command: getCommand(message, prefix),
    args: getCommandArgs(message),
    argString: getCommandArgString(message),
    prevented: false
  }

  return ctx.db.updateOrCreate('users', {
    id: event.id,
    name: event.sender,
    mod: event.mod,
    seen: event.seen
  }).then(() => event)
}

function createPrevent (event) {
  // TODO: log where this was called from
  event.prevented = false
  return () => { event.prevented = true }
}

