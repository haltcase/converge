/**
 * couch - awards users with random amounts of currency
 *
 * @command couch
 * @usage !couch
 *
 * @source stock module
 * @author citycide
 */

export const couch = async ($, e) => {
  const multi = await $.db.getExtConfig('couch.multiplier', 1)
  const num = $.to.random(1000)
  let payout = 0

  const isInRange = (low, high) => $.is.inRange(num, low, high)

  if (!e.args.length) {
    if (num <= 500) {
      payout = $.to.random(3) * multi
    }

    if (isInRange(501, 750)) {
      payout = $.to.random(6) * multi
    }

    if (isInRange(751, 920)) {
      payout = $.to.random(3, 9) * multi
    }

    if (isInRange(921, 990)) {
      payout = $.to.random(6, 18) * multi
    }

    if (isInRange(991, 1000)) {
      payout = $.to.random(22, 100) * multi
    }

    if (payout === 0) {
      e.respond($.weave('did-not-find', await $.points.getName()))
    } else {
      await $.points.add(e.sender, payout)
      e.respond($.weave('found-points', await $.points.str(payout)))
    }

    return
  }

  if (e.subcommand === 'multi') {
    if (!e.subArgs[0] || !$.is.numeric(e.subArgs[0])) {
      e.respond($.weave('multi.usage', multi))
      return
    }

    const newMulti = $.to.number(e.subArgs[0])

    await $.db.setExtConfig('couch.multiplier', newMulti)
    e.respond($.weave('multi.success', newMulti))
  }
}

export const setup = async $ => {
  $.addCommand('couch', { cooldown: 300 })
  $.addSubcommand('multi', 'couch', { permission: 1 })
}
