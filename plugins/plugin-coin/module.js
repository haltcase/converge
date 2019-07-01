/**
 * coin - users can place bets on the outcome of a coin flip
 *
 * @command coin
 * @usage !coin (amount)
 *
 * @source stock module
 * @author citycide
 */

export const coin = async ($, e) => {
  const [risk, reward, maxBet] = await Promise.all([
    $.db.getExtConfig('coin.risk', 1),
    $.db.getExtConfig('coin.reward', 1),
    $.db.getExtConfig('coin.maxBet', 50)
  ])

  if ($.is.numeric(e.args[0])) {
    const betAmount = $.to.number(e.args[0])
    const userPoints = await $.points.get(e.sender)

    if (betAmount > maxBet) {
      e.respond($.weave('error.bet-over-max', await $.points.str(maxBet)))
      return
    }

    if (betAmount > userPoints * risk) {
      e.respond($.weave(
        'error.not-enough-points',
        await $.points.getName(),
        await $.points.get(e.sender, true), risk)
      )
      return
    }

    const result = $.to.random(1000) < 500
    const outcome = result ? betAmount * reward : betAmount * risk
    const str = await $.points.str(outcome)

    if (result) {
      await $.points.add(e.sender, outcome)
      e.respond($.weave('flip.win', str))
    } else {
      await $.points.sub(e.sender, outcome)
      e.respond($.weave('flip.loss', str))
    }

    return
  }

  if (e.subcommand === 'risk') {
    if (!e.subArgs[0] || !$.is.numeric(e.subArgs[0])) {
      e.respond($.weave('risk.usage', risk))
      return
    }

    const newRisk = $.to.number(e.subArgs[0])
    await $.db.setExtConfig('coin.risk', newRisk)

    e.respond($.weave('risk.success', await $.points.str(newRisk)))

    return
  }

  if (e.subcommand === 'reward') {
    if (!e.subArgs[0] || !$.is.numeric(e.subArgs[0])) {
      e.respond($.weave('reward.usage', reward))
      return
    }

    const newReward = $.to.number(e.subArgs[0])
    await $.db.setExtConfig('coin.reward', newReward)

    e.respond($.weave('reward.success', await $.points.str(newReward)))

    return
  }

  if (e.subcommand === 'max') {
    if (!e.subArgs[0] || !$.is.numeric(e.subArgs[0])) {
      e.respond($.weave('max.usage', maxBet))
      return
    }

    const newMax = $.to.number(e.subArgs[0])
    await $.db.setExtConfig('coin.maxBet', newMax)

    e.respond($.weave('max.success', await $.points.str(newMax)))
    return
  }

  e.respond($.weave('usage'))
}

export const setup = $ => {
  $.addCommand('coin', { cooldown: 60 })
  $.addSubcommand('risk', 'coin', { permission: 1 })
  $.addSubcommand('reward', 'coin', { permission: 1 })
  $.addSubcommand('max', 'coin', { permission: 1 })
}
