/**
 * @param {import('@converge/types').Core} $
 */
export const strings = $ => {
  $.weave.set('did-not-find', `You didn't find any {0} in the couch this time.`)
  $.weave.set('found-points', 'You found {0} in the couch!')

  $.weave.set('multi.usage', 'Usage: !couch multi (multiplier) » currently set to {0}')
  $.weave.set('multi.success', 'Multiplier for !couch is now set to {0}')
}
