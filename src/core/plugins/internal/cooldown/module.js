export async function cooldown ($, e) {
  switch (e.subcommand) {
    case 'get': return get($, e)
    case 'set': return set($, e)
    case 'admin': return admin($, e)
    default: return e.respond($.weave('usage'))
  }
}

async function get ($, e) {
  let [cmd, sub] = e.subArgs
  let subStr = sub ? ` ${sub}` : ''

  if (!cmd) {
    return e.respond($.weave('get.usage'))
  }

  let cool = await $.command.getCooldown(cmd, sub)

  if (!$.is.number(cool)) {
    return e.respond(`'!${cmd}${subStr}' has no cooldown.`)
  }

  return e.respond($.weave('get.response', cmd, sub, cool))
}

async function set ($, e) {
  let [cmd, sub, val] = e.subArgs

  if (!cmd) {
    return e.respond($.weave('set.usage'))
  }

  switch (e.subArgs.length) {
    case 2:
      // provided a command and cooldown value only
      let num = parseInt(sub)

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
      let subNum = parseInt(val)

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

async function admin ($, e) {
  let [status] = e.subArgs

  if (!$.is.oneOf(['enabled', 'disabled'], status)) {
    return e.respond($.weave('admin.usage'))
  }

  let bool = $.is(status, 'enabled')
  await $.db.setExtConfig('cooldown.includeAdmins', bool)
  e.respond($.weave('admin.response', bool ? 'enabled' : 'disabled'))
}

export function setup ($) {
  $.addCommand('cooldown', { permission: 1 })
  $.addSubcommand('get', 'cooldown')
  $.addSubcommand('set', 'cooldown')
  $.addSubcommand('admin', 'cooldown')
}
