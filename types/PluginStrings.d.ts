import { Core } from "."

export type PluginStrings =
  (core: Core) => void | undefined | Promise<unknown>
