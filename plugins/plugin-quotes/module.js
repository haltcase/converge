/**
 * quotes - add & manage quotes
 *
 * @command quote
 * @usage !quote [subcommands]
 *
 * @source stock module
 * @author citycide
 */

const creditRegex = /~(\w+)/g
const doubleQuoteRegex = /"/g

export const quote = async ($, e) => {
  const [param1] = e.args
  const parsed = $.to.int(param1)

  if (!e.args.length) {
    return e.respond($.weave('usage'))
  }

  if (e.subcommand === 'add') {
    if (e.args.length < 3) {
      return e.respond($.weave('add.usage'))
    }

    const thisQuote = {
      submitter: e.sender
    }

    if (creditRegex.test(e.subArgString)) {
      thisQuote.message = e.subArgString.replace(creditRegex, '').replace(doubleQuoteRegex, '')
      thisQuote.credit = creditRegex.exec(e.subArgString)[1]
    } else {
      thisQuote.message = e.subArgString.replace(doubleQuoteRegex, '')
    }

    const quoteID = await $.quote.add(thisQuote)

    if (quoteID) {
      e.respond($.weave('add.succes', quoteID))
    } else {
      e.respond($.weave('add.failure'))
    }

    return
  }

  if (e.subcommand === 'remove') {
    if (!$.is.number(parsed) || parsed < 1) {
      return e.respond($.weave('remove.usage'))
    }

    if (await $.quote.remove(parsed)) {
      const count = await $.db.count('quotes')
      e.respond($.weave('remove.success', count))
    } else {
      e.respond($.weave('remove.failure', param1))
    }

    return
  }

  if (e.subcommand === 'edit') {
    if (!$.is.number(parsed) || parsed < 1) {
      return e.respond($.weave('edit.usage'))
    }

    // TODO?: allow for editing game & date somehow. separate command?

    const newQuote = {}

    if (creditRegex.test(e.subArgString)) {
      newQuote.message = e.subArgs.slice(1).join(' ').replace(creditRegex, '')
      newQuote.credit = regex.exec(e.subArgString)[1]
    } else {
      newQuote.message = e.subArgs.slice(1).join(' ')
    }

    if (await $.quote.modify(parsed, newQuote)) {
      e.respond($.weave('edit.success', param1))
    } else {
      e.respond($.weave('edit.failure', param1))
    }

    return
  }

  if (e.subcommand === 'help') {
    return e.respond($.weave('help'))
  }

  const id = $.to.int(e.args[0])
  if (id) {
    if (!await $.db.exists('quotes', { id })) {
      return e.respond($.weave('response.not-found', id))
    }

    const quote = await $.quote.get(id)
    const game = quote.game ? ` - ${quote.game}` : ''
    e.respond($.weave('response', quote.message, quote.credit, quote.date, game))
  } else {
    e.respond($.weave('usage'))
  }
}

export const setup = $ => {
  $.addCommand('quote', { cooldown: 60 })

  $.addSubcommand('help', 'quote')
  $.addSubcommand('add', 'quote')
  $.addSubcommand('remove', 'quote', { permission: 1 })
  $.addSubcommand('edit', 'quote', { permission: 1 })
}
