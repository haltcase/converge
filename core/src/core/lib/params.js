import { _, it } from 'param.macro'

import FP from 'functional-promises'
import escapeRegExp from 'lodash.escaperegexp'
import strat from 'strat'
import { map, isObject, toObject } from 'stunsail'

const tagList = [
  `{age}`,
  `{cmdprefix}`,
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
  `{@target}`,
  `{echo}`,
  `{readfile `
]

const rgxTags = tagList.map(it |> escapeRegExp |> RegExp)
const getTags = str => str.match(/[^{}]+(?=})/g)
const hasTags = str => rgxTags.some(it.test(str))

const getReplacements = (context, tags) => {
  return FP.all(map(tags, (value, tag) => {
    switch (tag) {
      case 'cmdprefix':
        return context.command.getPrefix()
      case 'sender':
        return tags.sender
      case '@sender':
        return tags.mention
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
      case '@target':
        return '@' + tags.target
      case 'readfile':
        return context.file.read(_)
      case 'count':
      case 'followers':
        console.log('TODO: handle count & follower params')
        break
      default: {
        // probably either a bad tag (typo) or not meant to be a tag
        // doing nothing means it silently drops out of the message
        // `return tag` places the content of the `{}` in the message
        return `{${tag}}`
      }
    }
  }))
}

export default context => {
  const params = async (event, text, tags) => {
    if (!isObject(event) || !hasTags(text)) return text

    const tagObj = text |> getTags |> toObject
    const tagMap = Object.assign({}, tagObj, event, tags)
    return getReplacements(context, tagMap)
      .then(strat(text))
  }

  context.extend({
    params
  })
}
