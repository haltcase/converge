import S from 'stunsail'
import callsites from 'callsites'
import { basename, dirname } from 'path'

/**
 * @param {ReturnType<callsites>} callsite
 */
const getCaller = callsite => {
  const caller = callsite[1].getFileName()
  const parent = basename(dirname(caller))
  return `${parent}/${basename(caller)}`
}

/**
 * @param {import('@converge/types').Core} context
 */
export default context => {
  const cache = {
    storage: {},

    get (key, defaultValue) {
      const scope = getCaller(callsites())
      return this.getScoped(scope, key, defaultValue)
    },

    set (key, value) {
      const scope = getCaller(callsites())
      return this.setScoped(scope, key, value)
    },

    push (target, value) {
      const scope = getCaller(callsites())
      return this.pushScoped(scope, target, value)
    },

    has (key) {
      const scope = getCaller(callsites())
      return this.hasScoped(scope, key)
    },

    getScoped (scope, key, defaultValue) {
      const links = S.pathLinks(key)
      const path = S.pathDots([scope, ...links])
      const value = S.get(this.storage, path)
      return S.isNil(value) ? defaultValue : value
    },

    setScoped (scope, key, value) {
      const links = S.pathLinks(key)
      const path = S.pathDots([scope, ...links])
      S.set(this.storage, path, value)
      return S.get(this.storage, path)
    },

    pushScoped (scope, target, value) {
      const links = S.pathLinks(target)
      const path = S.pathDots([scope, ...links])
      const arr = S.getOr(this.storage, path, [])

      if (!S.isArray(arr)) return

      arr.push(value)
      S.set(this.storage, path, arr)
      return S.get(this.storage, path)
    },

    hasScoped (scope, key) {
      const links = S.pathLinks(key)
      const path = S.pathDots([scope, ...links])
      return S.has(this.storage, path)
    }
  }

  context.extend({ cache })
}
