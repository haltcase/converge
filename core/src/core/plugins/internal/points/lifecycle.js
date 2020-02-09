/**
 * @typedef {import("@converge/types").Core} Core
 * @typedef {import("@converge/types").ChatEvent} ChatEvent
 */

import { map } from "stunsail"

/**
 * @type {Core} $
 */
let $ = null

const add = async (name, amount) => {
  amount = $.to.int(amount)
  if (amount < 1) return sub(name, amount)
  await $.db.create("points", { name })
  return $.db.increment("points.value", { name }, amount)
}

const sub = async (name, amount) => {
  amount = $.to.int(amount)
  if (amount < 1) return
  await $.db.create("points", { name })
  return $.db.decrement("points.value", { name }, amount)
}

const get = async (name, asString) => {
  const points = await $.db.get("points.value", { name }, 0)
  return asString ? str(points) : points
}

const set = (name, value) =>
  $.db.set("points.value", { name }, $.to.int(value))

const str = async amount => {
  amount = $.to.int(amount)
  return `${amount.toLocaleString()} ${await getPointName(amount === 1)}`
}

const getPointName = singular => {
  const key = singular ? "pointName" : "pointNamePlural"
  return $.db.getConfig(key, "points")
}

const setPointName = async (name, singular) => {
  const key = singular ? "pointName" : "pointNamePlural"

  if (!singular) {
    const current = await $.db.getConfig(key)

    if (current) {
      await $.command.removeAlias(current)
    }

    await $.command.addAlias(name, "points")
  }

  return $.db.setConfig(key, name)
}

const getPayoutAmount = async offline => {
  const amount = offline
    ? await $.db.getConfig("pointPayoutOffline", -1)
    : await $.db.getConfig("pointPayout", 10)

  return $.to.int(amount)
}

const setPayoutAmount = (amount, offline) => {
  amount = $.to.int(amount)
  const key = offline ? "pointPayoutOffline" : "pointPayout"
  return $.db.setConfig(key, amount)
}

const getPayoutInterval = async offline => {
  const interval = offline
    ? await $.db.getConfig("pointIntervalOffline", "-1s")
    : await $.db.getConfig("pointInterval", "5m")

  return interval === "-1s" ? 0 : $.tick.ms(interval) / 1_000
}

const setPayoutInterval = (seconds, offline) => {
  if (!$.is.number(seconds)) {
    // time string, e.g. 5m 30s
    try {
      seconds = $.tick.ms(seconds) / 1_000 || -1
    } catch {
      $.log.debug("points", `could not convert non-number to time interval: '${seconds}'`)
      return
    }
  }

  const value = seconds <= 0 ? "-1s" : $.to.duration(seconds * 1_000)

  const key = offline ? "pointIntervalOffline" : "pointInterval"
  return $.db.setConfig(key, value)
}

const getCommandPrice = async (command, subcommand) => {
  if (!subcommand) {
    return $.db.get("commands.price", { name: command }, 0)
  }

  let cost = await $.db.get("subcommands.price", {
    name: subcommand,
    parent: command
  }, -1)

  if (cost === -1) {
    cost = await $.db.get("commands.price", { name: command })
  }

  return $.to.int(cost)
}

const setCommandPrice = async (command, subcommand, price) => {
  if (typeof price === "undefined" && Number.isFinite(subcommand)) {
    price = subcommand
    subcommand = undefined
  }

  if (!subcommand) {
    await $.db.set("commands.price", { name: command }, price)
  } else {
    if (price < 0) {
      price = -1
    }

    return $.db.set("subcommands.price", {
      name: subcommand,
      parent: command
    }, price)
  }
}

const canAffordCommand = async (user, command, subcommand) => {
  const [price, points] = await Promise.all([
    getCommandPrice(command, subcommand),
    get(user)
  ])

  return points >= price
}

const run = async (lastPayout, lastUserList) => {
  if (!await $.db.getConfig("pointsEnabled", true)) return

  const interval = $.stream.isLive
    ? await $.db.getConfig("pointInterval", "5s")
    : await $.db.getConfig("pointIntervalOffline", "-1s")

  if (interval === "-1s") return

  const [now, userList] = await handlePayouts(lastPayout, lastUserList)

  $.tick.setTimeout("points:poll", () => {
    run(now, userList)
  }, interval)
}

const handlePayouts = async (lastPayout = Date.now(), lastUserList = []) => {
  const now = Date.now()
  const { isLive } = $.stream
  const userList = $.user.list

  const [interval, amount] = await Promise.all([
    getPayoutInterval(!isLive).then(value => value / 1_000),
    getPayoutAmount(!isLive)
  ])

  const nextPayout = lastPayout + interval

  let payout = 0
  if (amount > 0 && interval > 0) {
    if (nextPayout >= now) return [now, userList]
    payout = amount
  } else {
    return [now, userList]
  }

  await Promise.all(map(userList, async user => {
    if (user === $.botName) return
    if (!$.is.oneOf(user, lastUserList)) return

    await $.db.create("points", { name: user })

    const event = { user, amount: payout }
    $.emit("points:payout", event)
    await $.callHookAndWait("points.beforePayout", event)
    return $.db.increment("points.value", { name: user }, event.amount)
  }))

  return [now, userList]
}

/**
 * @type {import("@converge/types").PluginLifecycle}
 */
export const lifecycle = {
  async setup (context) {
    $ = context

    context.extend({
      command: {
        getPrice: getCommandPrice,
        setPrice: setCommandPrice
      },

      points: {
        add,
        sub,
        str,
        get,
        set,
        getName: getPointName,
        setName: setPointName,
        getPointName,
        setPointName,
        getPayoutAmount,
        setPayoutAmount,
        getPayoutInterval,
        setPayoutInterval
      },

      user: {
        canAffordCommand
      }
    })

    await context.db.model("points", {
      name: { type: String, primary: true },
      value: { type: Number, defaultTo: 0 }
    })

    return run()
  },

  async beforeCommand ($, e) {
    if (!await $.db.getPluginConfig("points.enabled", true)) return

    const [price, points] = await Promise.all([
      getCommandPrice(e.command, e.subcommand),
      get(e.sender)
    ])

    if (points >= price) return

    const message = await $.weave("command.not-enough-points", e.command, price, points)
    $.whisper(e.sender, message)

    e.prevent()
  },

  async afterCommand ($, e) {
    const charge = await getCommandPrice(e.command, e.subcommand)
    return sub(e.sender, charge)
  }
}
