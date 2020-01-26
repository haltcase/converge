/**
 * @typedef {import('@converge/types').Core} Core
 * @typedef {import('@converge/types').ChatEvent} ChatEvent
 */

import { matches } from 'stunsail'

/**
 * @type {Core}
 */
let $ = null
const cooldowns = []

const getCooldown = async (cmd, sub) => {
  if (!sub) {
    return $.db.get('commands.cooldown', { name: cmd })
  } else {
    const res = await $.db.get('subcommands.cooldown', { name: sub })
    return res >= 0 ? res : $.db.get('commands.cooldown', { name: cmd })
  }
}

const setCooldown = async (cmd, value, sub) => {
  if (!sub) {
    await $.db.set('commands', { name: cmd }, { cooldown: value })
  } else {
    if (value === -1) {
      const res = await $.db.get('commands.cooldown', { name: cmd })
      await $.db.set('subcommands', { name: sub }, { cooldown: res })
    } else {
      await $.db.set('subcommands', { name: cmd }, { cooldown: value })
    }
  }
}

const startCooldown = async (cmd, user, sub) => {
  if (!await $.db.getPluginConfig('cooldown.enabled', true)) return

  const [includeAdmins, isAdmin] = await Promise.all([
    $.db.getPluginConfig('cooldown.includeAdmins', false),
    $.user.isAdmin(user)
  ])

  if (includeAdmins && !isAdmin) return

  const [cmdTime, fallback, scope] = await Promise.all([
    getCooldown(cmd, sub),
    getDefault(),
    $.db.getConfig('globalCooldown')
  ])
  const time = $.is.number(cmdTime) ? cmdTime : fallback

  cooldowns.push({
    name: cmd,
    sub,
    scope: scope || !user,
    until: Date.now() + (time * 1000)
  })
}

const clearCooldown = async (cmd, user, sub) => {
  const index = await getIndex(cmd, user, sub)

  if (index >= 0) {
    const removed = cooldowns.splice(index, 1)
    return removed.length === 1
  } else {
    return false
  }
}

const getDefault = async () => {
  return $.db.getConfig('defaultCooldown')
}

const isOnCooldown = async (cmd, user, sub) => {
  if (!await $.db.getPluginConfig('cooldown.enabled', true)) return

  const scope = await $.db.getConfig('globalCooldown') || !user
  const active = cooldowns.find(obj => matches(obj, { name: cmd, scope, sub }))

  if (!active) return false

  const timeLeft = active.until - Date.now()
  if (timeLeft > 0) {
    const [includeAdmins, isAdmin] = await Promise.all([
      $.db.getPluginConfig('cooldown.includeAdmins', false),
      $.user.isAdmin(user)
    ])

    if (includeAdmins && !isAdmin) return false

    return parseInt(timeLeft / 1000)
  } else {
    const index = await getIndex(cmd, user, sub)
    const removed = cooldowns.splice(index, 1)
    return removed.length !== 1
  }
}

const getIndex = async (cmd, user, sub) => {
  const scope = await $.db.getConfig('globalCooldown') || !user
  return cooldowns.findIndex(obj => matches(obj, { name: cmd, scope, sub }))
}

/**
 * @type {import('@converge/types').PluginLifecycle}
 */
export const lifecycle = {
  async setup (context) {
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
    const timeLeft = await isOnCooldown(e.command, e.sender, e.subcommand)

    if (timeLeft) {
      const command = `${e.command}${e.subcommand ? ' ' + e.subcommand : ''}`
      $.whisper(
        e.sender,
        `You need to wait ${timeLeft} seconds to use '!${command}' again.`
      )

      e.prevent()
    }
  },

  async afterCommand ($, e) {
    return startCooldown(e.command, e.sender, e.subcommand)
  }
}
