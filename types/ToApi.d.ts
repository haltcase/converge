import { Falsy, IterableValue, MapKey, MapValue, Primitive } from './util'

export interface ToApi {
  array <T> (value: T[], begin?: number, end?: number): T[]
  boolean (value: true, smart?: boolean): true
  boolean (value: Falsy, smart?: boolean): false
  empty <T> (type: T[]): T[]
  empty <K extends string | number | symbol, V> (type: Record<K, V>): Record<K, V>
  empty <K, V> (type: Map<K, V>): Map<K, V>
  empty <T> (type: Set<T>): Set<T>
  empty <T = ''> (type: string): T
  empty (type: boolean): false
  empty (type: number): 0
  empty (type: null): null
  empty (type: undefined): undefined
  number (value: unknown, round?: boolean): number
  object <T extends Map<any, any>> (value: T): Record<MapKey<T>, MapValue<T>>
  object <T extends Iterable<any>> (value: T): Record<IterableValue<T>, IterableValue<T>>
  object <T extends Primitive> (value: T): Record<Extract<T, PropertyKey>, T>
  object <T extends Record<any, any>> (value: T): T
}
