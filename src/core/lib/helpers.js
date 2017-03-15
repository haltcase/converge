'use strict'

const stunsail = require('stunsail')

module.exports = context => {
  let is = stunsail.isEqual
  let to = {}

  stunsail.each(key => {
    let token = key.slice(2)
    switch (key.slice(0, 2)) {
      case 'is':
        is[token] = stunsail[key]
        return
      case 'to':
        to[token] = stunsail[key]
        return
    }

    let isToMethod = stunsail.isOneOf([
      'clamp',
      'range',
      'random',
      'defaults'
    ])

    if (isToMethod(key)) {
      to[key] = stunsail[key]
    }
  })

  context.extend({
    is,
    to,
    sleep: stunsail.sleep
  })
}
