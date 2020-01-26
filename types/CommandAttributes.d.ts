export interface CommandAttributes {
  /**
   * Time (in seconds) a user must wait between uses of the command.
   */
  cooldown?: number

  /**
   * Name of the function that handles the command. This defaults to
   * the name of the command, but this is useful in cases where the
   * command's name is not a valid JavaScript identifier, i.e. `8ball`.
   */
  handler?: string

  /**
   * Permission level required for a user to use the command.
   */
  permission?: number

  /**
   * Amount of points deducted from a user for each use of the command.
   */
  price?: number

  /**
   * Whether or not the command is enabled or not (by default).
   */
  status?: boolean

  /**
   * Used as the response for custom commands. If this is not provided,
   * `handler` can also be used.
   */
  response?: string
}

export interface SubcommandAttributes {
  /**
   * Time (in seconds) a user must wait between uses of the subcommand.
   */
  cooldown?: number

  /**
   * Permission level required for a user to use the subcommand.
   */
  permission?: number

  /**
   * Amount of points deducted from a user for each use of the subcommand.
   */
  price?: number

  /**
   * Whether or not the subcommand is enabled or not (by default).
   */
  status?: boolean
}

export type CommandRegistry = Required<CommandAttributes> & {
  name: string
  caller: string
  subcommands: {
    [name: string]: SubcommandRegistry
  }
}

export type SubcommandRegistry = Required<SubcommandAttributes> & {
  name: string
  caller: string
  parent: string
}
