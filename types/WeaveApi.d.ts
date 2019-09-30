export interface WeaveApi {
  (key: string, ...replacements: any[]): string

  core (key: string, ...replacements: any[]): string
  set (key: string, template: string): boolean
  fork (toFile: string): void
}
