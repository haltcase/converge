/**
 * @param {import('@converge/types').Core} $
 */
export const strings = $ => {
  $.weave.set('command.usage', 'Usage: !command (add | remove | edit | enable | disable | permission)')
  $.weave.set('command.enable-usage', 'Usage: !command enable (command name)')
  $.weave.set('command.disable-usage', 'Usage: !command disable (command name)')
  $.weave.set('command.permission-usage', 'Usage: !command permission (command name) (level)')
  $.weave.set('command.add-usage', 'Usage: !command add (command name) (response)')
  $.weave.set('command.remove-usage', 'Usage: !command remove (command name)')
  $.weave.set('command.edit-usage', 'Usage: !command edit (command name) (response)')

  $.weave.set('whisper-mode.usage', 'Usage: !whispermode (enable | disable) » currently {0}')
  $.weave.set('last-seen.usage', 'Usage: !lastseen (user)')
  $.weave.set('last-seen.response', '{0} was last seen {1} ago.')
  $.weave.set('last-seen.not-seen', 'We haven\'t seen {0} in chat yet.')
}
