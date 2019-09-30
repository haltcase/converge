export interface CacheApi {
  storage: {}
  get <T> (key: string, defaultValue: T): T
  set <T> (key: string, value: T): T
  push <T> (target: T[], value: T): T[]
  has(key: string): boolean
  getSpace <T> (space: string, key: string, defaultValue: T): T
  setSpace <T> (space: string, key: string, value: T): T
  pushSpace <T> (space: string, target: string, value: T): T[]
  hasSpace(space: string, key: string): boolean
}
