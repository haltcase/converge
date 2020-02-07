/**
 * @param {import('@converge/types').Core} $
 */
export const strings = $ => {
  $.weave.set('response.default', '{0} has {1}.')
  $.weave.set('response.not-found', '{0} has not visited the chat yet.')

  $.weave.set('add.usage', 'Usage: !{pointsname} add (username) (amount)')
  $.weave.set('remove.usage', 'Usage: !{pointsname} remove (username) (amount)')
  $.weave.set('change.success', '{0} now has {1}.')

  $.weave.set('gift.usage', 'Usage: !{pointsname} gift (username) (amount)')
  $.weave.set('gift.not-enough-points', 'You only have {0}.')
  $.weave.set('gift.success.sender', 'You gave {0} to {1} » {2} remaining')
  $.weave.set('gift.success.recipient', '{0} gave you {1} » you now have {2}')
  $.weave.set('gift.success.shout', '{0} gave {1} to {2} » {3} remaining')

  $.weave.set('interval.usage', 'Usage: !{pointsname} interval [minutes | ex: 5m 30s] » currently {0}')
  $.weave.set('interval.success', 'Online payout interval set to {0}.')

  $.weave.set('payout.usage', 'Usage: !{pointsname} payout [amount] » currently {0}')
  $.weave.set('payout.success', 'Online payout amount set to {0}.')

  $.weave.set('offlineinterval.usage', 'Usage: !{pointsname} offlineinterval [minutes | ex: 5m 30s] » currently {0}')
  $.weave.set('offlineinterval.success', 'Offline payout interval set to {0}.')

  $.weave.set('offlinepayout.usage', 'Usage: !{pointsname} offlinepayout [amount] » currently {0}')
  $.weave.set('offlinepayout.success', 'Offline payout amount set to {0}.')

  $.weave.set('setname.usage', 'Usage: !{pointsname} setname (singular) [plural] » currently {0} / {1}')
  $.weave.set('setname.success', 'Point name set to {0} / {1}.')

  $.weave.set('price.usage', 'Usage: !{pointsname} price (command) [subcommand]')
  $.weave.set('price.response', 'Command \'{0}\' costs {1} per use.')
  $.weave.set('price.success', 'Price for command \'{0}\' is now {1}.')

  $.weave.set(
    'command.not-enough-points',
    'You don\'t have enough {pointsname} to use !{}. » costs {}, you have {}'
  )
}
