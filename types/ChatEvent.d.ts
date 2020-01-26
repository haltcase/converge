export interface ChatEvent {
  /**
   * Twitch ID of the user that sent the message.
   */
  id: string

  /**
   * Twitch display name of the user that sent the message.
   */
  sender: string

  /**
   * Twitch login of the user that sent the message, prefixed by '@'
   * for mentioning the user.
   */
  mention: string

  /**
   * Whether or not the user is a moderator.
   */
  mod: boolean

  /**
   * Timestamp of message receipt.
   */
  seen: Date

  /**
   * The full message text.
   */
  raw: string

  /**
   * Whether or not the message was a whisper.
   */
  whispered: boolean

  /**
   * Name of the command triggered by this event, or empty string.
   */
  command: string

  /**
   * Argument list to the command, or empty array if no command is detected.
   */
  args: string[]

  /**
   * Convenience property for the arguments to a subcommand, or empty array
   * if no command is detected.
   */
  subArgs: string[]

  /**
   * Potential subcommand, although it's up to individual commands whether or
   * not this is treated as a subcommand.
   */
  subcommand: string

  /**
   * Substring of the message text, excluding the command.
   */
  argString: string

  /**
   * Substring of the message text, excluding the command and subcommand.
   */
  subArgString: string

  /**
   * Whether or not this event has been prevented.
   * @readonly
   */
  isPrevented: boolean

  /**
   * Prevent the command from this event from firing, if called in an
   * appropriate `before` hook.
   */
  prevent (): void

  /**
   * Respond to the message through chat or whisper, depending on how
   * the message was received and the bot's settings.
   * @param message
   */
  respond (message: string): void
}
