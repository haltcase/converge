export interface WeaveApi {
  (key: string, ...replacements: readonly unknown[]): string

  core (key: string, ...replacements: readonly unknown[]): string
  set (key: string, template: string): boolean
  fork (toFile: string): undefined
}
