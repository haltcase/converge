import { ChatEvent } from "./ChatEvent"

export type ExtraTagObject = Record<string, unknown>

export type ExtraTags = ExtraTagObject | ExtraTagObject[]

export type Tag =
  | "age"
  | "cmdprefix"
  | "sender"
  | "@sender"
  | "random"
  | "count"
  | "pointname"
  | "pointsname"
  | "pointstr "
  | "price"
  | "#"
  | "uptime"
  | "followers"
  | "game"
  | "status"
  | "target"
  | "@target"
  | "echo"
  | "readfile "

export interface ParamsApi {
  (event: ChatEvent, text: string, tags?: Record<string, unknown>): Promise<string>
}
