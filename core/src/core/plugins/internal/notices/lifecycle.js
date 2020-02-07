/**
 * @typedef {import('@converge/types').Core} Core
 * @typedef {import('@converge/types').ChatEvent} ChatEvent
 * @typedef {import('@converge/types').PluginLifecycle} PluginLifecycle
 * @typedef {import('@converge/state').Store} Store
 */

import { get } from 'stunsail'

/**
 * @type {Core}
 */
let $ = null

const getMessage = name =>
  $.db.get('notices.value', { key: name })

const add = async (name, message) => {
  if ($.command.exists(name) || await getMessage(name)) {
    return false
  }

  const added = await $.db.create('notices', { key: name, value: message })
  if (added) $.addCustomCommand(name, { response: message })
  return Boolean(added)
}

const edit = async (name, message) => {
  await $.db.updateOrCreate('notices', { key: name }, { value: message })

  if (!$.command.exists(name)) {
    $.addCustomCommand(name, { response: message })
  }

  return $.command.exists(name)
}

const remove = async (name, withCommand) => {
  const removed = await $.db.remove('notices', { key: name })
  if (removed && withCommand) {
    const affected = await $.db.remove('commands', { name, caller: 'custom' })
    return Boolean(affected)
  }

  return Boolean(removed)
}

/**
 * @param {Store} store
 * @param {string} lastNotice
 */
const run = async (store, lastNotice) => {
  const [
    interval,
    userLimit,
    chatLines,
    onlineOnly,
    notices
  ] = await Promise.all([
    $.db.getPluginConfig('notices.interval', '10m'),
    $.db.getPluginConfig('notices.userLimit', 10),
    $.db.getPluginConfig('notices.chatLines', 15),
    $.db.getPluginConfig('notices.onlineOnly', true),
    $.db.find('notices')
  ])

  if (interval === '-1s') return

  let thisNotice = lastNotice

  do {
    thisNotice = get($.to.random(notices), 'key')
  } while (notices.length > 1 && thisNotice === lastNotice)

  if (
    thisNotice &&
    (!$.stream.isLive && onlineOnly) &&
    $.user.count >= $.to.int(userLimit) &&
    store.getState() >= $.to.int(chatLines)
  ) {
    const event = await $.createChatEvent()
    event.command = thisNotice

    await $.runCommand(event)
    store.getActions().reset()
  }

  $.tick.setTimeout('notice:polling', () => run(store, thisNotice), interval)
}

/**
 * @type {PluginLifecycle}
 */
export const lifecycle = {
  async setup (context) {
    $ = context

    const store = $.store(0, {
      increment: () => lines => lines + 1,
      reset: () => () => 0
    })

    $.on('beforeMessage', store.getActions().increment)

    await $.db.model('notices', {
      key: { type: String, primary: true },
      value: String,
      info: String
    })

    const interval = await $.db.getPluginConfig('notices.interval', '10m')
    if (interval !== '-1s') {
      $.tick.setTimeout('notice:polling', () => run(store), interval)
    }

    $.extend({
      notices: {
        add,
        get: getMessage,
        edit,
        remove
      }
    })
  }
}
