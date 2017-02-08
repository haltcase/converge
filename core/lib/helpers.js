const is = require('stunsail/is')
const to = require('stunsail/to')
const sleep = require('stunsail/async/sleep')

module.exports = context => {
  context.extend({
    is,
    to,
    sleep
  })
}
