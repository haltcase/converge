/**
 * rekt - responds with a random rekt-notrekt message
 *
 * @command rekt
 * @usage !rekt
 *
 * @source stock module
 * @author citycide
 */

export const rekt = async ($, e) => {
  if (!e.args.length) {
    const response = await $.db.getRandomRow('rekt')

    if (response) {
      e.respond(await $.params(e, response.value))
    } else {
      e.respond($.weave('not-found'))
    }

    return
  }

  if (e.subcommand === 'add') {
    if (!e.subArgs[0]) {
      return e.respond($.weave('add.usage'))
    }

    const res = await $.db.create('rekt', {
      value: `☐ Not rekt ☑ ${e.subArgString}`
    })

    if (res.id) {
      e.respond($.weave('add.success', res.id))
    } else {
      e.respond($.weave('add.failure'))
    }

    return
  }

  if (e.subcommand === 'remove') {
    if (!e.subArgs[0]) {
      return e.respond($.weave('remove.usage'))
    }

    if (!await $.db.exists('rekt', { id: e.subArgs[0] })) {
      return e.respond($.weave('not-found', e.subArgs[0]))
    }

    const id = parseInt(e.subArgs[0])
    if (await $.db.remove('rekt', { id })) {
      const count = $.db.count('rekt')
      e.respond($.weave('remove.success', count))
    } else {
      e.respond($.weave('remove.failure', id))
    }

    return
  }

  if (e.subcommand === 'edit') {
    if (!e.subArgs.length < 2) {
      return e.respond($.weave('edit.usage'))
    }

    if (!await $.db.exists('rekt', { id: e.subArgs[0] })) {
      return e.respond($.weave('not-found', e.subArgs[0]))
    }

    const id = parseInt(e.subArgs[0])
    const value = e.subArgs.slice(1).join(' ')

    if (await $.db.set('rekt.value', { id }, value)) {
      e.respond($.weave('edit.success', id))
    } else {
      e.respond($.weave('edit.failure', id))
    }
  }
}

const initResponses = async $ => {
  $.log('rekt', 'No rekt responses found, adding some defaults...')

  const defaults = [
    `☐ Not rekt ☑ REKT`,
    `☐ Not rekt ☑ Really Rekt`,
    `☐ Not rekt ☑ REKTangle`,
    `☐ Not rekt ☑ SHREKT`,
    `☐ Not rekt ☑ REKT-it Ralph`,
    `☐ Not rekt ☑ The Lord of the REKT`,
    `☐ Not rekt ☑ The Usual Susreks`,
    `☐ Not rekt ☑ North by NorthREKT`,
    `☐ Not rekt ☑ REKT to the Future`,
    `☐ Not rekt ☑ Once Upon a Time in the REKT`,
    `☐ Not rekt ☑ Full mast erektion`,
    `☐ Not rekt ☑ Rektum`,
    `☐ Not rekt ☑ Resurrekt`,
    `☐ Not rekt ☑ Correkt`,
    `☐ Not rekt ☑ Indirekt`,
    `☐ Not rekt ☑ Tyrannosaurus Rekt`,
    `☐ Not rekt ☑ Cash4Rekt.com`,
    `☐ Not rekt ☑ Grapes of Rekt`,
    `☐ Not rekt ☑ Ship Rekt`,
    `☐ Not rekt ☑ Rekt marks the spot`,
    `☐ Not rekt ☑ Caught rekt handed`,
    `☐ Not rekt ☑ The Rekt Side Story`,
    `☐ Not rekt ☑ Singin' In The Rekt`,
    `☐ Not rekt ☑ Painting The Roses Rekt`,
    `☐ Not rekt ☑ Rekt Van Winkle`,
    `☐ Not rekt ☑ Parks and Rekt`,
    `☐ Not rekt ☑ Lord of the Rekts: The Reking of the King`,
    `☐ Not rekt ☑ Star Trekt`,
    `☐ Not rekt ☑ The Rekt Prince of Bel-Air`,
    `☐ Not rekt ☑ Rektflix`,
    `☐ Not rekt ☑ Rekt it like it's hot`,
    `☐ Not rekt ☑ RektBox 360`,
    `☐ Not rekt ☑ The Rekt-men`,
    `☐ Not rekt ☑ School Of Rekt`,
    `☐ Not rekt ☑ I am Fire, I am Rekt`,
    `☐ Not rekt ☑ Rekt and Roll`,
    `☐ Not rekt ☑ Professor Rekt`,
    `☐ Not rekt ☑ Catcher in the Rekt`,
    `☐ Not rekt ☑ Rekt-22`,
    `☐ Not rekt ☑ Harry Potter and the Half-Rekt Prince`,
    `☐ Not rekt ☑ Rekt Paper Scissors`,
    `☐ Not rekt ☑ RektCraft`,
    `☐ Not rekt ☑ Grand Rekt Auto V`,
    `☐ Not rekt ☑ Rekt It Ralph`,
    `☐ Not rekt ☑ Left 4 Rekt`,
    `☐ Not rekt ☑ Pokemon: Fire Rekt`,
    `☐ Not rekt ☑ The Shawshank Rektemption`,
    `☐ Not rekt ☑ The Rektfather`,
    `☐ Not rekt ☑ The Rekt Knight`,
    `☐ Not rekt ☑ Fiddler on the Rekt`,
    `☐ Not rekt ☑ The Rekt Files`,
    `☐ Not rekt ☑ The Good, the Bad, and the Rekt`,
    `☐ Not rekt ☑ Forrekt Gump`,
    `☐ Not rekt ☑ The Green Rekt`,
    `☐ Not rekt ☑ Gladirekt`,
    `☐ Not rekt ☑ Terminator 2: Rektment Day`,
    `☐ Not rekt ☑ The Rekt Knight Rises`,
    `☐ Not rekt ☑ The Rekt King`,
    `☐ Not rekt ☑ Citizen Rekt`,
    `☐ Not rekt ☑ Requiem for a Rekt`,
    `☐ Not rekt ☑ Star Wars: Episode VI - Return of the Rekt`,
    `☐ Not rekt ☑ Braverekt`,
    `☐ Not rekt ☑ Batrekt Begins`,
    `☐ Not rekt ☑ 2001: A Rekt Odyssey`,
    `☐ Not rekt ☑ The Wolf of Rekt Street`,
    `☐ Not rekt ☑ Rekt's Labyrinth`,
    `☐ Not rekt ☑ 12 Years a Rekt`,
    `☐ Not rekt ☑ Finding Rekt`,
    `☐ Not rekt ☑ The Rekt Ultimatum`,
    `☐ Not rekt ☑ Rektium for a Dream`,
    `☐ Not rekt ☑ Erektile Dysfunction`
  ]

  await Promise.all(defaults.map(value => $.db.create('rekt', { value })))
  $.log('rekt', `Done. ${defaults.length} default rekt responses added.`)
}

export const setup = async $ => {
  $.addCommand('rekt', { cooldown: 60 })

  $.addSubcommand('add', 'rekt', { permission: 1 })
  $.addSubcommand('remove', 'rekt', { permission: 1 })
  $.addSubcommand('edit', 'rekt', { permission: 1 })

  await $.db.addTable('rekt', true)

  if (!await $.db.count('rekt')) initResponses($)
}
