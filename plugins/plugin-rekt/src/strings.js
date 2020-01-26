/**
 * @param {import('@converge/types').Core} $
 */
export const strings = $ => {
  $.weave.set('usage', 'Usage: !rekt (add | remove | edit)')
  $.weave.set('not-found', 'There is no !rekt response with ID #{0}.')

  $.weave.set('add.usage', 'Usage: !rekt add (message)')
  $.weave.set('add.success', 'rekt response added as #{0}.')
  $.weave.set('add.failure', 'Failed to add rekt response.')

  $.weave.set('remove.usage', 'Usage: !rekt remove (number >= 1)')
  $.weave.set('remove.success', 'rekt response removed. {0} responses remaining.')
  $.weave.set('remove.failure', 'Failed to remove rekt response #{0}.')

  $.weave.set('edit.usage', 'Usage: !rekt edit (number >= 1) (message)')
  $.weave.set('edit.success', 'rekt response #{0} modified.')
  $.weave.set('edit.failure', 'Failed to edit rekt response #{0}.')
}
