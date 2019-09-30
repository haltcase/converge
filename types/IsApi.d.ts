import { GenericCollection, Primitive } from './util'

export interface IsApi {
  <T> (a: T, b: T): boolean
  arrayLike (value: unknown): value is ArrayLike<unknown>
  array (value: unknown): value is unknown[]
  boolean (value: unknown): value is boolean
  buffer (value: unknown): value is Buffer
  date (value: unknown): value is Date
  empty (value: unknown): boolean
  error (value: unknown): value is Error
  function (value: unknown): value is Function
  inRange (value: number, start: number, end?: number): boolean
  iterable (value: unknown): value is Iterable<unknown>
  map (value: unknown): value is Map<unknown, unknown>
  nan (value: unknown): boolean
  nil (value: unknown): value is null | void
  number (value: unknown): value is number
  numeric <T>(value: T): T extends number ? true : T extends string ? boolean : false
  object (value: any): value is object
  oneOf <T>(value: T, collection: GenericCollection<T>): boolean
  primitive (value: unknown): value is Primitive
  set (value: unknown): value is Set<unknown>
  string (value: unknown): value is string
  thenable (value: unknown): value is PromiseLike<unknown>
  type (value: unknown, type: string): boolean
}
