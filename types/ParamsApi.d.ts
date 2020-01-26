import { ChatEvent } from './ChatEvent'

export interface ParamsApi {
  (event: ChatEvent, text: string, tags?: Record<string, unknown>): Promise<string>
}
