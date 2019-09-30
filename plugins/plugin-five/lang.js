/**
 * @param {import('@converge/types/index').Core} $
 */
export default $ => {
  $.weave.set('usage', 'Usage: !five [target] | (add | remove | edit)')

  $.weave.set('not-found', 'There is no !five response with ID #{0}.')
  $.weave.set('target-not-present', `{0} couldn't find that sweet {1} high-five :(`)

  $.weave.set('response.default', `{0} tried to give a sentence a high-five. Didn't work.`)
  $.weave.set('response.fallback', 'Alright, cool it Handy McHandface.')
  $.weave.set('response.random', `{0} flails randomly and happens to cross hands with {1} for a wicked high-five.`)
  $.weave.set('response.random-fallback', `Strange... there's no five to grab here.`)

  $.weave.set('add.usage', 'Usage: !five add (message)')
  $.weave.set('add.success', 'High-five response added as #{0}.')
  $.weave.set('add.failure', 'Failed to add high-five response.')

  $.weave.set('remove.usage', 'Usage: !five remove (number >= 1)')
  $.weave.set('remove.success', 'High-five response removed. {0} responses remaining.')
  $.weave.set('remove.failure', 'Failed to remove high-five response #{0}.')

  $.weave.set('edit.usage', 'Usage: !five edit (number >= 1) (message)')
  $.weave.set('edit.success', 'High-five response #{0} modified.')
  $.weave.set('edit.failure', 'Failed to edit high-five response #{0}.')
}
