import S from 'stunsail'
import callsites from 'callsites'
import { basename, dirname } from 'path'

const getCaller = callsite => {
  const caller = callsite[1].getFileName()
  const parent = caller |> dirname |> basename
  return `${parent}/${basename(caller)}`
}

export default context => {
  const cache = {
    storage: {},

    get (key, defaultValue) {
      const space = getCaller(callsites())
      return this.getSpace(space, key, defaultValue)
    },

    set (key, value) {
      const space = getCaller(callsites())
      return this.setSpace(space, key, value)
    },

    push (target, value) {
      const space = getCaller(callsites())
      return this.pushSpace(space, target, value)
    },

    has (key) {
      const space = getCaller(callsites())
      return this.hasSpace(space, key)
    },

    getSpace (space, key, defaultValue) {
      const links = S.pathLinks(key)
      const path = S.pathDots([space, ...links])
      const value = S.get(this.storage, path)
      return S.isNil(value) ? defaultValue : value
    },

    setSpace (space, key, value) {
      const links = S.pathLinks(key)
      const path = S.pathDots([space, ...links])
      S.set(this.storage, path, value)
      return S.get(this.storage, path)
    },

    pushSpace (space, target, value) {
      const links = S.pathLinks(target)
      const path = S.pathDots([space, ...links])
      const arr = S.getOr(this.storage, path, [])
      arr.push(value)
      S.set(this.storage, path, arr)
      return S.get(this.storage, path)
    },

    hasSpace (space, key) {
      const links = S.pathLinks(key)
      const path = S.pathDots([space, ...links])
      return S.has(this.storage, path)
    }
  }

  context.extend({ cache })
}
