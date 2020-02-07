import * as S from 'stunsail'

export interface ToApi {
  array: typeof S.toArray
  boolean: typeof S.toBoolean
  empty: typeof S.toEmpty
  int (value: unknown): number
  number: typeof S.toNumber
  random: typeof S.random
  object: typeof S.toObject
  objectWith: typeof S.toObjectWith
}
