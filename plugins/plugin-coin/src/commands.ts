import {
  PluginSetup,
  PluginCommandHandler
} from '@converge/types'

/**
 * @command coin
 * @usage !coin (amount)
 */
export const coin: PluginCommandHandler = async ($, e) => {
  const [risk, reward, maxBet] = await Promise.all([
    $.db.getPluginConfig('coin.risk', 1),
    $.db.getPluginConfig('coin.reward', 1),
    $.db.getPluginConfig('coin.maxBet', 50)
  ])

  if ($.is.numeric(e.args[0])) {
    const betAmount = $.to.number(e.args[0])
    const userPoints = await $.points.get(e.sender)

    if (betAmount > maxBet) {
      e.respond(await $.weave('error.bet-over-max', await $.points.str(maxBet)))
      return
    }

    if (betAmount > userPoints * risk) {
      e.respond(await $.weave(
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
      e.respond(await $.weave('flip.win', str))
    } else {
      await $.points.sub(e.sender, outcome)
      e.respond(await $.weave('flip.loss', str))
    }

    return
  }

  if (e.subcommand === 'risk') {
    if (!e.subArgs[0] || !$.is.numeric(e.subArgs[0])) {
      e.respond(await $.weave('risk.usage', risk))
      return
    }

    const newRisk = $.to.number(e.subArgs[0])
    await $.db.setPluginConfig('coin.risk', newRisk)

    e.respond(await $.weave('risk.success', await $.points.str(newRisk)))

    return
  }

  if (e.subcommand === 'reward') {
    if (!e.subArgs[0] || !$.is.numeric(e.subArgs[0])) {
      e.respond(await $.weave('reward.usage', reward))
      return
    }

    const newReward = $.to.number(e.subArgs[0])
    await $.db.setPluginConfig('coin.reward', newReward)

    e.respond(await $.weave('reward.success', await $.points.str(newReward)))

    return
  }

  if (e.subcommand === 'max') {
    if (!e.subArgs[0] || !$.is.numeric(e.subArgs[0])) {
      e.respond(await $.weave('max.usage', maxBet))
      return
    }

    const newMax = $.to.number(e.subArgs[0])
    await $.db.setPluginConfig('coin.maxBet', newMax)

    e.respond(await $.weave('max.success', await $.points.str(newMax)))
    return
  }

  e.respond(await $.weave('usage'))
}

export const setup: PluginSetup = $ => {
  $.addCommand('coin', { cooldown: 60 })
  $.addSubcommand('risk', 'coin', { permission: 1 })
  $.addSubcommand('reward', 'coin', { permission: 1 })
  $.addSubcommand('max', 'coin', { permission: 1 })
}
