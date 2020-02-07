import { CommandRegistry, SubcommandRegistry } from './CommandAttributes'

export interface CommandApi {
  /**
   * Create a command for `name` as an alias to `original`.
   */
  addAlias (name: string, original: string): Promise<boolean>

  /**
   * Remove an existing alias by name.
   */
  removeAlias (name: string): Promise<boolean>

  /**
   * Get the original command for which `name` is an alias.
   */
  getAlias (name: string): Promise<string>

  /**
   * Check whether the command `name` has been registered or not.
   * `subcommand` may also be supplied to check whether or not it
   * is registered as a subcommand to `name`.
   */
  exists (name: string, subcommand?: string): Promise<boolean>

  /**
   * Enable the given command/subcommand.
   */
  enable (name: string, subcommand?: string): Promise<void>

  /**
   * Disable the given command/subcommand.
   */
  disable (name: string, subcommand?: string): Promise<void>

  /**
   * Get the prefix defined in the bot's configuration, i.e. `!`.
   */
  getPrefix (): Promise<string>

  /**
   * Retrieve a property of a registered command, i.e. `price`.
   */
  getProperty <K extends keyof CommandRegistry> (
    name: string, property: K
  ): Promise<CommandRegistry[K] | undefined>

  /**
   * Retrieve a property of a registered subcommand, i.e. `price`.
   */
  getProperty <K extends keyof SubcommandRegistry> (
    name: string, subcommand: string, property: K
  ): Promise<SubcommandRegistry[K] | undefined>

  /**
   * Update the value of `property` for the given command.
   */
  setProperty <K extends keyof CommandRegistry> (
    name: string, property: K, value: CommandRegistry[K]
  ): Promise<void>

  /**
   * Update the value of `property` for the given subcommand.
   */
  setProperty <K extends keyof SubcommandRegistry> (
    name: string, subcommand: string, property: K, value: CommandRegistry[K]
  ): Promise<void>

  /**
   * Check if the given command/subcommand is enabled or disabled.
   */
  isEnabled (name: string, subcommand?: string): Promise<boolean>

  /**
   * Get the permission level of the given command/subcommand.
   */
  getPermLevel (name: string, subcommand?: string): Promise<number>
}
