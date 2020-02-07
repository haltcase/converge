/**
 * @typedef {import('@converge/types').Core} Core
 * @typedef {import('@converge/types').ChatEvent} ChatEvent
 * @typedef {import('@converge/types').ExtraTags} ExtraTags
 * @typedef {import('@converge/types').Tag} Tag
 * @typedef {ChatEvent & Record<Tag, any>} TagObject
 */

import { _, it } from 'param.macro'

import FP from 'functional-promises'
import escapeRegExp from 'lodash.escaperegexp'
import strat from 'strat'
import { has, map, isObject, toObject } from 'stunsail'

const tagList = [
  '{age}',
  '{cmdprefix}',
  '{sender}',
  '{@sender}',
  '{random}',
  '{count}',
  '{pointname}',
  '{pointsname}',
  '{pointstr ',
  '{price}',
  '{#}',
  '{uptime}',
  '{followers}',
  '{game}',
  '{status}',
  '{target}',
  '{@target}',
  '{echo}',
  '{readfile '
]

const tagRegex = /[^{}]+(?=})/g

const rgxTags = tagList.map(tag => RegExp(escapeRegExp(tag)))
const getTags = str => str.match(tagRegex)
const hasTags = str => rgxTags.some(it.test(str))

/**
 * @param {Core} context
 * @param {TagObject} tags
 */
const getReplacements = (context, tags) => {
  return FP.all(map(tags, (_, tag) => {
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
        return context.points.getName(true)
      case 'pointsname':
        return context.points.getName()
      case 'pointstr':
        return amount => context.points.str(context.to.int(amount))
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
      case 'age':
        console.log('TODO: handle age')
        break
      case 'count':
        return context.db.get('stats_commands.uses', { name: tags.command }, 1)
      case 'followers':
        return context.user.getFollowerCount(context.ownerId)
      default: {
        if (has(tags, tag)) {
          return tags[tag]
        }

        // probably either a bad tag (typo) or not meant to be a tag
        // doing nothing means it silently drops out of the message
        // `return tag` places the content of the `{}` in the message
        return `{${tag}}`
      }
    }
  }))
}

/**
 * @param {Core} context
 */
export default context => {
  /**
   * @param {ChatEvent} event
   * @param {string} text
   * @param {ExtraTags} tags
   */
  const params = async (event, text, tags) => {
    if (!isObject(event) || !hasTags(text)) {
      if (Array.isArray(tags)) {
        return strat(text, tags)
      }

      return text
    }

    const tagObj = toObject(getTags(text))
    const tagMap = Object.assign({}, tagObj, event)

    const replacements = []
    if (Array.isArray(tags) && tags.length > 0) {
      Object.assign(tagMap, { toString: () => tags[0] })
      replacements.push(...tags.slice(1))
    } else {
      Object.assign(tagMap, tags)
    }

    replacements.unshift(await getReplacements(context, tagMap))
    return strat(text, replacements)
  }

  context.extend({
    params
  })
}
