/**
 * @typedef {import('@converge/types').PluginCommandHandler} PluginCommandHandler
 * @typedef {import('@converge/types').PluginSetup} PluginSetup
 */

/**
 * @type {PluginCommandHandler}
 */
export const points = async ($, e) => {
  const [action, target, amount] = e.args
  const parsedAmount = $.to.number(amount, true)

  if (!action) {
    return e.respond($.weave(
      'response.default', e.sender, await $.points.get(e.sender, true)
    ))
  }

  if (e.subcommand === 'add') {
    if (e.args.length < 3 || !$.is.number(parsedAmount)) {
      return e.respond($.weave('add.usage'))
    }

    await $.points.add(target, amount)
    return e.respond($.weave(
      'change.success', target, await $.points.get(target, true)
    ))
  }

  if (e.subcommand === 'remove') {
    if (e.args.length < 3 || !$.is.number(parsedAmount)) {
      return e.respond($.weave('remove.usage'))
    }

    await $.points.sub(target, amount)
    return e.respond($.weave(
      'change.success', target, await $.points.get(target, true)
    ))
  }

  if (e.subcommand === 'gift') {
    if (e.args.length < 3 || !$.is.number(parsedAmount)) {
      return e.respond($.weave('gift.usage'))
    }

    if ($.points.get(e.sender) < parsedAmount) {
      return e.respond($.weave(
        'gift.not-enough-points', await $.points.get(e.sender, true)
      ))
    }

    await $.points.sub(e.sender, amount)
    await $.points.add(target, amount)

    const str = $.points.str(amount)
    if ($.db.getConfig('whisperMode', false)) {
      $.whisper(e.sender, $.weave(
        'gift.success.sender', str, target, await $.points.get(e.sender, true)
      ))
      $.whisper(target, $.weave(
        'gift.success.recipient', e.sender, str, await $.points.get(target, true)
      ))
    } else {
      $.shout($.weave(
        'gift.success.shout', e.sender, str, target, await $.points.get(e.sender, true)
      ))
    }

    return
  }

  const user = await $.db.findOne('points', { name: action })
  if (user) {
    return e.respond($.weave(
      'response.default', action, await $.points.str(user.value)
    ))
  } else {
    return e.respond($.weave('response.not-found', action))
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
}
