const sanitizeText = str => {
  // remove surrounding double quotes
  // @DEV: if this pattern has issues try this one:
  // /^"(.+(?="$))"$/g
  const match = str.match(/^"(.*)"$/g)
  return match ? str.replace(/^"(.*)"$/g, '$1') : str
}

const add = $ => async quote => {
  if (!$.is.object(quote) || !quote.mesasge) return false

  const obj = Object.assign({}, {
    credit: $.channel.name,
    submitter: '',
    date: new Date().toISOString().split('T')[0],
    game: $.stream.game || ''
  }, quote)

  await $.db.set('quotes', {
    message: sanitizeText(obj.message),
    credit: obj.credit,
    submitter: obj.submitter,
    date: obj.date,
    game: obj.game
  })

  const res = await $.db.create('quotes', obj)
  return res && res.id ? res.id : false
}

const get = $ => async id => {
  if (!$.is.number(id)) return false
  return $.db.findOne('quotes', { id })
}

const remove = $ => async id => {
  if (!$.is.number(id)) return false

  await $.db.remove('quotes', { id })
  return !await $.db.exists('quotes', { id })
}

const modify = $ => async (id, newData) => {
  if (!$.is.number(id) || !$.is.object(newData)) return false

  await $.db.update('quotes', { id }, newData)
  return $.db.exists('quotes', { id })
}

export default {
  async setup ($) {
    $.extend({
      quote: {
        add: add($),
        get: get($),
        modify: modify($),
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
