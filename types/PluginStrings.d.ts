import { Core } from '.'

export type PluginStrings =
  (core: Core) => undefined | Promise<unknown>
