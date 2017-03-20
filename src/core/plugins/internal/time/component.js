import map from 'stunsail/map'

let $ = null

async function getPayoutInterval (offline) {
  let interval = offline
    ? await $.db.getConfig('timeIntervalOffline', '-1s')
    : await $.db.getConfig('timeInterval', '5s')

  return interval === '-1s' ? 0 : $.tick.ms(interval)
}

async function setPayoutInterval (seconds, offline) {
  if (!$.is.number(seconds)) {
    seconds = $.tick.ms(seconds) / 1000 || -1
  }

  return offline
    ? $.db.setConfig('timeIntervalOffline', seconds)
    : $.db.setConfig('timeInterval', seconds)
}

async function run (lastPayout, lastUserList) {
  if (!await $.db.getConfig('timeEnabled', true)) return

  let interval = $.stream.isLive
    ? await $.db.getConfig('timeInterval', '60s')
    : await $.db.getConfig('timeIntervalOffline', '-1s')

  if (interval === '-1s') return

  let [now, userList] = await handlePayouts(lastPayout, lastUserList)

  $.tick.setTimeout('time:polling', () => {
    run(now, userList)
  }, interval)
}

async function handlePayouts (lastPayout = Date.now(), lastUserList = []) {
  let now = Date.now()
  let { isLive } = $.stream
  let userList = $.user.list

  let interval = await getPayoutInterval(!isLive)
  if (interval <= 0) return [lastPayout, userList]

  let nextPayout = lastPayout + interval
  let payout = ((nextPayout - lastPayout) / 1000 % 60) | 0

  await Promise.all(map(async user => {
    if (user === $.botName) return
    if (!$.is.oneOf(lastUserList, user)) return

    await $.db.create('time', { name: user })
    return $.db.incr('time.value', { name: user }, payout)
  }, userList))

  return [now, userList]
}

export default {
  async setup (context) {
    $ = context

    await context.db.model('time', {
      name: { type: String, primary: true },
      value: { type: Number, defaultTo: 0 }
    })

    return run()
  }
}
