import { distanceInWordsToNow } from 'date-fns'

export const command = async ($, e) => {
  const [, param1, param2] = e.args

  if (e.subcommand === 'enable') {
    if (e.args.length < 2) {
      return e.respond($.weave('command.enable-usage'))
    }

    if (param1.includes('>')) {
      const pair = param1.split('>')

      if (await $.command.exists(pair[0], pair[1])) {
        await $.command.enable(pair[0], pair[1])
        e.respond($.weave.core('commands.enable-success', param1))
      } else {
        e.respond($.weave.core('commands.does-not-exist'))
      }
    } else {
      if (await $.command.exists(param1)) {
        await $.command.enable(param1)
        e.respond($.weave.core('commands.enable-success', param1))
      } else {
        e.respond($.weave.core('commands.does-not-exist'))
      }
    }

    return
  }

  if (e.subcommand === 'disable') {
    if (e.args.length < 2) {
      return e.respond($.weave('command.disable-usage'))
    }

    if (param1.includes('>')) {
      const pair = param1.split('>')

      if (await $.command.exists(pair[0], pair[1])) {
        await $.command.disable(pair[0], pair[1])
        e.respond($.weave.core('commands.disable-success', param1))
      } else {
        e.respond($.weave.core('commands.does-not-exist'))
      }
    } else {
      if (await $.command.exists(param1)) {
        await $.command.disable(param1)
        e.respond($.weave.core('commands.disable-success', param1))
      } else {
        e.respond($.weave.core('commands.does-not-exist'))
      }
    }

    return
  }

  if (e.subcommand === 'permission') {
    if (e.args.length < 2) {
      return e.respond($.weave('command.permission-usage'))
    }

    if (await $.command.exists(param1)) {
      await $.command.setPermLevel(param1, param2)
      e.respond($.weave.core('commands.permission-success', param1, param2))
    } else {
      e.respond($.weave.core('commands.does-not-exist'))
    }

    return
  }

  if (e.subcommand === 'add') {
    if (e.subArgs.length < 2) {
      return e.respond($.weave('command.add-usage'))
    }

    if (await $.command.exists(param1)) {
      return e.respond($.weave.core('commands.already-exists'))
    }

    const response = e.subArgs.slice(1).join(' ')

    await $.command.addCustom(param1, response)
    e.respond($.weave.core('commands.add-success', param1))

    return
  }

  if (e.subcommand === 'remove') {
    if (!e.subArgs[0]) {
      return e.respond($.weave('command.remove-usage'))
    }

    if (!await $.command.exists(param1)) {
      return e.respond($.weave.core('commands.does-not-exist'))
    }

    if (!await $.command.isCustom(param1)) {
      return e.respond($.weave.core('commands.is-plugin-command'))
    }

    await $.command.removeCustom(param1)
    e.respond($.weave.core('commands.remove-success', param1))

    return
  }

  if (e.subcommand === 'edit') {
    if (e.subArgs.length < 2) {
      return e.respond($.weave('command.edit-usage'))
    }

    if (!await $.command.exists(param1)) {
      return e.respond($.weave.core('commands.does-not-exist'))
    }

    if (!await $.command.isCustom(param1)) {
      return e.respond($.weave.core('commands.is-plugin-command'))
    }

    const newResponse = e.subArgs.slice(1).join(' ')

    await $.db.set(
      'commands',
      { name: param1, module: 'custom' },
      { response: newResponse }
    )
    e.respond($.weave.core('commands.edit-success', param1))

    return
  }

  e.respond($.weave('command.usage'))
}

export const whisperMode = async ($, e) => {
  if (e.subcommand === 'enable') {
    await $.settings.set('whisperMode', true)
    return e.respond($.weave.core('settings.whisper-mode.enabled-success'))
  }

  if (e.subcommand === 'disable') {
    await $.settings.set('whisperMode', false)
    return e.respond($.weave.core('settings.whisper-mode.disabled-success'))
  }

  const status = await $.settings.get('whisperMode')
    ? $.weave.core('common-words.enabled')
    : $.weave.core('common-words.disabled')

  e.respond($.weave('whisper-mode.usage'), status)
}

export const lastSeen = async ($, e) => {
  const [target] = e.args
  if (!target) return e.respond($.weave('last-seen.usage'))

  if (await $.user.exists(target)) {
    const timeAgo = await $.db.get('users.seen', { name: target }) |>
      distanceInWordsToNow

    e.respond($.weave('last-seen.response', target, timeAgo))
  } else {
    e.respond($.weave('last-seen.not-seen', target))
  }
}

export const setup = async $ => {
  $.addCommand('command', {
    cooldown: 0,
    permission: 1
  })

  $.addSubcommand('enable', 'command')
  $.addSubcommand('disable', 'command')
  $.addSubcommand('permission', 'command')
  $.addSubcommand('add', 'command')
  $.addSubcommand('remove', 'command')
  $.addSubcommand('edit', 'command')

  $.addCommand('whisperMode', {
    cooldown: 0,
    permission: 0
  })

  $.addSubcommand('enable', 'whispermode')
  $.addSubcommand('disable', 'whispermode')

  $.addCommand('lastSeen')
}
