import { _ } from 'param.macro'

import { reduce } from 'stunsail'

import duration from '../util/duration'

/**
 * TODO: mark users as seen and add them to the
 * database, or update the existing record
 */
const parseChatterList = (context, chatters) =>
  reduce(chatters, (acc, group) => {
    acc.count += group.length
    acc.list = [...acc.list, ...group]
    return acc
  }, { count: 0, list: [] })

const pollChatUsers = (context, getter) =>
  getter()
    .then(parseChatterList(context, _.chatters))
    .then(({ count, list }) => {
      context.user.list = list
      context.user.count = count
      return { count, list }
    })

const pollStreamInfo = async (context, getter) => {
  const data = await getter()
  const isLive = data?.stream
  let game, status, created

  if (!isLive) {
    game = ''
    status = ''
    created = 0
  } else {
    ;({ game, created_at: created } = data.stream)
    ;({ status } = data.stream.channel)
    created = new Date(created).valueOf()
  }

  const since = Date.now() - created
  const uptime = isLive ? duration(since) : 'offline'

  Object.assign(context.stream, {
    isLive,
    game,
    status,
    uptime
  })
}

export default context => {
  const getStreamInfo = id => {
    id = id || context.ownerID
    return context.api(`streams/${id}?ts=${Date.now()}`)
  }

  const getChatUsers = name => {
    name = name || context.ownerName
    const base = 'https://tmi.twitch.tv/group/user/'
    return context.api(`${base}${name}/chatters?ts=${Date.now()}`)
      // eslint-disable-next-line camelcase
      .then(({ chatter_count = 0, chatters = 0 } = {}) => {
        // eslint-disable-next-line camelcase
        return { count: chatter_count, chatters }
      })
  }

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
