/**
 * @typedef {import('@converge/types').Core} Core
 * @typedef {import('@converge/types').ChatEvent} ChatEvent
 */

import map from 'stunsail/map'

/**
 * @type {Core} $
 */
let $ = null

const add = async (name, amount) => {
  amount = $.to.int(amount)
  if (amount < 1) return sub(name, amount)
  await $.db.create('points', { name })
  return $.db.increment('points.value', { name }, amount)
}

const sub = async (name, amount) => {
  amount = $.to.int(amount)
  if (amount < 1) return
  await $.db.create('points', { name })
  return $.db.decrement('points.value', { name }, amount)
}

const get = async (name, asString) => {
  const points = await $.db.get('points.value', { name }, 0)
  return asString ? str(points) : points
}

const set = (name, value) =>
  $.db.set('points.value', { name }, $.to.int(value))

const str = async amount => {
  amount = $.to.int(amount)
  return amount === 1
    ? `${amount} ${await getPointName(true)}`
    : `${amount} ${await getPointName()}`
}

const getPointName = singular => {
  return singular
    ? $.db.getConfig('pointName', 'point')
    : $.db.getConfig('pointNamePlural', 'points')
}

const setPointName = (name, singular) => {
  return singular
    ? $.db.setConfig('pointName', name)
    : $.db.setConfig('pointNamePlural', name)
}

const getPayoutAmount = async offline => {
  const amount = offline
    ? await $.db.getConfig('pointPayoutOffline', -1)
    : await $.db.getConfig('pointPayout', 10)

  return $.to.int(amount)
}

const setPayoutAmount = (amount, offline) => {
  amount = $.to.int(amount)
  return offline
    ? $.db.setConfig('pointPayoutOffline', amount)
    : $.db.setConfig('pointPayout', amount)
}

const getPayoutInterval = async offline => {
  const interval = offline
    ? await $.db.getConfig('pointIntervalOffline', '-1s')
    : await $.db.getConfig('pointInterval', '5m')

  return interval === '-1s' ? 0 : $.tick.ms(interval)
}

const setPayoutInterval = (seconds, offline) => {
  if (!$.is.number(seconds)) {
    seconds = $.tick.ms(seconds) / 1000 || -1
  }

  return offline
    ? $.db.setConfig('pointIntervalOffline', seconds)
    : $.db.setConfig('pointInterval', seconds)
}

const getCommandPrice = async (command, subcommand) => {
  if (!subcommand) {
    return $.db.get('commands.price', { name: command }, 0)
  }

  let cost = await $.db.get('subcommands.price', { name: subcommand }, -1)

  if (cost === -1) {
    cost = await $.db.get('commands.price', { name: command })
  }

  return $.to.int(cost)
}

const setCommandPrice = async (command, subcommand, price) => {
  if (typeof price === 'undefined' && Number.isFinite(subcommand)) {
    price = subcommand
    subcommand = undefined
  }

  if (!subcommand) {
    await $.db.set('commands', { name: command }, { name: command, price })
  } else {
    if (price === -1) {
      price = $.to.int(await $.db.get('commands.price', { name: command }))
    }

    return $.db.set('subcommands', { name: command }, { name: command, price })
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
  if (!await $.db.getConfig('pointsEnabled', true)) return

  const interval = $.stream.isLive
    ? await $.db.getConfig('pointInterval', '5s')
    : await $.db.getConfig('pointIntervalOffline', '-1s')

  if (interval === '-1s') return

  const [now, userList] = await handlePayouts(lastPayout, lastUserList)

  $.tick.setTimeout('points:poll', () => {
    run(now, userList)
  }, interval)
}

const handlePayouts = async (lastPayout = Date.now(), lastUserList = []) => {
  const now = Date.now()
  const { isLive } = $.stream
  const userList = $.user.list

  const [interval, amount] = await Promise.all([
    getPayoutInterval(!isLive),
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

    await $.db.create('points', { name: user })

    const event = { user, amount: payout }
    $.emit('points:payout', event)
    await $.callHookAndWait('points.beforePayout', event)
    return $.db.increment('points.value', { name: user }, event.amount)
  }))

  return [now, userList]
}

/**
 * @type {import('@converge/types').PluginLifecycle}
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

    await context.db.model('points', {
      name: { type: String, primary: true },
      value: { type: Number, defaultTo: 0 }
    })

    return run()
  },

  async beforeCommand ($, e) {
    if (!await $.db.getPluginConfig('points.enabled', true)) return

    const [price, points] = await Promise.all([
      getCommandPrice(e.command, e.subcommand),
      get(e.sender)
    ])

    if (points >= price) return

    const message = $.weave('command.not-enough-points', e.command, price, points)
    $.whisper(e.sender, message)

    e.prevent()
  },

  async afterCommand ($, e) {
    const charge = await getCommandPrice(e.command, e.subcommand)
    return sub(e.sender, charge)
  }
}
