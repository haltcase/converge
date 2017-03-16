const ms = require('ms')
const apply = require('stunsail/apply')
const toArray = require('stunsail/to-array')

class Tock {
  constructor () {
    this.timers = new Map()
    this.intervals = new Map()
    this.ms = ms
  }

  setTimeout (name, fn, time) {
    if (arguments.length < 3) {
      throw new Error('invalid arguments')
    }

    if (typeof name === 'function') {
      time = normalizeTime(fn)
      fn = name
      name = ''
    } else {
      time = normalizeTime(time)
    }

    let kind = typeof fn
    if (kind !== 'function') {
      throw new TypeError(`Expected function, got ${kind}`)
    }

    let args = toArray(arguments, 3)

    if (!name) {
      return apply(setTimeout, [fn, time].concat(args))
    } else {
      this.clearTimeout(name)

      let id = apply(setTimeout,
        [this._wrapper.bind(this), time, fn, name].concat(args)
      )
      this.timers.set(name, id)
      return this.timers.get(name)
    }
  }

  clearTimeout (name) {
    if (!this.timers.has(name)) return

    clearTimeout(this.timers.get(name))
    this.timers.delete(name)
  }

  setInterval (name, fn, interval) {
    if (arguments.length < 2) {
      throw new Error('invalid arguments')
    }

    if (typeof name === 'function') {
      interval = normalizeTime(fn) || 1000
      fn = name
      name = ''
    } else {
      interval = normalizeTime(interval) || 1000
    }

    let kind = typeof fn
    if (kind !== 'function') {
      throw new TypeError(`Expected function, got ${kind}`)
    }

    let args = toArray(arguments, 3)

    if (!name) {
      return apply(setInterval, [fn, interval].concat(args))
    } else {
      this.clearInterval(name)


      let id = apply(setInterval, [fn, interval].concat(args))
      this.intervals.set(name, id)
      return this.intervals.get(name)
    }
  }

  clearInterval (name) {
    if (!this.intervals.has(name)) return

    clearInterval(this.intervals.get(name))
    this.intervals.delete(name)
  }

  _wrapper (fn, name) {
    apply(fn, toArray(arguments, 2))
    this.timers.delete(name)
  }
}

function normalizeTime (time) {
  return typeof time === 'string'
    ? ms(time) : parseInt(time)
}

module.exports = context => {
  context.extend({ tick: new Tock() })
}

module.exports.Tock = Tock
