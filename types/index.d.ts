import { Trilogy } from 'trilogy/dist/index'
import { ChatUser } from 'twitch-chat-client/lib/index'

import { Tock } from '~core/lib/tock'
import { EventEmitter } from 'events'

import { Bot } from './Bot'
export { Bot }

import { CacheApi } from './CacheApi'
export { CacheApi }

import { ChatEvent } from './ChatEvent'
export { ChatEvent }

import { CommandApi } from './CommandApi'
export { CommandApi }

import { CoreConfig } from './CoreConfig'
export { CoreConfig }

import { CoreOptions } from './CoreOptions'
export { CoreOptions }

import { DatabaseApi } from './DatabaseApi'
export { DatabaseApi }

import { FilesApi } from './FilesApi'
export { FilesApi }

import { IsApi } from './IsApi'
export { IsApi }

import { LogApi } from './LogApi'
export { LogApi }

import { ParamsApi } from './ParamsApi'
export { ParamsApi }

import { SleepApi } from './SleepApi'
export { SleepApi }

import { StreamApi } from './StreamApi'
export { StreamApi }

import { ToApi } from './ToApi'
export { ToApi }

import { UserApi } from './UserApi'
export { UserApi }

import { WeaveApi } from './WeaveApi'
export { WeaveApi }

export declare class Core extends EventEmitter {
  constructor (config: CoreConfig, options: CoreOptions)

  ownerName: string

  botName: string

  ownerId: string

  botId: string

  db: Trilogy & DatabaseApi

  command: CommandApi

  cache: CacheApi

  files: FilesApi

  log: LogApi

  params: ParamsApi

  stream: StreamApi

  tock: Tock

  user: UserApi

  weave: WeaveApi

  is: IsApi

  to: ToApi

  sleep: SleepApi

  addCommand (name: string, options?: CommandAttributes): this
  addSubcommand (name: string, parent: string, options?: CommandAttributes): this
  addCustomCommand (name: string, options?: CommandAttributes): this

  on (event: string | symbol, fn: (...args: any[]) => void, duplicates?: boolean): this

  extend <T extends Record<string, any>> (object: T): this & T

  callHook (name: string, ...args: any[]): void

  callHook (name: string, ...args: any[]): Promise<void>

  createChatEvent (message: string, userInfo: ChatUser, whispered: boolean): Promise<ChatEvent>

  runCommand (event: ChatEvent): boolean

  shutdown (): Promise<void>
}
