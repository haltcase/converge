import { _, it } from 'param.macro'

import FP from 'functional-promises'
import strat from 'strat'
import { getOr } from 'stunsail'

const follower = strat('users/{}/follows/channels/{}')
const subscriber = strat('channels/{}/subscriptions/{}')

export default context => {
  const isAdmin = id =>
    context.db.get('usertypes.admin', { id })

  const isMod = id =>
    context.db.get('usertypes.mod', { id })

  const isFollower = id =>
    context.api(follower([id, context.ownerID]))
      .then(it && !it.error)
      .catch(e => false)

  const isSubscriber = id =>
    context.api(subscriber([context.ownerID, id]))
      .then(it && !it.error)
      .catch(e => false)

  const resolveID = name =>
    context.api('users', {
      params: { login: encodeURIComponent(name) }
    }).then(getOr(_, 'users.0._id', false))

  const resolveIDList = list => {
    if (!Array.isArray(list)) return

    list = list.join(',')
    return FP.resolve(
      context.api('users', {
        params: { login: encodeURIComponent(list) }
      })
    )
      .then(getOr(_, 'users', []))
      .map(getOr(_, '_id', false))
  }

  const resolveUser = id =>
    context.api('users/' + id)
      .then(getOr(_, 'display_name', false))

  const resolveUserObject = id =>
    context.api('users/' + id)

  const getID = name =>
    context.db.get('users.id', { name })

  const getName = id =>
    context.db.get('users.name', { id })

  const setAdmin = (id, status) => {
    status = context.toBoolean(status)
    return getName(id)
      .then(
        context.db.updateOrCreate('usertypes', { id }, {
          name: _,
          admin: status
        })
      )
  }

  const setMod = (id, status) => {
    status = context.toBoolean(status)
    return getName(id)
      .then(
        context.db.updateOrCreate('usertypes', { id }, {
          name: _,
          mod: status
        })
      )
  }

  const existsById = id =>
    context.db.exists('users', { id })

  const existsByName = name =>
    context.db.exists('users', { name })

  /*
  context.on('beforeMessage', ($, e) => {
    FP.all([
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
      setMod,
      exists: existsByName,
      existsById
    }
  })
}
