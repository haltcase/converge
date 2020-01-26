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
    await context.db.create('stats_commands', { name: e.command })
    await context.db.increment('stats_commands.uses', { name: e.command })
  })
}
