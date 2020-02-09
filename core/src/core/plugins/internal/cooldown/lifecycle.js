/**
 * @typedef {import("@converge/types").Core} Core
 * @typedef {import("@converge/types").ChatEvent} ChatEvent
 * @typedef {import("./types").Cooldown} Cooldown
 * @typedef {import("./types").GlobalCooldown} GlobalCooldown
 * @typedef {import("./types").Scope} Scope
 * @typedef {import("./types").State} State
 */

import { matches } from "stunsail"

/**
 * @type {Core}
 */
let $ = null

const GlobalCooldown = Object.freeze({ global: true })

/**
 * @type {Core["command"]["getCooldown"]}
 */
const getCooldown = async (command, subcommand) => {
  if (!subcommand) {
    return $.db.get("commands.cooldown", { name: command })
  } else {
    const result = await $.db.get("subcommands.cooldown", {
      name: subcommand,
      parent: command
    })

    return result >= 0
      ? result
      : $.db.get("commands.cooldown", { name: command })
  }
}

/**
 * @type {Core["command"]["setCooldown"]}
 */
const setCooldown = async (command, subcommand, value) => {
  if (typeof value === "undefined" && $.is.number(subcommand)) {
    value = subcommand
    subcommand = undefined
  }

  const seconds = $.to.int(value)

  if (!subcommand) {
    await $.db.set("commands", { name: command }, { cooldown: seconds })
  } else {
    if (value === -1) {
      const criteria = {
        name: subcommand,
        parent: command
      }

      const inherited = await $.db.get("commands.cooldown", { name: command })
      await $.db.set("subcommands", criteria, { cooldown: inherited })
    } else {
      await $.db.set("subcommands", criteria, { cooldown: seconds })
    }
  }
}

/**
 * @returns {Promise<boolean>}
 */
const getDefault = async () => {
  return $.db.getConfig("defaultCooldown")
}

/**
 * @param {Scope} user
 * @param {boolean} useGlobalCooldown
 */
const normalizeScope = (user, useGlobalCooldown) => {
  return useGlobalCooldown
    ? GlobalCooldown
    : user ?? GlobalCooldown
}

/**
 * @param {State} state
 * @param {Scope} scope
 * @param {string} command
 * @param {string} subcommand
 */
const getIndex = (state, scope, command, subcommand) => {
  const search = {
    command,
    subcommand,
    scope
  }

  return state.findIndex(item => matches(item, search))
}

/**
 * @param {State} state
 * @param {Scope} scope
 * @param {string} command
 * @param {string} subcommand
 */
const getActiveCooldown = (state, scope, command, subcommand) => {
  const search = {
    command,
    subcommand,
    scope
  }

  return state.find(item => matches(item, search))
}

/**
 * @returns {Core["command"]["startCooldown"]}
 */
const startCooldown = store => async (user, command, subcommand) => {
  if (!await $.db.getPluginConfig("cooldown.enabled", true)) return

  const [includeAdmins, isAdmin] = await Promise.all([
    $.db.getPluginConfig("cooldown.includeAdmins", false),
    $.user.isAdmin(user.id)
  ])

  if (includeAdmins && !isAdmin) return

  const [cmdTime, fallback, useGlobalCooldown] = await Promise.all([
    getCooldown(command, subcommand),
    getDefault(),
    $.db.getConfig("globalCooldown")
  ])

  const time = $.is.number(cmdTime) ? cmdTime : fallback

  if (!user.id && user.name) {
    user.id = await $.user.resolveIdByName(user.name)
  }

  if (!user.name && user.id) {
    user.name = await $.user.resolveNameById(user.id)
  }

  store.getActions().startCooldown({
    command,
    subcommand,
    scope: normalizeScope(user, useGlobalCooldown),
    until: Date.now() + (time * 1000)
  })
}

/**
 * @returns {Core["command"]["clearCooldown"]}
 */
const clearCooldown = store => async (user, command, subcommand) => {
  const scope = normalizeScope(user, await $.db.getConfig("globalCooldown"))
  const index = getIndex(store.getState(), scope, command, subcommand)

  if (index >= 0) {
    store.getActions().clearCooldown(index)
    return true
  } else {
    return false
  }
}

/**
 * @param {Cooldown} cooldown
 */
const getTimeDelta = cooldown => {
  const ms = cooldown.until - Date.now()
  return $.to.int(ms / 1000)
}

/**
 * @returns {Core["command"]["getTimeRemaining"]}
 */
const getTimeRemaining = store => async (user, command, subcommand) => {
  const scope = normalizeScope(user, await $.db.getConfig("globalCooldown"))
  const active = getActiveCooldown(store.getState(), scope, command, subcommand)

  if (active) {
    return getTimeDelta(active)
  } else {
    return 0
  }
}

/**
 * @returns {Core["command"]["isOnCooldown"]}
 */
const isOnCooldown = store => async (user, command, subcommand) => {
  const getSeconds = getTimeRemaining(store)
  return (await getSeconds(user, command, subcommand)) > 0
}

/**
 * @type {import("@converge/types").PluginLifecycle<State>}
 */
export const lifecycle = {
  async setup (context) {
    $ = context

    /**
     * @type {State}
     */
    const originalState = []

    const store = $.store(originalState, {
      startCooldown: props => state => { state.push(props) },
      clearCooldown: index => state => { state.splice(index, 1) },
      clearExpiredCooldowns: () => state =>
        state.filter(cooldown => getTimeDelta(cooldown) >= 0)
    })

    context.extend({
      command: {
        getCooldown,
        setCooldown,
        startCooldown: startCooldown(store),
        clearCooldown: clearCooldown(store),
        getTimeRemaining: getTimeRemaining(store),
        isOnCooldown: isOnCooldown(store)
      }
    })

    return store
  },

  async beforeCommand ($, e, store) {
    const { id, command, subcommand } = e
    store.getActions().clearExpiredCooldowns()
    const timeLeft = await $.command.getTimeRemaining({ id }, command, subcommand)

    if (timeLeft > 0) {
      const commandString = `${command}${subcommand ? " " + subcommand : ""}`
      $.whisper(
        `You need to wait ${timeLeft} seconds to use '!${commandString}' again.`
      )

      e.prevent()
    }
  },

  async afterCommand ($, e) {
    const user = {
      id: e.id,
      name: e.sender
    }

    return $.command.startCooldown(user, e.command, e.subcommand)
  }
}
