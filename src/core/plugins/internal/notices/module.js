export const notice = async ($, e) => {
  const [name, message] = e.subArgs || []

  if (e.subcommand === 'add') {
    if (!name || !message) {
      e.respond($.weave('add.usage'))
      return
    }

    const result = await $.notices.add(name, message)
    e.respond($.weave(result ? 'add.success' : 'add.failure', name))
    return
  }

  if (e.subcommand === 'get') {
    if (!name) {
      e.respond($.weave('get.usage'))
      return
    }

    const result = await $.notices.get(name)
    if (result) {
      e.respond($.weave('get.response', name, result))
    } else {
      e.respond($.weave('get.not-found', name))
    }
    return
  }

  if (e.subcommand === 'edit') {
    if (!name || !message) {
      e.respond($.weave('edit.usage'))
      return
    }

    const result = await $.notices.edit(name, message)
    e.respond($.weave(result ? 'edit.success' : 'edit.failure', name))
    return
  }

  if (e.subcommand === 'remove') {
    if (!name) {
      e.respond($.weave('remove.usage'))
      return
    }

    const result = await $.notices.remove(name)
    e.respond($.weave(result ? 'remove.success' : 'remove.failure', name))
    return
  }

  if (e.subcommand === 'list') {
    const notices = await $.db.find('notices')
    if (notices.length) {
      const list = notices.map(v => v.key).join(', ')
      e.respond($.weave('list.response', list))
    } else {
      e.respond($.weave('list.not-found'))
    }
  }

  e.respond($.weave('usage'))
}

export const setup = $ => {
  $.addCommand('notice', { permission: 1 })
  $.addSubcommand('add', 'notice')
  $.addSubcommand('get', 'notice')
  $.addSubcommand('edit', 'notice')
  $.addSubcommand('remove', 'notice')
  $.addSubcommand('list', 'notice')
}
