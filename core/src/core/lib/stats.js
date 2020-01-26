/**
 * @typedef {import('@converge/types').Core} Core
 * @typedef {import('@converge/types').HookListener} HookListener
 */

/**
 * @param {Core} context
 */
export default async context => {
  await context.db.model('stats_commands', {
    name: { type: String, primary: true },
    uses: { type: Number, defaultTo: 0 }
  })

  context.on('afterCommand', /** @type {HookListener} */ async (_, e) => {
    context.db.increment('stats_commands.uses', { name: e.command })
  })
}
