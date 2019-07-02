/**
 * five - mostly highs, but sometimes low-fives
 *
 * @command five
 * @usage !five [target]
 *
 * @source stock module
 * @author citycide
 */

export const five = async ($, e) => {
  if (e.subcommand === 'add') {
    if (!e.subArgs[0]) {
      e.respond($.weave('add.usage'))
      return
    }

    const res = await $.db.create('five', { value: e.subArgString })

    if (res.id) {
      e.respond($.weave('add.success', res.id))
    } else {
      e.respond($.weave('add.failure'))
    }

    return
  }

  if (e.subcommand === 'remove') {
    if (!e.subArgs[0]) {
      e.respond($.weave('remove.usage'))
      return
    }

    if (!await $.db.exists('five', { id: e.subArgs[0] })) {
      e.respond($.weave('not-found', e.subArgs[0]))
      return
    }

    let id = parseInt(e.subArgs[0])
    if (await $.db.remove('five', { id })) {
      let count = $.db.count('five')
      e.respond($.weave('remove.success', count))
    } else {
      e.respond($.weave('remove.failure', id))
    }

    return
  }

  if (e.subcommand === 'edit') {
    if (!e.subArgs.length < 2) {
      e.respond($.weave('edit.usage'))
      return
    }

    if (!await $.db.exists('five', { id: e.subArgs[0] })) {
      e.respond($.weave('not-found', e.subArgs[0]))
      return
    }

    let id = parseInt(e.subArgs[0])
    let value = e.subArgs.slice(1).join(' ')

    if (await $.db.set('five.value', { id }, value)) {
      e.respond($.weave('edit.success', id))
    } else {
      e.respond($.weave('edit.failure', id))
    }

    return
  }

  if (e.args.length > 1) {
    e.respond($.weave('response.default', e.sender))
    return
  }

  const [target] = e.args

  if (!target) {
    if ($.user.list.length) {
      const random = $.to.random($.user.list)
      e.respond($.weave('response.random', e.sender, random))
      return
    } else {
      e.respond($.weave('response.random-fallback'))
      return
    }
  }

  if (!$.is.oneOf(target, $.user.list)) {
    e.respond($.weave('target-not-present', e.sender, target))
    return
  }

  const response = await $.db.getRandomRow('five')
  if (response) {
    e.respond(await $.params(e, response.value, { target }))
  } else {
    e.respond($.weave('response.fallback'))
  }
}

const initResponses = async $ => {
  $.log('five', 'No five responses found, adding some defaults...')

  const defaults = [
    `{sender} touched {target}'s hand, aaalll high-like.`,
    `Little did {target} know, {game} is {sender}'s high-fiving trigger.`,
    `{sender} would 100% give all their {pointname} to touch {target}'s five.`,
    `{target} dodged {sender}'s attempt to give them five.`,
    `{target} gave {sender} a low-five. Didn't see that one coming, did you?`,
    `{sender} and {target} went fiving up high AND down low.`,
    `{sender} to {target} be like "Gimme five!" ... crickets.`
  ]

  await Promise.all(defaults.map(value => $.db.create('five', { value })))
  $.log('five', `Done. ${defaults.length} default five responses added.`)
}

export const setup = async $ => {
  $.addCommand('five')

  $.addSubcommand('add', 'five', { permission: 1 })
  $.addSubcommand('remove', 'five', { permission: 1 })
  $.addSubcommand('edit', 'five', { permission: 1 })

  await $.db.addTable('five', true)

  if (!await $.db.count('five')) initResponses($)
}
