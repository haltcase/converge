import { _ } from "param.macro"

import FP from "functional-promises"

import { getInstance } from "../bot"
import duration from "../util/duration"

/**
 * @typedef {import("@converge/types").Core} Core
 * @typedef {import("twitch").ChattersList} ChattersList
 * @typedef {import("twitch").HelixStream} HelixStream
 */

/**
 * @param {Core} context
 * @param {ChattersList} chatters
 */
const parseChatterList = (context, chatters) => {
  const { allChatters } = chatters

  FP.resolve(context.user.resolveUserList(allChatters))
    .then(Object.entries)
    .map(([_, user]) =>
      context.db.updateOrCreate("users", { id: user.id }, {
        name: user.name,
        seen: new Date()
      })
    )

  return {
    count: allChatters.length,
    list: allChatters
  }
}

/**
 * @param {Core} context
 * @param {(name: string) => Promise<ChattersList>} getter
 */
const pollChatUsers = (context, getter) =>
  getter()
    .then(parseChatterList(context, _))
    .then(({ count, list }) => {
      context.user.list = list
      context.user.count = count
      return { count, list }
    })

/**
 * @param {Core} context
 * @param {(name: string) => Promise<HelixStream | null>} getter
 */
const pollStreamInfo = async (context, getter) => {
  /**
   * @type {import("twitch").HelixStream}
   */
  const data = await getter()
  const isLive = data !== null

  if (!isLive) {
    Object.assign(context.stream, {
      isLive,
      game: "",
      status: "",
      uptime: "offline"
    })
  } else {
    Object.assign(context.stream, {
      isLive,
      game: (await data.getGame())?.name ?? "",
      status: data.title,
      uptime: duration(Date.now() - data.startDate.valueOf())
    })
  }
}

/**
 * @param {Core} context
 */
export default async context => {
  const { client } = await getInstance()

  /**
   * @param {string} id
   */
  const getStreamInfo = id =>
    client.helix.streams.getStreamByUserId(String(id || context.ownerId))

  /**
   * @param {string} name
   */
  const getChatUsers = name =>
    client.unsupported.getChatters(name || context.ownerName)

  context.on("ready", () => {
    const poll = () => {
      pollChatUsers(context, getChatUsers)
      pollStreamInfo(context, getStreamInfo)
    }

    context.tick.setInterval("stream-polling", poll, "30s")
    context.tick.setTimeout("start:stream-polling", poll, "2s")
  })

  context.extend({
    stream: {
      getStreamInfo,
      isLive: false,
      game: "",
      status: "",
      uptime: "offline"
    },
    user: {
      list: [],
      count: 0
    }
  })
}
