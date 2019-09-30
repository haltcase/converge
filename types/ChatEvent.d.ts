export interface ChatEvent {
  id: string
  sender: string
  mention: string
  mod: boolean
  seen: Date
  raw: string
  whispered: boolean
  command: string
  args: string[]
  subArgs: string[]
  subcommand: string | undefined
  argString: string
  subArgString: string
  isPrevented: boolean

  prevent (): void
  respond (message: string): void
}
