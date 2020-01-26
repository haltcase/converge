/**
 * @typedef {import('@converge/types').Core} Core
 * @typedef {import('@converge/types').ChatEvent} ChatEvent
 */

/***/
const getName = $ => level =>
  $.db.get('ranks.name', { level })

const getLevel = $ => name =>
  $.db.get('ranks.level', { name })

const getBonus = $ => level =>
  $.db.get('ranks.bonus', { level }, 0)

const getUserRank = $ => async user => {
  const username = $.is.string(user) ? user : user?.displayName

  const rankId = await $.db.get('user_ranks.value', { key: username })
  if (rankId >= 1) return rankId

  $.log.debug('ranks',
    `getUserRank: assigning default rank to ${username} (level 1)`
  )
  await $.db.updateOrCreate('user_ranks', { key: username }, { value: 1 })
  return 1
}

const getAllowPurchases = $ => async () => {
  if (await $.db.getPluginConfig('points.enabled', true)) {
    return $.db.getPluginConfig('ranks.allowPurchases', true)
  } else {
    return false
  }
}

const setAllowPurchases = $ => bool => {
  if ($.is.boolean(bool)) return
  return $.db.setPluginConfig('ranks.allowPurchases', bool)
}

const handleBonuses = async ($, e) => {
  const id = await $.user.getRank(e.user)
  const bonus = await $.ranks.getBonus(id)
  if (bonus > 0) e.amount += bonus
}

const initRanks = async $ => {
  const [,, state] = await Promise.all([
    $.db.addTableCustom('ranks', {
      level: { type: Number, primary: true },
      name: String,
      bonus: Number,
      requirement: Number,
      price: Number
    }),
    $.db.addTable('user_ranks'),
    $.db.getPluginConfig('ranks.state', 'initial')
  ])

  if (state === 'initial') {
    $.log('ranks', 'Initializing default user ranks...')

    try {
      await Promise.all([
        $.db.create('ranks', { name: 'atari 2600', level: 1, bonus: 0, requirement: 0, price: 0 }),
        $.db.create('ranks', { name: 'commodore 64', level: 2, bonus: 1, requirement: 3, price: 130 }),
        $.db.create('ranks', { name: 'sega master', level: 3, bonus: 1, requirement: 6, price: 360 }),
        $.db.create('ranks', { name: 'snes', level: 4, bonus: 2, requirement: 9, price: 540 }),
        $.db.create('ranks', { name: 'sega saturn', level: 5, bonus: 2, requirement: 12, price: 720 }),
        $.db.create('ranks', { name: 'playstation', level: 6, bonus: 3, requirement: 15, price: 900 }),
        $.db.create('ranks', { name: 'n64', level: 7, bonus: 3, requirement: 20, price: 1200 }),
        $.db.create('ranks', { name: 'dreamcast', level: 8, bonus: 3, requirement: 30, price: 1800 }),
        $.db.create('ranks', { name: 'xbox', level: 9, bonus: 4, requirement: 50, price: 3000 }),
        $.db.create('ranks', { name: 'ps2', level: 10, bonus: 5, requirement: 100, price: 6000 }),
        $.db.setPluginConfig('ranks.state', 'default')
      ])
    } catch (e) {
      $.log('ranks',
        'An error occurred while setting default user ranks.' +
        'Check the error log for more info.'
      )
      $.log.error('ranks', `Error setting default user ranks :: ${e.message}`)
      return
    }

    $.log('ranks', 'Done. Default user ranks initialized.')
  }
}

/**
 * @type {import('@converge/types').PluginLifecycle}
 */
export const lifecycle = {
  async setup ($) {
    $.extend({
      user: {
        getRank: getUserRank($)
      },

      ranks: {
        getName: getName($),
        getLevel: getLevel($),
        getBonus: getBonus($),
        getAllowPurchases: getAllowPurchases($),
        setAllowPurchases: setAllowPurchases($)
      }
    })

    return initRanks($)
  },

  async beforeMessage ($, e) {
    // extend the event object with the user's rank
    const userRank = await $.user.getRank(e.sender)
    return { ...e, rankId: userRank }
  },

  points: {
    async beforePayout ($, e) {
      handleBonuses($, e)
    }
  }
}
