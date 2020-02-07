/**
 * @typedef {import('@converge/types').Core} Core
 * @typedef {import('@converge/types').PluginCommandHandler} PluginCommandHandler
 * @typedef {import('@converge/types').PluginSetup} PluginSetup
 */

/**
 * @param {Core} $
 * @param {string} key
 * @returns {() => Promise<number>}
 */
const createGetter = ($, key) => ({
  interval: async () => $.to.duration(await $.points.getPayoutInterval() * 1_000),
  payout: async () => $.points.getPayoutAmount(),
  offlineinterval: async () => $.to.duration(await $.points.getPayoutInterval(true) * 1_000),
  offlinepayout: async () => $.points.getPayoutAmount(true)
}[key])

/**
 * @param {Core} $
 * @param {string} key
 * @returns {(value: any) => Promise<number>}
 */
const createSetter = ($, key) => ({
  interval: async value => $.points.setPayoutInterval(value),
  payout: async value => $.points.setPayoutAmount(value),
  offlineinterval: async value => $.points.setPayoutInterval(value, true),
  offlinepayout: async value => $.points.setPayoutAmount(value, true)
}[key])

/**
 * @type {PluginCommandHandler}
 */
export const points = async ($, e) => {
  const [action, target, amount] = e.args
  const parsedAmount = $.to.number(amount, true)

  if (!action) {
    return e.respond(await $.weave(
      'response.default', e.sender, await $.points.get(e.sender, true)
    ))
  }

  if (e.subcommand === 'price') {
    const [spec, newPrice] = e.subArgs
    if ($.is.empty(spec)) {
      return e.respond(await $.weave('price.usage'))
    }

    const [command, subcommand] = spec.split('.')
    const getPrice = async () =>
      $.points.str(await $.command.getPrice(command, subcommand))

    if ($.is.empty(newPrice)) {
      return e.respond(await $.weave('price.response', spec, await getPrice()))
    }

    await $.command.setPrice(command, subcommand, newPrice)
    return e.respond(await $.weave('price.success', spec, await getPrice()))
  }

  if (e.subcommand === 'add') {
    if (e.args.length < 3 || !$.is.number(parsedAmount)) {
      return e.respond(await $.weave('add.usage'))
    }

    await $.points.add(target, amount)
    return e.respond(await $.weave(
      'change.success', target, await $.points.get(target, true)
    ))
  }

  if (e.subcommand === 'remove') {
    if (e.args.length < 3 || !$.is.number(parsedAmount)) {
      return e.respond(await $.weave('remove.usage'))
    }

    await $.points.sub(target, amount)
    return e.respond(await $.weave(
      'change.success', target, await $.points.get(target, true)
    ))
  }

  if (e.subcommand === 'gift') {
    if (e.args.length < 3 || !$.is.number(parsedAmount)) {
      return e.respond(await $.weave('gift.usage'))
    }

    if ($.points.get(e.sender) < parsedAmount) {
      return e.respond(await $.weave(
        'gift.not-enough-points', await $.points.get(e.sender, true)
      ))
    }

    await $.points.sub(e.sender, amount)
    await $.points.add(target, amount)

    const str = $.points.str(amount)
    if ($.db.getConfig('whisperMode', false)) {
      $.whisper(e.sender, await $.weave(
        'gift.success.sender', str, target, await $.points.get(e.sender, true)
      ))
      $.whisper(target, await $.weave(
        'gift.success.recipient', e.sender, str, await $.points.get(target, true)
      ))
    } else {
      $.shout(await $.weave(
        'gift.success.shout', e.sender, str, target, await $.points.get(e.sender, true)
      ))
    }

    return
  }

  if (e.subcommand === 'setname') {
    const getNames = () => Promise.all([
      $.points.getName(true),
      $.points.getName()
    ])

    if ($.is.empty(target)) {
      const [singular, plural] = await getNames()
      return e.respond(await $.weave('setname.usage', singular, plural))
    }

    const plural = $.is.empty(amount) ? target + 's' : amount
    await Promise.all([
      $.points.setName(target, true),
      $.points.setName(plural)
    ])

    const [updatedSingular, updatedPlural] = await getNames()
    return e.respond(await $.weave('setname.success', updatedSingular, updatedPlural))
  }

  if ($.is.oneOf(e.subcommand, ['interval', 'offlineinterval', 'payout', 'offlinepayout'])) {
    const getValue = createGetter($, e.subcommand)

    if (!target) {
      return e.respond(await $.weave(`${e.subcommand}.usage`, await getValue()))
    }

    if (target.trim().length < 1) {
      return e.respond(await $.weave(`${e.subcommand}.success`, await getValue()))
    }

    const setValue = createSetter($, e.subcommand)

    if (e.subcommand.includes('payout')) {
      if (!$.is.numeric(target)) {
        return e.respond(await $.weave(`${e.subcommand}.usage`, await getValue()))
      } else {
        await setValue($.to.number(target))
        return e.respond(await $.weave(`${e.subcommand}.success`, await getValue()))
      }
    }

    if ($.is.numeric(target)) {
      // minutes
      await setValue($.tick.ms($.to.int(target) * 60_000))
    } else {
      // time string, e.g. 1h 5m 30s
      await setValue(e.subArgString)
    }

    return e.respond(await $.weave(`${e.subcommand}.success`, await getValue()))
  }

  const user = await $.db.findOne('points', { name: action })
  if (user) {
    return e.respond(await $.weave(
      'response.default', action, await $.points.str(user.value)
    ))
  } else {
    return e.respond(await $.weave('response.not-found', action))
  }
}

/**
 * @type {PluginSetup}
 */
export const setup = $ => {
  $.addCommand('points')
  $.addSubcommand('add', 'points', { permission: 1 })
  $.addSubcommand('remove', 'points', { permission: 1 })
  $.addSubcommand('gift', 'points')
  $.addSubcommand('setname', 'points', { permission: 1 })
  $.addSubcommand('interval', 'points', { permission: 1 })
  $.addSubcommand('payout', 'points', { permission: 1 })
  $.addSubcommand('offlineinterval', 'points', { permission: 1 })
  $.addSubcommand('offlinepayout', 'points', { permission: 1 })

  $.addSubcommand('price', 'points')
  $.addSubcommand('setprice', 'points', { permission: 1 })
}
