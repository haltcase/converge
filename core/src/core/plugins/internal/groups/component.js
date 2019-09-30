/**
 * @typedef {import('@converge/types/index').Core} Core
 * @typedef {import('@converge/types/index').ChatEvent} ChatEvent
 */

const getName = $ => level =>
  $.db.get('groups.name', { level })

const getLevel = $ => async name =>
  parseInt(await $.db.get('groups.level', { name }))

const getUserGroup = $ => async user => {
  const _user = $.is.object(user) ? user : { 'display-name': user }
  const { 'display-name': username, 'user-type': userType } = _user

  let defaultGroupId = 5
  if (userType === 'mod') defaultGroupId = 1
  if (await $.user.isAdmin(username)) defaultGroupId = 0

  const groupId = await $.db.get('users.permission', { name: username })
  if (groupId >= 0) return groupId

  $.log.debug('groups',
    `getUserGroup: assigning default group to ${username} (level ${defaultGroupId})`
  )
  await $.db.set('users.name', { permission: defaultGroupId }, username)
  return defaultGroupId
}

/**
 * @param {Core} $
 */
const initGroups = async $ => {
  await $.db.addTableCustom('groups', {
    level: { type: Number, primary: true },
    name: String,
    bonus: Number
  })

  if (await $.db.getExtConfig('groups.state', 'initial') === 'initial') {
    $.log('groups', 'Initializing default user groups...')

    try {
      await Promise.all([
        $.db.create('groups', { name: 'admin', level: 0, bonus: 0 }),
        $.db.create('groups', { name: 'moderator', level: 1, bonus: 0 }),
        $.db.create('groups', { name: 'subscriber', level: 2, bonus: 5 }),
        $.db.create('groups', { name: 'regular', level: 3, bonus: 5 }),
        $.db.create('groups', { name: 'follower', level: 4, bonus: 2 }),
        $.db.create('groups', { name: 'viewer', level: 5, bonus: 0 }),
        $.db.setExtConfig('groups.state', 'default')
      ])
    } catch (e) {
      $.log('groups',
        'An error occurred while setting default user groups. ' +
        'Check the error log for more info.'
      )
      $.log.error('groups', `Error setting default user groups :: ${e.message}`)
      return
    }

    $.log('groups', 'Done. Default user groups initialized.')
  }
}

export default {
  /**
   * @param {Core} $
   */
  setup ($) {
    $.extend({
      user: {
        getGroup: getUserGroup($)
      },

      groups: {
        getName: getName($),
        getLevel: getLevel($)
      }
    })

    return initGroups($)
  },

  /**
   * @param {Core} $
   * @param {ChatEvent} e
   */
  async beforeCommand ($, e) {
    const { sender, command, subcommand, groupID } = e
    const required = await $.command.getPermLevel(command, subcommand)

    if (groupID > required) {
      $.log.event('core',
        `${sender} does not have sufficient permissions to use !${command}`
      )
      $.whisper(sender, `You don't have what it takes to use !${command}.`)

      e.prevent()
    }
  }
}
