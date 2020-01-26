import { PluginStrings } from '@converge/types'

export const strings: PluginStrings = $ => {
  $.weave.set('usage', 'Usage: !coin (bet amount)')
  $.weave.set('error.bet-over-max', 'The max bet for !coin is {0}. Try again with a smaller bet.')
  $.weave.set('error.not-enough-points', `You don't have enough {0} FeelsBadMan ({1} available, risk multiplier of {2})`)

  $.weave.set('flip.win', 'You won {0} from the coin flip! PogChamp')
  $.weave.set('flip.loss', 'You lost {0} from the coin flip! BibleThump')

  $.weave.set('risk.usage', 'Usage: !coin risk (multiplier) » currently set to {0}')
  $.weave.set('risk.success', 'Risk multiplier for !coin updated to {0}.')

  $.weave.set('reward.usage', 'Usage: !coin reward (multiplier) » currently set to {0}')
  $.weave.set('reward.success', 'Reward multiplier for !coin updated to {0}.')

  $.weave.set('max.usage', 'Usage: !coin max (number) » currently set to {0}')
  $.weave.set('max.success', 'Max bet for !coin updated to {0}.')
}
