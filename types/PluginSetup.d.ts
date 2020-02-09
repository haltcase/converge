import { Core, ChatEvent } from "."
import { Store, Actions } from "@converge/state"

export type PluginSetup <
  T extends Record<string, unknown> = Record<string, unknown>,
  A extends Actions<T> = Actions<T>
> =
  (core: Core, store: Store<T, A>) => void | undefined | Promise<unknown>

export type PluginCommandHandler =
  (core: Core, event: ChatEvent) => unknown
