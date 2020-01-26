import { PluginLifecycle } from './PluginLifecycle'
import { PluginSetup } from './PluginSetup'
import { PluginStrings } from './PluginStrings'

export interface Plugin <T, A> {
  lifecycle?: PluginLifecycle<T, A>
  setup?: PluginSetup<T, A>
  strings?: PluginStrings
}
