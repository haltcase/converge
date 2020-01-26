export interface CacheApi {
  /**
   * @private
   */
  storage: {}

  /**
   * Retrieve the value for the given key, scoped to callsite.
   * For example, two plugins can store the same key and each
   * one will automatically select the correct value.
   * @param key
   * @param defaultValue
   */
  get <T> (key: string, defaultValue: T): T

  /**
   * Set the value for the given key, scoped to callsite.
   * For example, two plugins can store the same key and each
   * one will automatically select the correct value.
   * @param key
   * @param value
   */
  set <T> (key: string, value: T): T

  /**
   * Add `value` to the array designated by `target`, scoped to callsite.
   * For example, two plugins can store the same key and each
   * one will automatically select the correct value.
   * @param target
   * @param value
   */
  push <T> (target: string, value: T): T[]

  /**
   * Check whether `key` exists, scoped to callsite.
   * For example, two plugins can store the same key and each
   * one will automatically select the correct value.
   * @param key
   */
  has (key: string): boolean

  /**
   * Works the same as `get`, but allows operating on any scope.
   * @param scope
   * @param key
   * @param defaultValue
   */
  getScoped <T> (scope: string, key: string, defaultValue: T): T

  /**
   * Works the same as `set`, but allows operating on any scope.
   * @param scope
   * @param key
   * @param defaultValue
   */
  setScoped <T> (scope: string, key: string, value: T): T

  /**
   * Works the same as `push`, but allows operating on any scope.
   * @param scope
   * @param key
   * @param defaultValue
   */
  pushScoped <T> (scope: string, target: string, value: T): T[]

  /**
   * Works the same as `has`, but allows operating on any scope.
   * @param scope
   * @param key
   * @param defaultValue
   */
  hasScoped (scope: string, key: string): boolean
}
