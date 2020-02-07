/**
 * @typedef {string | number} Time
 * @typedef {import('@converge/types').Core} Core
 */

import ms from 'ms'

/**
 * @type {typeof ms}
 */
const msWrapper = (value, options) => {
  if (typeof value === 'string' && value.trim().includes(' ')) {
    return value.split(' ').reduce((total, unit) => total + ms(unit, options), 0)
  }

  return ms(value, options)
}

/**
 * @param {Time} time
 * @returns {number}
 */
const normalizeTime = time =>
  typeof time === 'string'
    ? ms(time)
    : time

export class Tock {
  /**
   * @type {Map<string, NodeJS.Timeout>}
   */
  timers = new Map()

  /**
   * @type {Map<string, NodeJS.Timeout>}
   */
  intervals = new Map()

  ms = msWrapper

  /**
   *
   * @param {string} name
   * @param {() => any} fn
   * @param {Time} time
   * @param  {...unknown} args
   */
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

  /**
   * @param {string} name
   */
  clearTimeout (name) {
    if (!this.timers.has(name)) return

    clearTimeout(this.timers.get(name))
    this.timers.delete(name)
  }

  /**
   *
   * @param {string} name
   * @param {() => any} fn
   * @param {Time} time
   * @param  {...unknown} args
   */
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

  /**
   * @param {string} name
   */
  clearInterval (name) {
    if (!this.intervals.has(name)) return

    clearInterval(this.intervals.get(name))
    this.intervals.delete(name)
  }

  /**
   * @private
   * @param {(...args: any[]) => any} fn
   * @param {string} name
   * @param {...unknown} args
   */
  _wrapper (fn, name, ...args) {
    fn(...args.slice(2))
    this.timers.delete(name)
  }
}

/**
 * @param {Core} context
 */
export default context => {
  const instance = new Tock()

  context.on('beforeShutdown', () => {
    instance.timers.forEach(timer => clearTimeout(timer))
    instance.intervals.forEach(interval => clearInterval(interval))
  })

  context.extend({ tick: instance })
}
