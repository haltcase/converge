export default function ($) {
  $.weave.set('response.default', '{0} has {1}.')
  $.weave.set('response.not-found', '{0} has not visited the chat yet.')

  $.weave.set('add.usage', 'Usage: !points add (username) (amount)')
  $.weave.set('remove.usage', 'Usage: !points remove (username) (amount)')
  $.weave.set('change.success', '{0} now has {1}.')

  $.weave.set('gift.usage', 'Usage: !points gift (username) (amount)')
  $.weave.set('gift.not-enough-points', 'You only have {0}.')
  $.weave.set('gift.success.sender', 'You gave {0} to {1} » {2} remaining')
  $.weave.set('gift.success.recipient', '{0} gave you {1} » you now have {2}')
  $.weave.set('gift.success.shout', '{0} gave {1} to {2} » {3} remaining')
}
