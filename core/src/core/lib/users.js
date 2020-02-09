import { _, it } from "param.macro"

import FP from "functional-promises"

import { getInstance } from "../bot"

/**
 * @param {import("@converge/types").Core} context
 */
export default async context => {
  const { client } = await getInstance()

  const isAdmin = async id =>
    context.db.get("usertypes.admin", { id })

  const isMod = async id =>
    context.db.get("usertypes.mod", { id })

  const isFollower = async id =>
    client.helix.users.getUserById(String(id))
      .then(it?.follows(context.ownerId))

  const isSubscriber = async id =>
    client.helix.users.getUserById(String(id))
      .then(it?.isSubscribedTo(context.ownerId))

  const getFollowerCount = async id =>
    (await client.helix.users.getFollows({
      followedUser: String(id)
    })).total

  const resolveIdByName = async name =>
    client.helix.users.getUserByName(name).then(it?.id)

  const resolveUserList = async names => {
    if (!Array.isArray(names)) {
      context.log.error(`resolveUserList expected array, got ${typeof names}`)
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
    client.helix.users.getUserById(String(id)).then(it?.displayName)

  const resolveUserById = async id =>
    client.helix.users.getUserById(String(id))

  const getIdByName = async name =>
    context.db.get("users.id", { name })

  const getNameById = async id =>
    context.db.get("users.name", { id })

  const setAdmin = async (id, status) => {
    return getNameById(id)
      .then(
        context.db.updateOrCreate("usertypes", { id }, {
          name: _,
          admin: context.toBoolean(status)
        })
      )
  }

  const setMod = async (id, status) =>
    getNameById(id).then(
      context.db.updateOrCreate("usertypes", { id }, {
        name: _,
        mod: context.toBoolean(status)
      })
    )

  const existsById = async id =>
    context.db.exists("users", { id })

  const existsByName = async name =>
    context.db.exists("users", { name })

  // context.on("beforeMessage", ($, e) => {
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
  //     console.log("TEMPORARY LOGS FROM lib/users.js")
  //     console.log("event.mod       : ", a)
  //     console.log("isAdmin         : ", b)
  //     console.log("isMod           : ", c)
  //     console.log("resolveNameById : ", d)
  //     console.log("resolveIdByName : ", e)
  //     console.log("resolveUserById : ", f)
  //     console.log("isFollower      : ", g)
  //     console.log("isFollower      : ", h)
  //   })
  // })

  context.extend({
    user: {
      isAdmin,
      isFollower,
      isMod,
      isSubscriber,
      getFollowerCount,
      getIdByName,
      getNameById,
      resolveIdByName,
      resolveUserList,
      resolveNameById,
      resolveUserById,
      setAdmin,
      setMod,
      existsByName,
      existsById
    }
  })
}
