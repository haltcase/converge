import { it } from "param.macro"

/**
 * @param {import("@converge/types").Core} context
 */
export default async context => {
  await context.db.model("alias", { name: String, original: String })

  const addAlias = (name, original) => {
    const command = String(original).split(" ", 1)[0]
    if (context.command.exists(name)) return false
    if (!context.command.exists(command)) return false

    return context.db.create("alias", { name, original })
      .then(Boolean)
  }

  const removeAlias = name =>
    context.db.remove("alias", { name }).then(it === 1)

  const getAlias = name =>
    context.db.findOne("alias.original", { name })

  context.extend({
    command: {
      addAlias,
      removeAlias,
      getAlias
    }
  })
}
