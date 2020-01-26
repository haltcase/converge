import { Core, ChatEvent } from '.'
import { Store, Actions } from '@converge/state'

export type PluginSetup <
  T extends Record<string, any> = Record<string, any>,
  A extends Actions<T> = Actions<T>
> =
  (core: Core, store: Store<T, A>) => undefined | Promise<unknown>

export type PluginCommandHandler =
  (core: Core, event: ChatEvent) => any
