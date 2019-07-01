/**
 * 8ball - answers yes/no questions in vague, unhelpful ways
 *
 * @command 8ball
 * @usage !8ball (question)
 *
 * @source stock module
 * @author citycide
 */

export const magicBall = async ($, e) => {
  if (!e.args.length) {
    e.respond($.weave('usage'))
    return
  }

  if (e.argString.toLowerCase() === `i'm ron burgundy?`) {
    e.respond($.weave('burgundy'))
    return
  }

  if (e.subcommand === 'add') {
    if (!e.subArgs[0]) {
      e.respond($.weave('add.usage'))
      return
    }

    const res = await $.db.create('ball', { value: e.subArgString })

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

    if (!await $.db.exists('ball', { id: e.subArgs[0] })) {
      e.respond($.weave('not-found', e.subArgs[0]))
      return
    }

    let id = parseInt(e.subArgs[0])
    if (await $.db.remove('ball', { id })) {
      let count = $.db.count('ball')
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

    if (!await $.db.exists('ball', { id: e.subArgs[0] })) {
      e.respond($.weave('not-found', e.subArgs[0]))
      return
    }

    let id = parseInt(e.subArgs[0])
    let value = e.subArgs.slice(1).join(' ')

    if (await $.db.set('ball.value', { id }, value)) {
      e.respond($.weave('edit.success', id))
    } else {
      e.respond($.weave('edit.failure', id))
    }

    return
  }

  const response = await $.db.getRandomRow('ball')

  if (response) {
    e.respond(await $.params(e, response.value))
  } else {
    e.respond($.weave('no-response'))
  }
}

const initResponses = async $ => {
  $.log('8ball', 'No 8ball responses found, adding some defaults...')

  const defaults = [
    `It is certain.`,
    `Without a doubt.`,
    `I never say something's definitely happening, but this is *definitely* happening.`,
    `The odds of that happening are... slim.`,
    `The end of the world as we know it will occur before that happens.`,
    `No. Just... no.`,
    `I'd marry {random} before that happens.`
  ]

  await Promise.all(defaults.map(value => $.db.create('ball', { value })))
  $.log('8ball', `Done. ${defaults.length} default 8ball responses added.`)
}

export const setup = async $ => {
  $.addCommand('8ball', {
    handler: 'magicBall',
    cooldown: 60
  })

  $.addSubcommand('add', '8ball', { permission: 1 })
  $.addSubcommand('remove', '8ball', { permission: 1 })
  $.addSubcommand('edit', '8ball', { permission: 1 })

  await $.db.addTable('ball', true)

  if (!await $.db.count('ball')) initResponses($)
}
