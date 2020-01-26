import * as types from '@converge/types'

declare module '@converge/types' {
  interface CommandApi {
    getCooldown (command: string, subcommand: string): Promise<number>
    setCooldown (command: string, value: number, subcommand: string): Promise<unknown>
    startCooldown (command: string, user: string, subcommand: string): Promise<undefined>
    clearCooldown (command: string, user: string, subcommand: string): Promise<boolean>
    isOnCooldown (command: string, user: string, subcommand: string): Promise<boolean>
  }
}
