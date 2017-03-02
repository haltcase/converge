'use strict'

const _ = require('lodash')
const callsites = require('callsites')
const { basename, dirname } = require('path')

module.exports = context => {
  let cache = {
    storage: {},

    get (key, defaultValue) {
      let space = getCaller(callsites())
      return this.getSpace(space, key, defaultValue)
    },

    set (key, value) {
      let space = getCaller(callsites())
      return this.setSpace(space, key, value)
    },

    push (target, value) {
      let space = getCaller(callsites())
      return this.pushSpace(space, target, value)
    },

    has (key) {
      let space = getCaller(callsites())
      return this.hasSpace(space, key)
    },

    getSpace (space, key, defaultValue) {
      let path = _.toPath(key)
      let value = _.get(this.storage, [space, ...path])
      return _.isNil(value) ? defaultValue : value
    },

    setSpace (space, key, value) {
      let path = _.toPath(key)
      _.set(this.storage, [space, ...path], value)
      return _.get(this.storage, [space, ...path])
    },

    pushSpace (space, target, value) {
      let path = _.toPath(target)
      let arr = _.get(this.storage, [space, ...path], [])
      arr.push(value)
      _.set(this.storage, [space, ...path], arr)
      return _.get(this.storage, [space, ...path])
    },

    hasSpace (space, key) {
      let path = _.toPath(key)
      return _.has(this.storage, [space, ...path])
    }
  }

  context.extend({ cache })
}

function getCaller (callsite) {
  let caller = callsite[1].getFileName()
  let parent = basename(dirname(caller))
  return `${parent}/${basename(caller)}`
}
