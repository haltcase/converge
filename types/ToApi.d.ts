import * as S from 'stunsail'

import { Duration } from './Duration'

export interface ToApi {
  array: typeof S.toArray
  boolean: typeof S.toBoolean

  /**
   * Convert a time duration in milliseconds to a human readable string.
   */
  duration: Duration
  empty: typeof S.toEmpty
  int (value: unknown): number
  number: typeof S.toNumber
  random: typeof S.random
  object: typeof S.toObject
  objectWith: typeof S.toObjectWith
}
