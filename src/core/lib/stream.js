const reduce = require('stunsail/reduce')
const duration = require('../util/duration')

module.exports = context => {
  function getStreamInfo (id) {
    id = id || context.ownerID
    return context.api(`streams/${id}?ts=${Date.now()}`)
  }

  function getChatUsers (name) {
    name = name || context.ownerName
    let base = 'https://tmi.twitch.tv/group/user/'
    return context.api(`${base}${name}/chatters?ts=${Date.now()}`)
      .then(({ chatter_count, chatters }) => {
        return { count: chatter_count, chatters }
      })
  }

  context.on('ready', () => {
    function poll () {
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

function pollChatUsers (context, getter) {
  return getter()
    .then(data => parseChatterList(context, data.chatters))
    .then(({ count, list }) => {
      context.user.list = list
      context.user.count = count
      return { count, list }
    })
}

function pollStreamInfo (context, getter) {
  return getter()
    .then(data => {
      let isLive = data && !!data.stream
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

      let since = Date.now() - created
      let uptime = isLive ? duration(since) : 'offline'

      Object.assign(context.stream, {
        isLive,
        game,
        status,
        uptime
      })
    })
}

/**
 * TODO: mark users as seen and add them to the
 * database, or update the existing record
 */
function parseChatterList (context, chatters) {
  return reduce((acc, group) => {
    acc.count += group.length
    acc.list = [...acc.list, ...group]
    return acc
  }, { count: 0, list: [] }, chatters)
}
