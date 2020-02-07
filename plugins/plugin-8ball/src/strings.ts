import { PluginStrings } from '@converge/types'

export const strings: PluginStrings = $ => {
  $.weave.set('usage', 'You need to ask 8ball a question.')
  $.weave.set('burgundy', 'Damnit, who typed a question mark on the teleprompter?')
  $.weave.set('no-response', `I'm not going to dignify that with a response.`)
  $.weave.set('not-found', 'There is no !8ball response with ID #{0}.')

  $.weave.set('add.usage', 'Usage: !8ball add (message)')
  $.weave.set('add.success', '8ball response added as #{0}.')
  $.weave.set('add.failure', 'Failed to add 8ball response.')

  $.weave.set('remove.usage', 'Usage: !8ball remove (number >= 1)')
  $.weave.set('remove.success', '8ball response removed. {0} responses remaining.')
  $.weave.set('remove.failure', 'Failed to remove 8ball response #{0}.')

  $.weave.set('edit.usage', 'Usage: !8ball edit (number >= 1) (message)')
  $.weave.set('edit.success', '8ball response #{0} modified.')
  $.weave.set('edit.failure', 'Failed to edit 8ball response #{0}.')
}
