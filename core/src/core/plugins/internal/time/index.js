/**
 * @typedef {import("@converge/types").Core} Core
 * @typedef {import("@converge/types").ChatEvent} ChatEvent
 */

import { map } from "stunsail"

/**
 * @type {Core}
 */
let $ = null

const getPayoutInterval = async offline => {
  const interval = offline
    ? await $.db.getConfig("timeIntervalOffline", "-1s")
    : await $.db.getConfig("timeInterval", "5s")

  return interval === "-1s" ? 0 : $.tick.ms(interval)
}

const setPayoutInterval = async (seconds, offline) => {
  if (!$.is.number(seconds)) {
    seconds = $.tick.ms(seconds) / 1000 || -1
  }

  return offline
    ? $.db.setConfig("timeIntervalOffline", seconds)
    : $.db.setConfig("timeInterval", seconds)
}

const run = async (lastPayout, lastUserList) => {
  if (!await $.db.getConfig("timeEnabled", true)) return

  const interval = $.stream.isLive
    ? await $.db.getConfig("timeInterval", "60s")
    : await $.db.getConfig("timeIntervalOffline", "-1s")

  if (interval === "-1s") return

  const [now, userList] = await handlePayouts(lastPayout, lastUserList)

  $.tick.setTimeout("time:polling", () => {
    run(now, userList)
  }, interval)
}

const handlePayouts = async (lastPayout = Date.now(), lastUserList = []) => {
  const now = Date.now()
  const { isLive } = $.stream
  const userList = $.user.list

  const interval = await getPayoutInterval(!isLive)
  if (interval <= 0) return [lastPayout, userList]

  const nextPayout = lastPayout + interval
  const payout = ((nextPayout - lastPayout) / 1000 % 60) | 0

  await Promise.all(map(userList, async user => {
    if (user === $.botName) return
    if (!$.is.oneOf(user, lastUserList)) return

    await $.db.create("time", { name: user })
    return $.db.increment("time.value", { name: user }, payout)
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
      getPayoutInterval,
      setPayoutInterval
    })

    await context.db.model("time", {
      name: { type: String, primary: true },
      value: { type: Number, defaultTo: 0 }
    })

    return run()
  }
}
