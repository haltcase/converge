export default function ($) {
  $.weave.set('usage', 'Usage: !cooldown (get | set)')

  $.weave.set('get.usage', 'Usage: !cooldown get (command) [subcommand]')
  $.weave.set('get.no-cooldown', `'!{0}{1}' has no cooldown.`)
  $.weave.set('get.response', `Cooldown for '!{0}{1}' is set to {2} seconds.`)

  $.weave.set('set.usage', 'Usage: !cooldown set (command) [subcommand] (# seconds)')
  $.weave.set('set.success', `Cooldown for '!{0}' set to {1} seconds.`)
  $.weave.set('set.success-sub', `Cooldown for '!{0} {1}' set to {2} seconds.`)

  $.weave.set('admin.usage', 'Usage: !cooldown admin (enabled | disabled)')
  $.weave.set('admin.response', `Cooldowns will now be {0} for administrators.`)
}
