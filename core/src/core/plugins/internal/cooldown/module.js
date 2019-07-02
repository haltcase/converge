export const cooldown = async ($, e) => {
  switch (e.subcommand) {
    case 'get': return get($, e)
    case 'set': return set($, e)
    case 'admin': return admin($, e)
    default: return e.respond($.weave('usage'))
  }
}

const get = async ($, e) => {
  const [cmd, sub] = e.subArgs
  const subStr = sub ? ` ${sub}` : ''

  if (!cmd) {
    return e.respond($.weave('get.usage'))
  }

  const cool = await $.command.getCooldown(cmd, sub)

  if (!$.is.number(cool)) {
    return e.respond($.weave('get.no-cooldown', cmd, subStr))
  }

  return e.respond($.weave('get.response', cmd, sub, cool))
}

const set = async ($, e) => {
  const [cmd, sub, val] = e.subArgs

  if (!cmd) {
    return e.respond($.weave('set.usage'))
  }

  switch (e.subArgs.length) {
    case 2:
      // provided a command and cooldown value only
      const num = parseInt(sub)

      if ($.is.number(num)) {
        return e.respond($.weave('set.usage'))
      }

      if (!await $.command.exists(cmd)) {
        return e.respond($.weave.core('commands.does-not-exist'))
      }

      await $.command.setCooldown(cmd, num)
      return e.respond($.weave('set.success', cmd, num))
    case 3:
      // provided a command, subcommand, and cooldown value
      const subNum = parseInt(val)

      if (!$.is.number(subNum)) {
        return e.respond($.weave('set.usage'))
      }

      if (!await $.command.exists(cmd, sub)) {
        return e.respond($.weave.core('commands.does-not-exist'))
      }

      await $.command.setCooldown(cmd, subNum, sub)
      return e.respond($.weave('set.success-sub', cmd, sub, subNum))
    default:
      return e.respond($.weave('set.usage'))
  }
}

const admin = async ($, e) => {
  const [status] = e.subArgs

  if (!$.is.oneOf(status, ['enabled', 'disabled'])) {
    return e.respond($.weave('admin.usage'))
  }

  const bool = $.is(status, 'enabled')
  await $.db.setExtConfig('cooldown.includeAdmins', bool)
  e.respond($.weave('admin.response', bool ? 'enabled' : 'disabled'))
}

export const setup = $ => {
  $.addCommand('cooldown', { permission: 1 })
  $.addSubcommand('get', 'cooldown')
  $.addSubcommand('set', 'cooldown')
  $.addSubcommand('admin', 'cooldown')
}
