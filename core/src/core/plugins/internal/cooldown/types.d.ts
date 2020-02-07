import * as types from '@converge/types'

export type GlobalCooldown =
  Readonly<{ global: true }>

export type Scope =
  | { id: string }
  | { name: string }
  | GlobalCooldown

export type Cooldown = {
  command: string,
  subcommand: string,
  scope: Scope,
  until: number
}

export type State = Cooldown[]

declare module '@converge/types' {
  interface CommandApi {
    /**
     * Get the current cooldown setting for the given command/subcommand
     * as the time duration in seconds.
     */
    getCooldown (command: string, subcommand?: string): Promise<number>

    /**
     * Set the cooldown in seconds for the given command.
     */
    setCooldown (command: string, value: number): Promise<unknown>

    /**
     * Set the cooldown in seconds for the given command & subcommand.
     */
    setCooldown (command: string, subcommand: string, value: number): Promise<unknown>

    /**
     * Start a new cooldown for the given scope (i.e. user or globally) and
     * command/subcommand.
     */
    startCooldown (user?: Scope, command: string, subcommand?: string): Promise<undefined>

    /**
     * Clear an existing cooldown for the given scope (i.e. user or globally) and
     * command/subcommand.
     */
    clearCooldown (user?: Scope, command: string, subcommand?: string): Promise<boolean>

    /**
     * Get the number of seconds remaining for a cooldown of the given scope
     * (i.e. user or globally) and command/subcommand, or `0` if there is
     * no active cooldown.
     */
    getTimeRemaining (user?: Scope, command: string, subcommand?: string): Promise<number>

    /**
     * Return `true` if there is an active cooldown for the given scope
     * (i.e. user or globally) and command/subcommand, otherwise `false`.
     */
    isOnCooldown (user?: Scope, command: string, subcommand?: string): Promise<boolean>
  }
}
