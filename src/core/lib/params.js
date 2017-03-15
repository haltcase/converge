const strat = require('strat')
const Promise = require('bluebird')
const map = require('stunsail/map')
const isObject = require('stunsail/is-object')
const toObject = require('stunsail/to-object')
const { escapeRegExp } = require('lodash')

module.exports = context => {
  function params (event, text, tags) {
    if (!isObject(event) || !hasTags(text)) return Promise.resolve(text)

    let tagMap = Object.assign({}, toObject(getTags(text)), event, tags)
    return getReplacements(context, tagMap)
      .then(strat(text))
  }

  context.extend({
    params
  })
}

function getReplacements (context, tags) {
  return Promise.props(map(tag => {
    switch (tag) {
      case 'sender':
        return tags.sender
      case '@sender':
        return '@' + tags.sender
      case 'random':
        return context.to.random(context.user.list) || context.ownerName
      case 'pointname':
        return context.points.getName()
      case '#':
        return context.to.random(100)
      case 'uptime':
        return context.stream.uptime
      case 'game':
        return context.stream.game || 'this game'
      case 'status':
        return context.stream.status
      case 'echo':
        return tags.argString
      case 'price':
        return context.command.getPrice(tags.command, tags.subcommand)
      case 'target':
        return tags.target
      case 'readfile':
        return file => context.file.read(file)
      case 'count':
      case 'followers':
      default:
        return
    }
  }, tags))
}

const tagList = [
  `{age}`,
  `{sender}`,
  `{@sender}`,
  `{random}`,
  `{count}`,
  `{pointname}`,
  `{price}`,
  `{#}`,
  `{uptime}`,
  `{followers}`,
  `{game}`,
  `{status}`,
  `{target}`,
  `{echo}`,
  `{readfile `
]

const escapedTags = tagList.map(escapeRegExp)

function getTags (str) {
  return str.match(/[^{}]+(?=})/g)
}

function hasTags (str) {
  return escapedTags.some(v => v.test(str))
}
