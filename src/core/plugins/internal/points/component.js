import map from 'stunsail/map'

let $ = null

let toInt = n => $.to.number(n, true)

async function add (name, amount) {
  amount = toInt(amount)
  if (amount < 1) return sub(name, amount)
  await $.db.create('points', { name })
  return $.db.incr('points.value', { name }, amount)
}

async function sub (name, amount) {
  amount = toInt(amount)
  if (amount < 1) return
  await $.db.create('points', { name })
  return $.db.decr('points.value', { name }, amount)
}

async function get (name, asString) {
  let points = await $.db.get('points.value', { name }, 0)
  return asString ? str(points) : points
}

async function set (name, value) {
  value = toInt(value)
  return $.db.set('points.value', { name }, value)
}

async function str (amount) {
  amount = toInt(amount)
  return amount === 1
    ? `${amount} ${await getPointName(true)}`
    : `${amount} ${await getPointName()}`
}

async function getPointName (singular) {
  return singular
    ? $.db.getConfig('pointName', 'point')
    : $.db.getConfig('pointNamePlural', 'points')
}

async function setPointName (name, singular) {
  return singular
    ? $.db.setConfig('pointName', name)
    : $.db.setConfig('pointNamePlural', name)
}

async function getPayoutAmount (offline) {
  let amount = offline
    ? await $.db.getConfig('pointPayoutOffline', -1)
    : await $.db.getConfig('pointPayout', 6)

  return toInt(amount)
}

async function setPayoutAmount (amount, offline) {
  amount = toInt(amount)
  return offline
    ? $.db.setConfig('pointPayoutOffline', amount)
    : $.db.setConfig('pointPayout', amount)
}

async function getPayoutInterval (offline) {
  let interval = offline
    ? await $.db.getConfig('pointIntervalOffline', '-1s')
    : await $.db.getConfig('pointInterval', '5s')

  return interval === '-1s' ? 0 : $.tick.ms(interval)
}

async function setPayoutInterval (seconds, offline) {
  if (!$.is.number(seconds)) {
    seconds = $.tick.ms(seconds) / 1000 || -1
  }

  return offline
    ? $.db.setConfig('pointIntervalOffline', seconds)
    : $.db.setConfig('pointInterval', seconds)
}

async function getCommandPrice (command, subcommand) {
  if (!subcommand) {
    return $.db.get('commands.price', { name: command })
  } else {
    let cost = toInt(
      await $.db.get('subcommands.price', { name: subcommand })
    )

    if (cost === -1) {
      cost = await $.db.get('commands.price', { name: command })
    }

    return toInt(cost)
  }
}

async function setCommandPrice (command, subcommand, price) {
  if (arguments.length === 2) {
    price = subcommand
    subcommand = undefined
  }

  price = toInt(price)

  if (!subcommand) {
    await $.db.set('commands', { name: command }, { name: command, price })
  } else {
    if (price === -1) {
      price = toInt(await $.db.get('commands.price', { name: command }))
    }

    return $.db.set('subcommands', { name: command }, { name: command, price })
  }
}

async function canAffordCommand (user, command, subcommand) {
  let [price, points] = await Promise.all([
    getCommandPrice(command, subcommand),
    get(user)
  ])

  return points >= price
}

async function run (lastPayout, lastUserList) {
  if (!await $.db.getConfig('pointsEnabled', true)) return

  let interval = $.stream.isLive
    ? await $.db.getConfig('pointInterval', '5s')
    : await $.db.getConfig('pointIntervalOffline', '-1s')

  if (interval === '-1s') return

  let [now, userList] = await handlePayouts(lastPayout, lastUserList)

  $.tick.setTimeout('points:poll', () => {
    run(now, userList)
  }, interval)
}

async function handlePayouts (lastPayout = Date.now(), lastUserList = []) {
  let payout = 0
  let now = Date.now()
  let { isLive } = $.stream
  let userList = $.user.list

  let [interval, amount] = await Promise.all([
    getPayoutInterval(!isLive),
    getPayoutAmount(!isLive)
  ])

  let nextPayout = lastPayout + interval

  if (amount > 0 && interval > 0) {
    if (nextPayout >= now) return [now, userList]
    payout = amount
  } else {
    return [now, userList]
  }

  await Promise.all(map(async user => {
    if (user === $.botName) return
    if (!$.is.oneOf(lastUserList, user)) return

    await $.db.create('points', { name: user })
    return $.db.incr('points.value', { name: user }, payout)
  }, userList))

  return [now, userList]
}

export default {
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
    if (!await $.db.getExtConfig('points.enabled', true)) return
    if (await canAffordCommand(e.sender, e.command, e.subcommand)) return

    let [price, points] = await Promise.all([
      get(e.sender),
      getCommandPrice(e.command, e.subcommand)
    ])

    $.whisper(
      e.sender,
      `You don't have enough points to use !${e.command}. ` +
      `» costs ${price}, you have ${points}`
    )

    e.prevent()
  },

  async afterCommand ($, e) {
    let charge = await getCommandPrice(e.command, e.subcommand)
    return sub(e.sender, charge)
  }
}
