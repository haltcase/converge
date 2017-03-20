'use strict'

const stunsail = require('stunsail')
const { camelCase } = require('lodash')

module.exports = context => {
  let is = stunsail.isEqual
  let to = {}

  stunsail.each(key => {
    let prefix = key.slice(0, 2)
    let token = camelCase(key.slice(2))

    if (prefix === 'is') {
      is[token] = stunsail[key]
      return
    }

    if (prefix === 'to') {
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
  }, Object.keys(stunsail))

  context.extend({
    is,
    to,
    sleep: stunsail.sleep
  })
}
