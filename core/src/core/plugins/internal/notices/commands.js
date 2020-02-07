/**
 * @typedef {import('@converge/types').PluginCommandHandler} PluginCommandHandler
 * @typedef {import('@converge/types').PluginSetup} PluginSetup
 */

/**
 * @type {PluginCommandHandler}
 */
export const notice = async ($, e) => {
  const [name, ...message] = e.subArgs || []

  if (e.subcommand === 'add') {
    if (!name || !message.length) {
      e.respond(await $.weave('add.usage'))
      return
    }

    const result = await $.notices.add(name, message.join(' '))
    e.respond(await $.weave(result ? 'add.success' : 'add.failure', name))

    return
  }

  if (e.subcommand === 'get') {
    if (!name) {
      e.respond(await $.weave('get.usage'))
      return
    }

    const result = await $.notices.get(name)
    if (result) {
      e.respond(await $.weave('get.response', name, result))
    } else {
      e.respond(await $.weave('get.not-found', name))
    }

    return
  }

  if (e.subcommand === 'edit') {
    if (!name || !message.length) {
      e.respond(await $.weave('edit.usage'))
      return
    }

    const result = await $.notices.edit(name, message.join(' '))
    e.respond(await $.weave(result ? 'edit.success' : 'edit.failure', name))

    return
  }

  if (e.subcommand === 'remove') {
    if (!name) {
      e.respond(await $.weave('remove.usage'))
      return
    }

    const result = await $.notices.remove(name, true)
    e.respond(await $.weave(result ? 'remove.success' : 'remove.failure', name))

    return
  }

  if (e.subcommand === 'list') {
    const notices = await $.db.find('notices')
    if (notices.length) {
      const list = notices.map(v => v.key).join(', ')
      e.respond(await $.weave('list.response', list))
    } else {
      e.respond(await $.weave('list.not-found'))
    }

    return
  }

  e.respond(await $.weave('usage'))
}

/**
 * @type {PluginSetup}
 */
export const setup = $ => {
  $.addCommand('notice', { permission: 1 })
  $.addSubcommand('add', 'notice')
  $.addSubcommand('get', 'notice')
  $.addSubcommand('edit', 'notice')
  $.addSubcommand('remove', 'notice')
  $.addSubcommand('list', 'notice')
}
