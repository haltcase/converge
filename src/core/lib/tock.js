import ms from 'ms'

const normalizeTime = time =>
  typeof time === 'string'
    ? ms(time)
    : parseInt(time)

export class Tock {
  constructor () {
    this.timers = new Map()
    this.intervals = new Map()
    this.ms = ms
  }

  setTimeout (name, fn, time, ...args) {
    if (!name && !fn && time == null) {
      throw new Error('invalid arguments')
    }

    if (typeof name === 'function') {
      time = normalizeTime(fn)
      fn = name
      name = ''
    } else {
      time = normalizeTime(time)
    }

    const kind = typeof fn
    if (kind !== 'function') {
      throw new TypeError(`Expected function, got ${kind}`)
    }

    if (!name) {
      return setTimeout(fn, time, ...args)
    } else {
      this.clearTimeout(name)
      const id = setTimeout(
        this._wrapper.bind(this), time, fn, name, ...args
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

  setInterval (name, fn, interval, ...args) {
    if (!name && !fn) {
      throw new Error('invalid arguments')
    }

    if (typeof name === 'function') {
      interval = normalizeTime(fn) || 1000
      fn = name
      name = ''
    } else {
      interval = normalizeTime(interval) || 1000
    }

    const kind = typeof fn
    if (kind !== 'function') {
      throw new TypeError(`Expected function, got ${kind}`)
    }

    if (!name) {
      return setInterval(fn, interval, ...args)
    } else {
      this.clearInterval(name)

      const id = setInterval(fn, interval, ...args)
      this.intervals.set(name, id)
      return this.intervals.get(name)
    }
  }

  clearInterval (name) {
    if (!this.intervals.has(name)) return

    clearInterval(this.intervals.get(name))
    this.intervals.delete(name)
  }

  _wrapper (fn, name, ...args) {
    fn(...args.slice(2))
    this.timers.delete(name)
  }
}

export default context => {
  context.extend({ tick: new Tock() })
}
