import match from 'stunsail/match'

let $ = null
let cooldowns = []

async function getCooldown (cmd, sub) {
  if (!sub) {
    return $.db.get('commands.cooldown', { name: cmd })
  } else {
    let res = await $.db.get('subcommands.cooldown', { name: sub })
    return res >= 0 ? res : $.db.get('commands.cooldown', { name: cmd })
  }
}

async function setCooldown (cmd, value, sub) {
  if (!sub) {
    await $.db.set('commands', { name: cmd }, { cooldown: value })
  } else {
    if (value === -1) {
      let res = await $.db.get('commands.cooldown', { name: cmd })
      await $.db.set('subcommands', { name: sub }, { cooldown: res })
    } else {
      await $.db.set('subcommands', { name: cmd }, { cooldown: value })
    }
  }
}

async function startCooldown (cmd, user, sub) {
  if (!await $.db.getExtConfig('cooldown.enabled', true)) return

  let [includeAdmins, isAdmin] = await Promise.all([
    $.db.getExtConfig('cooldown.includeAdmins', false),
    $.user.isAdmin(user)
  ])

  if (includeAdmins && !isAdmin) return

  let [cmdTime, fallback, scope] = await Promise.all([
    getCooldown(cmd, sub),
    getDefault(),
    $.db.getConfig('globalCooldown')
  ])
  let time = $.is.number(cmdTime) ? cmdTime : fallback

  cooldowns.push({
    name: cmd,
    sub,
    scope: scope || !user,
    until: Date.now() + (time * 1000)
  })
}

async function clearCooldown (cmd, user, sub) {
  let index = await getIndex(cmd, user, sub)

  if (index >= 0) {
    let removed = cooldowns.splice(index, 1)
    return removed.length === 1
  } else {
    return false
  }
}

async function getDefault () {
  return $.db.getConfig('defaultCooldown')
}

async function isOnCooldown (cmd, user, sub) {
  if (!await $.db.getExtConfig('cooldown.enabled', true)) return

  let scope = await $.db.getConfig('globalCooldown') || !user
  let active = cooldowns.find(match({ name: cmd, scope, sub }))

  if (!active) return false

  let timeLeft = active.until - Date.now()
  if (timeLeft > 0) {
    let [includeAdmins, isAdmin] = await Promise.all([
      $.db.getExtConfig('cooldown.includeAdmins', false),
      $.user.isAdmin(user)
    ])

    if (includeAdmins && !isAdmin) return false

    return parseInt(timeLeft / 1000)
  } else {
    let index = await getIndex(cmd, user, sub)
    let removed = cooldowns.splice(index, 1)
    return removed.length !== 1
  }
}

async function getIndex (cmd, user, sub) {
  let scope = await $.db.getConfig('globalCooldown') || !user
  return cooldowns.findIndex(match({ name: cmd, scope, sub }))
}

export default {
  setup (context) {
    $ = context

    context.extend({
      command: {
        getCooldown,
        setCooldown,
        startCooldown,
        clearCooldown,
        isOnCooldown
      }
    })
  },

  async beforeCommand ($, e) {
    let timeLeft = await isOnCooldown(e.command, e.sender, e.subcommand)

    if (timeLeft) {
      let command = `${e.command}${e.subcommand ? ' ' + e.subcommand : ''}`
      $.whisper(
        e.sender,
        `You need to wait ${timeLeft} seconds to use '!${command}' again.`
      )

      e.prevent()
    }

    return '40504'
  },

  afterCommand ($, e) {
    return startCooldown(e.command, e.sender, e.subcommand)
  }
}
