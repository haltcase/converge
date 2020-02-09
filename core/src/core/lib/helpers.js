import { _ } from "param.macro"

import * as stunsail from "stunsail"

import duration from "../util/duration"

const isToMethod = stunsail.includes([
  "clamp",
  "range",
  "random",
  "defaults"
], _)

/**
 * @param {import("@converge/types").Core} context
 */
export default context => {
  const is = stunsail.isEqual
  const to = {
    int: stunsail.toNumber(_, true),
    duration
  }

  stunsail.each(Object.keys(stunsail), key => {
    const prefix = key.slice(0, 2)
    const token = stunsail.camelCase(key.slice(2))

    if (prefix === "is") {
      is[token] = stunsail[key]
      return
    }

    if (prefix === "to") {
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
