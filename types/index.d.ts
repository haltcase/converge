import { Trilogy } from 'trilogy'
import { ChatUser } from 'twitch-chat-client'

import { Tock } from '~core/lib/tock'
import { EventEmitter2 } from 'eventemitter2'

import { Bot } from './Bot'
export { Bot }

import { CacheApi } from './CacheApi'
export { CacheApi }

import { ChatEvent } from './ChatEvent'
export { ChatEvent }

import { CommandApi } from './CommandApi'
export { CommandApi }

import { CommandAttributes, CommandRegistry, SubcommandAttributes, SubcommandRegistry } from './CommandAttributes'
export { CommandAttributes, CommandRegistry, SubcommandAttributes, SubcommandRegistry }

import { CoreConfig } from './CoreConfig'
export { CoreConfig }

import { CoreOptions } from './CoreOptions'
export { CoreOptions }

import { DatabaseApi, TableSchema, TableSchemaDefault, TableSchemaKeyed } from './DatabaseApi'
export { DatabaseApi, TableSchema, TableSchemaDefault, TableSchemaKeyed }

export { Duration, DurationInstance, DurationOptions, LabelSet } from './Duration'

import { FileApi } from './FileApi'
export { FileApi }

import { IsApi } from './IsApi'
export { IsApi }

import { LogApi } from './LogApi'
export { LogApi }

import { ParamsApi } from './ParamsApi'
export { ParamsApi }

import { Plugin } from './Plugin'
export { Plugin }

import { HookListener, PluginLifecycle } from './PluginLifecycle'
export { HookListener, PluginLifecycle }

import { PluginCommandHandler, PluginSetup } from './PluginSetup'
export { PluginCommandHandler, PluginSetup }

import { PluginStrings } from './PluginStrings'
export { PluginStrings }

import { SleepApi } from './SleepApi'
export { SleepApi }

import { StartupOptions } from './StartupOptions'
export { StartupOptions }

import { StoreApi } from './StoreApi'
export { StoreApi }

import { StreamApi } from './StreamApi'
export { StreamApi }

import { ToApi } from './ToApi'
export { ToApi }

import { UserApi } from './UserApi'
export { UserApi }

import { WeaveApi } from './WeaveApi'
export { WeaveApi }

export declare class Core extends EventEmitter2 {
  constructor (config: CoreConfig, options: CoreOptions)

  /**
   * Username of the channel in which the bot will run.
   */
  ownerName: string

  /**
   * Username of the bot itself.
   */
  botName: string

  ownerId: string

  botId: string

  /**
   * API for permanent storage. Intended for configuration, tracking, etc.
   */
  db: Trilogy & DatabaseApi

  /**
   * Command management API for handling aliases, permissions, etc.
   */
  command: CommandApi

  /**
   * API for session-long storage, useful for simple state management.
   */
  cache: CacheApi

  /**
   * Functions for reading, writing, and checking for files.
   */
  file: FileApi

  /**
   * Logger with various levels, useful for debugging and record keeping.
   */
  log: LogApi

  /**
   * Provides variables for use in chat commands, such as usernames & steam data.
   */
  params: ParamsApi

  /**
   * State management API.
   */
  store: StoreApi

  /**
   * Exposes info about the stream such as live status, title, game, & uptime.
   */
  stream: StreamApi

  /**
   * Timer & interval API for managing by name and using human readable time durations.
   */
  tick: Tock

  /**
   * Provides an API for fetching info about users.
   */
  user: UserApi

  /**
   * String interpolation API for handling plugin messages.
   */
  weave: WeaveApi

  /**
   * Functional utilities for type and value checking.
   */
  is: IsApi

  /**
   * Functional utilities for converting or parsing data.
   */
  to: ToApi

  /**
   * Simple function for async delays.
   */
  sleep: SleepApi

  /**
   * Register a command implemented by a module with the bot core.
   * @param name
   * @param options
   */
  addCommand (name: string, options?: CommandAttributes): this

  /**
   * Register a subcommand implemented by a module with the bot core.
   * @param name
   * @param parent
   * @param options
   */
  addSubcommand (name: string, parent: string, options?: CommandAttributes): this

  /**
   * Register a simple command that doesn't need to be implemented by a module.
   * @param name
   * @param options
   */
  addCustomCommand (name: string, options?: CommandAttributes): this

  /**
   * Subscibe to a bot event and perform an action when it fires.
   * @param event
   * @param fn
   * @param duplicates
   */
  on (event: string | symbol, fn: (...args: unknown[]) => void, duplicates?: boolean): this

  /**
   * Add properties to the bot core, exposing them for use by other API consumers.
   * Existing properties of the same name are not overwritten.
   * @param object
   */
  extend <T extends Record<string, unknown>> (object: T): this & T

  /**
   * Call a bot hook in a "fire and forget" manner.
   * @param name
   * @param args
   */
  callHook (name: string, ...args: unknown[]): void

  /**
   * Call a bot hook and wait for every subscriber to that hook to finish.
   * @param name
   * @param args
   */
  callHookAndWait (name: string, ...args: unknown[]): Promise<void>

  createChatEvent (message?: string, userInfo?: ChatUser, whispered?: boolean): Promise<ChatEvent>

  /**
   * Run the command from the given chat event.
   * @param event
   */
  runCommand (event: ChatEvent): Promise<boolean>

  /**
   * Fire the `beforeShutdown` hook and begin the bot shutdown process.
   */
  shutdown (): Promise<void>
}
