import { _ } from 'param.macro'

import stunsail from 'stunsail'

const isToMethod = stunsail.includes([
  'clamp',
  'range',
  'random',
  'defaults'
], _)

/**
 * @param {import('@converge/types/index').Core} context
 */
export default context => {
  const is = stunsail.isEqual
  const to = {}

  stunsail.each(Object.keys(stunsail), key => {
    const prefix = key.slice(0, 2)
    const token = key.slice(2) |> stunsail.camelCase

    if (prefix === 'is') {
      is[token] = stunsail[key]
      return
    }

    if (prefix === 'to') {
      to[token] = stunsail[key]
      return
    }

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
