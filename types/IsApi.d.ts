import * as S from "stunsail"

export interface IsApi extends S.isEqual {
  // <T> (a: T, b: T): boolean
  arrayLike: typeof S.isArrayLike
  array: typeof S.isArray
  boolean: typeof S.isBoolean
  buffer: typeof S.isBuffer
  date: typeof S.isDate
  empty: typeof S.isEmpty
  error: typeof S.isError
  function: typeof S.isFunction
  iterable: typeof S.isIterable
  map: typeof S.isMap
  nan: typeof S.isNan
  nil: typeof S.isNil
  number: typeof S.isNumber
  numeric: typeof S.isNumeric
  object: typeof S.isObject
  primitive: typeof S.isPrimitive
  set: typeof S.isSet
  string: typeof S.isString
  thenable: typeof S.isThenable
  inRange: typeof S.isInRange
  type: typeof S.isType
  oneOf: typeof S.isOneOf
}
