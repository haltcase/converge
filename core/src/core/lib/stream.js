import { _ } from 'param.macro'

import FP from 'functional-promises'

import { getInstance } from '../bot'
import duration from '../util/duration'

/**
 * @param {import('@converge/types/index').Core} context
 * @param {import('twitch/lib/index').ChattersList} chatters
 */
const parseChatterList = (context, chatters) => {
  const { allChatters } = chatters

  allChatters
  |> context.user.resolveUserList
  |> FP.resolve(_).then(Object.entries)
  |> _.map(([_, user]) =>
    context.db.updateOrCreate('users', { id: user.id }, {
      name: user.name,
      seen: new Date()
    })
  )

  return {
    count: allChatters.length,
    list: allChatters
  }
}

const pollChatUsers = (context, getter) =>
  getter()
    .then(parseChatterList(context, _))
    .then(({ count, list }) => {
      context.user.list = list
      context.user.count = count
      return { count, list }
    })

const pollStreamInfo = async (context, getter) => {
  /**
   * TODO: why do I have to manually point to the index file?
   * @type {import('twitch/lib/index').HelixStream}
   */
  const data = await getter()
  const isLive = data !== null

  if (!isLive) {
    Object.assign(context.stream, {
      isLive,
      game: '',
      status: '',
      uptime: 'offline'
    })
  } else {
    Object.assign(context.stream, {
      isLive,
      game: (await data.getGame())?.name ?? '',
      status: data.title,
      uptime: Date.now() - data.startDate.valueOf() |> duration
    })
  }
}

/**
 * @param {import('@converge/types/index').Core} context
 */
export default async context => {
  const { client } = await getInstance()

  const getStreamInfo = id =>
    String(id || context.ownerId)
    |> client.helix.streams.getStreamByUserId

  const getChatUsers = name =>
    client.unsupported.getChatters(name || context.ownerName)

  context.on('ready', () => {
    const poll = () => {
      pollChatUsers(context, getChatUsers)
      pollStreamInfo(context, getStreamInfo)
    }

    context.tick.setInterval('stream-polling', poll, '30s')
    context.tick.setTimeout('start:stream-polling', poll, '2s')
  })

  context.extend({
    stream: {
      getStreamInfo,
      isLive: false,
      game: '',
      status: '',
      uptime: 'offline'
    },
    user: {
      list: [],
      count: 0
    }
  })
}
