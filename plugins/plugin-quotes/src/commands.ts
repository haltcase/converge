/**
 * quotes - add & manage quotes
 *
 * @source stock module
 * @author citycide
 */

import { PluginCommandHandler, PluginSetup } from '@converge/types'
import { Quote } from './types'

const creditRegex = /~(\w+)/g
const doubleQuoteRegex = /"/g

/**
 * @command quote
 * @usage !quote [add|remove|edit|help] (...)
 */
export const quote: PluginCommandHandler = async ($, e) => {
  const [param1] = e.args
  const parsed = $.to.int(param1)

  if (!e.args.length) {
    return e.respond(await $.weave('usage'))
  }

  if (e.subcommand === 'add') {
    if (e.args.length < 3) {
      return e.respond(await $.weave('add.usage'))
    }

    const thisQuote: Quote = {
      submitter: e.sender,
      message: ''
    }

    if (creditRegex.test(e.subArgString)) {
      thisQuote.message = e.subArgString.replace(creditRegex, '').replace(doubleQuoteRegex, '')
      thisQuote.credit = creditRegex.exec(e.subArgString)?.[1]
    } else {
      thisQuote.message = e.subArgString.replace(doubleQuoteRegex, '')
    }

    const quoteID = await $.quote.add(thisQuote)

    if (quoteID) {
      e.respond(await $.weave('add.success', quoteID))
    } else {
      e.respond(await $.weave('add.failure'))
    }

    return
  }

  if (e.subcommand === 'remove') {
    if (!$.is.number(parsed) || parsed < 1) {
      return e.respond(await $.weave('remove.usage'))
    }

    if (await $.quote.remove(parsed)) {
      const count = await $.db.count('quotes')
      e.respond(await $.weave('remove.success', count))
    } else {
      e.respond(await $.weave('remove.failure', param1))
    }

    return
  }

  if (e.subcommand === 'edit') {
    if (!$.is.number(parsed) || parsed < 1) {
      return e.respond(await $.weave('edit.usage'))
    }

    // TODO?: allow for editing game & date somehow. separate command?

    const newQuote: Quote = {
      message: ''
    }

    if (creditRegex.test(e.subArgString)) {
      newQuote.message = e.subArgs.slice(1).join(' ').replace(creditRegex, '')
      newQuote.credit = creditRegex.exec(e.subArgString)?.[1]
    } else {
      newQuote.message = e.subArgs.slice(1).join(' ')
    }

    if (await $.quote.edit(parsed, newQuote)) {
      e.respond(await $.weave('edit.success', param1))
    } else {
      e.respond(await $.weave('edit.failure', param1))
    }

    return
  }

  if (e.subcommand === 'help') {
    return e.respond(await $.weave('help'))
  }

  const id = $.to.int(e.args[0])
  if (id) {
    if (!await $.db.exists('quotes', { id })) {
      return e.respond(await $.weave('response.not-found', id))
    }

    const quote = await $.quote.get(id)
    const game = quote.game ? ` - ${quote.game}` : ''
    e.respond(await $.weave('response', quote.message, quote.credit, quote.date, game))
  } else {
    e.respond(await $.weave('usage'))
  }
}

export const setup: PluginSetup = $ => {
  $.addCommand('quote', { cooldown: 60 })

  $.addSubcommand('help', 'quote')
  $.addSubcommand('add', 'quote')
  $.addSubcommand('remove', 'quote', { permission: 1 })
  $.addSubcommand('edit', 'quote', { permission: 1 })
}
