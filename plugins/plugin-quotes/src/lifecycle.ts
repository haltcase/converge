import { Core, PluginLifecycle } from '@converge/types'
import { Quote } from './types'

const sanitizeText = (str: string) => {
  // remove surrounding double quotes
  // @DEV: if this pattern has issues try this one:
  // /^"(.+(?="$))"$/g
  const match = str.match(/^"(.*)"$/g)
  return match ? str.replace(/^"(.*)"$/g, '$1') : str
}

const add = ($: Core) => async (quote: Quote) => {
  if (!$.is.object(quote) || !quote.message) {
    return false
  }

  const obj: Quote = {
    credit: $.ownerName,
    submitter: '',
    date: new Date().toISOString().split('T')[0],
    game: $.stream.game || '',
    ...quote
  }

  const result = await $.db.create('quotes', {
    message: sanitizeText(obj.message),
    credit: obj.credit,
    submitter: obj.submitter,
    date: obj.date,
    game: obj.game
  })

  return result?.id || false
}

const get = ($: Core) => async (id: number) => {
  if (!$.is.number(id)) return false
  return $.db.findOne('quotes', { id })
}

const remove = ($: Core) => async (id: number) => {
  if (!$.is.number(id)) return false

  await $.db.remove('quotes', { id })
  return !await $.db.exists('quotes', { id })
}

const edit = ($: Core) => async (id: number, newData: Partial<Quote>) => {
  if (!$.is.number(id) || !$.is.object(newData)) {
    return false
  }

  await $.db.update('quotes', { id }, newData)
  return $.db.exists('quotes', { id })
}

export const lifecycle: PluginLifecycle = {
  async setup ($) {
    $.extend({
      quote: {
        add: add($),
        get: get($),
        edit: edit($),
        remove: remove($)
      }
    })

    await $.db.addTableCustom('quotes', {
      id: 'increments',
      message: String,
      credit: String,
      submitter: String,
      date: String,
      game: String
    })
  }
}
