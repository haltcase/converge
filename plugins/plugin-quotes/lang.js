export default $ => {
  $.weave.set('usage', 'Usage: !quote (add | remove | edit | help)')

  $.weave.set('add.usage', 'Usage: !quote add Something really wise. [~username]')
  $.weave.set('add.success', 'Quote added as #{0}')
  $.weave.set('add.failure', 'Failed to add quote.')

  $.weave.set('remove.usage', 'Usage: !quote remove (number >= 1)')
  $.weave.set('remove.success', 'Quote removed. {0} quotes remaining.')
  $.weave.set('remove.failure', 'Failed to remove quote #{0}.')

  $.weave.set('edit.usage', 'Usage: !quote edit (number >= 1) (message) [~username]')
  $.weave.set('edit.success', 'Quote #{0} modified.')
  $.weave.set('edit.failure', 'Failed to edit quote #{0}.')

  $.weave.set('response', `"{0}" - {1} ({2}{3})`)
  $.weave.set('response.not-found', 'Quote #{0} does not exist.')

  $.weave.set('help',
    `To save a quote, use '!quote add Something really wise.' ` +
    `To credit who said it, add '~username' with no space.`
  )
}
