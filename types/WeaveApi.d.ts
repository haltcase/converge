export interface WeaveApi {
  (key: string, ...replacements: readonly unknown[]): Promise<string>

  core (key: string, ...replacements: readonly unknown[]): Promise<string>
  set (key: string, template: string): boolean
  fork (toFile: string): undefined
}
