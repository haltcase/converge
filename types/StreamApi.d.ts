export interface StreamApi {
  /**
   * Whether or not the stream is online.
   */
  isLive: boolean

  /**
   * Title of the game being played, or the empty string if the stream is offline.
   */
  game: string

  /**
   * Title of the active stream, or the empty string if the stream is offline.
   */
  status: string

  /**
   * Running duration of the active stream, or "offline" if the stream is offline.
   */
  uptime: string
}
