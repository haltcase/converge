export async function points ($, e) {
  let [action, target, amount] = e.args
  let parsedAmount = $.to.number(amount, true)

  if (!action) {
    return e.respond($.weave(
      'response.default', e.sender, await $.points.get(e.sender, true)
    ))
  }

  if ($.is(e.subcommand, 'add')) {
    if (e.args.length < 3 || !$.is.number(parsedAmount)) {
      return e.respond($.weave('add.usage'))
    }

    await $.points.add(target, amount)
    return e.respond($.weave(
      'change.success', target, await $.points.get(target, true)
    ))
  }

  if ($.is(e.subcommand, 'remove')) {
    if (e.args.length < 3 || !$.is.number(parsedAmount)) {
      return e.respond($.weave('remove.usage'))
    }

    await $.points.sub(target, amount)
    return e.respond($.weave(
      'change.success', target, await $.points.get(target, true)
    ))
  }

  if ($.is(e.subcommand, 'gift')) {
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

    let str = $.points.str(amount)
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

  let user = await $.db.findOne('points', { name: action })
  if (user) {
    return e.respond($.weave(
      'response.default', action, await $.points.str(user.value)
    ))
  } else {
    return e.respond($.weave('response.not-found', action))
  }
}

export function setup ($) {
  $.addCommand('points')
  $.addSubcommand('add', 'points', { permission: 1 })
  $.addSubcommand('remove', 'points', { permission: 1 })
}
