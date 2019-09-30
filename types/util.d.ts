export type Falsy = false | '' | null | undefined | 0
export type Primitive = null | undefined | string | number | boolean | symbol;

export type GenericCollection <T> = string | T[] | Record<any, T> | Set<T> | Map<any, T>

export type MapKey <T> = T extends Map<infer K, any> ? K : never
export type MapValue <T> = T extends Map<any, infer V> ? V : never
export type IterableValue <T> = T extends Iterable<infer V> ? V : never
