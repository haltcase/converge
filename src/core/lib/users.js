const strat = require('strat')
const getOr = require('stunsail/get-or')

const follower = strat('users/{}/follows/channels/{}')
const subscriber = strat('channels/{}/subscriptions/{}')

module.exports = context => {
  function isAdmin (id) {
    return context.db.get('usertypes.admin', { id })
      .then(context.is(true))
  }

  function isMod (id) {
    return context.db.get('usertypes.mod', { id })
      .then(context.is(true))
  }

  function isFollower (id) {
    return context.api(follower([id, context.ownerID]))
      .then(res => res && !res.error)
      .catch(e => false)
  }

  function isSubscriber (id) {
    return context.api(subscriber([context.ownerID, id]))
      .then(res => res && !res.error)
      .catch(e => false)
  }

  function resolveID (name) {
    return context.api('users', {
      params: { login: encodeURIComponent(name) }
    }).then(getOr(false, 'users.0._id'))
  }

  function resolveIDList (list) {
    if (!Array.isArray(list)) return

    list = list.join(',')
    return Promise.resolve(
      context.api('users', {
        params: { login: encodeURIComponent(list) }
      })
    )
    .then(getOr([], 'users'))
    .map(getOr(false, '_id'))
  }

  function resolveUser (id) {
    return context.api('users/' + id)
      .then(getOr(false, 'display_name'))
  }

  function resolveUserObject (id) {
    return context.api('users/' + id)
  }

  function getID (name) {
    return context.db.get('users.id', { name })
  }

  function getName (id) {
    return context.db.get('users.name', { id })
  }

  function setAdmin (id, status) {
    status = context.toBoolean(status)
    return getName(id)
      .then(name => {
        return context.db.updateOrCreate('usertypes', { id }, {
          name,
          admin: status
        })
      })
  }

  function setMod (id, status) {
    status = context.toBoolean(status)
    return getName(id)
      .then(name => {
        return context.db.updateOrCreate('usertypes', { id }, {
          name,
          mod: status
        })
      })
  }

  /*
  context.on('beforeMessage', ($, e) => {
    Promise.all([
      e.mod,
      isAdmin(e.id),
      isMod(e.id),
      resolveUser(e.id),
      resolveID(e.sender),
      resolveUserObject(e.id),
      isFollower(82115229),
      isFollower(44322889)
    ]).then(([a, b, c, d, e, f, g, h]) => {
      console.log('TEMPORARY LOGS FROM lib/users.js')
      console.log('event.mod   : ', a)
      console.log('isAdmin     : ', b)
      console.log('isMod       : ', c)
      console.log('resolveUser : ', d)
      console.log('resolveID   : ', e)
      console.log('resolveObj  : ', f)
      console.log('isFollower  : ', g)
      console.log('isFollower  : ', h)
    })
  })
  */

  context.extend({
    user: {
      isAdmin,
      isMod,
      getID,
      resolveID,
      resolveIDList,
      resolve: resolveUser,
      get: resolveUserObject,
      isFollower,
      isSubscriber,
      setAdmin,
      setMod
    }
  })
}
