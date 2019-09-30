import { _, it } from 'param.macro'

import FP from 'functional-promises'

import { getInstance } from '../bot'

/**
 * @param {import('@converge/types/index').Core} context
 */
export default async context => {
  const { client } = await getInstance()

  const isAdmin = async id =>
    context.db.get('usertypes.admin', { id })

  const isMod = async id =>
    context.db.get('usertypes.mod', { id })

  const isFollower = async id =>
    String(id)
    |> client.helix.users.getUserById(_).then(it?.follows(context.ownerId))

  const isSubscriber = async id =>
    String(id)
    |> client.helix.users.getUserById(_).then(it?.isSubscribedTo(context.ownerId))

  const resolveIdByName = async name =>
    client.helix.users.getUserByName(name).then(it?.id)

  const resolveIdList = async names => {
    if (!Array.isArray(names)) {
      context.log.error(`resolveIdList expected array, got ${typeof names}`)
      return []
    }

    const resolved = await client.helix.users.getUsersByNames(names)

    const result = {}
    for (const user of resolved) {
      result[user.name] = user
    }

    return result
  }

  const resolveNameById = async id =>
    String(id) |> client.helix.users.getUserById(_).then(it?.displayName)

  const resolveUserById = async id =>
    String(id) |> client.helix.users.getUserById

  const getIdByName = async name =>
    context.db.get('users.id', { name })

  const getNameById = async id =>
    context.db.get('users.name', { id })

  const setAdmin = async (id, status) => {
    return getName(id)
      .then(
        context.db.updateOrCreate('usertypes', { id }, {
          name: _,
          admin: status |> context.toBoolean
        })
      )
  }

  const setMod = async (id, status) =>
    getName(id).then(
      context.db.updateOrCreate('usertypes', { id }, {
        name: _,
        mod: status |> context.toBoolean
      })
    )

  const existsById = async id =>
    context.db.exists('users', { id })

  const existsByName = async name =>
    context.db.exists('users', { name })

  // context.on('beforeMessage', ($, e) => {
  //   console.log(e.id)
  //   FP.all([
  //     e.mod,
  //     isAdmin(e.id),
  //     isMod(e.id),
  //     resolveNameById(e.id),
  //     resolveIdByName(e.sender),
  //     resolveUserById(e.id),
  //     isFollower(82115229),
  //     isFollower(44322889)
  //   ]).then(([a, b, c, d, e, f, g, h]) => {
  //     console.log('TEMPORARY LOGS FROM lib/users.js')
  //     console.log('event.mod       : ', a)
  //     console.log('isAdmin         : ', b)
  //     console.log('isMod           : ', c)
  //     console.log('resolveNameById : ', d)
  //     console.log('resolveIdByName : ', e)
  //     console.log('resolveUserById : ', f)
  //     console.log('isFollower      : ', g)
  //     console.log('isFollower      : ', h)
  //   })
  // })

  context.extend({
    user: {
      isAdmin,
      isFollower,
      isMod,
      isSubscriber,
      getIdByName,
      resolveIdByName,
      resolveIdList,
      resolveNameById,
      resolveUserById,
      setAdmin,
      setMod,
      existsByName,
      existsById
    }
  })
}
