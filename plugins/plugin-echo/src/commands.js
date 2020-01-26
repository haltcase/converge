/**
 * echo - the bot will simply repeat whatever follows the command
 *
 * @source stock module
 * @author citycide
 */

/**
 * @typedef {import('@converge/types').Core} Core
 * @typedef {import('@converge/types').ChatEvent} ChatEvent
 */

/**
 * @command echo
 * @usage !echo [loudly|twice] (message)
 *
 * @param {Core} $
 * @param {ChatEvent} e
 */
export const echo = ($, e) => {
  if (!e.argString) return

  if (e.subcommand === 'twice') {
    return e.respond(`${e.subArgString} ${e.subArgString}`)
  }

  if (e.subcommand === 'loudly') {
    return e.respond(e.subArgString.toUpperCase())
  }

  e.respond(e.argString)
}

/**
 * Register the module & its commands with the core
 *
 * @param {Core} $
 */
export const setup = $ => {
  /**
   * $.addCommand
   * @param {string} name - what must be typed in chat to run the command
   * @param {object} [options] - override the defaults when registering the command
   *   @param {string} [options.handler] - name of the exported function that runs the command
   *   @param {number} [options.cooldown] - the default cooldown time for the command (seconds)
   *   @param {number} [options.permission] - the default permissions required to use the command
   *   @param {number} [options.price] - the default number of points paid to use the command
   *   @param {boolean} [options.status] - whether the command is enabled / disabled by default
   */

  $.addCommand('echo', { price: 2 })

  /**
   * $.addSubcommand
   * @param {string} name - what must be typed in chat following the parent command
   * @param {string} parent - the parent command
   * @param {object} [options] - same as the options for $.addCommand
   *
   * Pattern:
   * [command prefix][parent command] [subcommand] [...arguments]
   * Example:
   * !echo twice hello
   *
   * -> hello hello
   */

  $.addSubcommand('twice', 'echo', { cooldown: 10 })
  $.addSubcommand('loudly', 'echo', { cooldown: 10 })
}
