export default $ => {
  $.weave.set('usage', 'Usage: !notice (add | edit | get | remove | list)')

  $.weave.set('add.usage', 'Usage: !notice add (name) (message)')
  $.weave.set('add.success', `Notice '{0}' added.`)
  $.weave.set('add.failure', `Notice '{0}' could not be added.`)

  $.weave.set('edit.usage', 'Usage: !notice edit (name) (new message)')
  $.weave.set('edit.success', `Notice '{0}' modified.`)
  $.weave.set('edit.failure', `Notice '{0}' could not be modified.`)

  $.weave.set('get.usage', 'Usage: !notice get (name)')
  $.weave.set('get.not-found', `No notice found by the name of '{0}'.`)
  $.weave.set('get.response', `Notice '{0]' » {1}`)

  $.weave.set('remove.usage', 'Usage: !notice remove (name)')
  $.weave.set('remove.success', `Notice '{0}' removed.`)
  $.weave.set('remove.failure', `Notice '{0}' could not be removed.`)

  $.weave.set('list.usage', 'Usage: !notice list')
  $.weave.set('list.response', 'Available notices: {0}')
  $.weave.set('list.not-found', 'There are no notices.')
}
