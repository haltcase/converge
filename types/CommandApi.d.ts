export interface CommandApi {
  addAlias (name: string, original: string): boolean
  removeAlias (name: string): boolean
  getAlias (name: string): string
  exists (name: string, subcommand?: string): boolean

  getPrefix (): Promise<string>
  getProperty <T> (): T
  setProperty <T> (): T
  isEnabled (name: string, subcommand?: string): boolean
  getPermLevel (name: string, subcommand?: string): number
}
