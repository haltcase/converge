/**
 * @typedef {import("@converge/types").Core} Core
 * @typedef {import("@converge/types").ChatEvent} ChatEvent
 * @typedef {import("@converge/types").PluginCommandHandler} PluginCommandHandler
 * @typedef {import("@converge/types").PluginSetup} PluginSetup
 */

import { formatDistanceToNow } from "date-fns"

/**
 * @param {Core} $
 * @param {ChatEvent} e
 * @param {"enable" | "disable" | "permission"} action
 */
const commandAction = async ($, e, action) => {
  const [commandSpec, value] = e.subArgs

  if ($.is.empty(commandSpec)) {
    return e.respond(await $.weave(`command.${action}-usage`))
  }

  if (action === "permission" && $.is.empty(value)) {
    return e.respond(await $.weave("command.permission-usage"))
  }

  const [command, subcommand] = commandSpec.split(".")

  if ($.command.exists(command, subcommand)) {
    switch (action) {
      case "enable":
        await $.command.enable(command, subcommand)
        break
      case "disable":
        await $.command.disable(command, subcommand)
        break
      case "permission":
        await $.command.setPermLevel(command, subcommand, value)
        break
    }

    return e.respond(await $.weave.core(`commands.${action}-success`, commandSpec))
  } else {
    return e.respond(await $.weave.core("commands.does-not-exist"))
  }
}

/**
 * @type {PluginCommandHandler}
 */
const commandAdd = async ($, e) => {
  if (e.subArgs.length < 2) {
    return e.respond(await $.weave("command.add-usage"))
  }

  const [name, ...value] = e.subArgs

  if ($.command.exists(name)) {
    return e.respond(await $.weave.core("commands.already-exists"))
  }

  await $.command.addCustom(name, value.join(" "))
  return e.respond(await $.weave.core("commands.add-success", name))
}

/**
 * @type {PluginCommandHandler}
 */
const commandRemove = async ($, e) => {
  const [name] = e.subArgs

  if ($.is.empty(name)) {
    return e.respond(await $.weave("command.remove-usage"))
  }

  if (!$.command.exists(name)) {
    return e.respond(await $.weave.core("commands.does-not-exist"))
  }

  if (!await $.command.isCustom(name)) {
    return e.respond(await $.weave.core("commands.is-plugin-command"))
  }

  await $.command.removeCustom(name)
  return e.respond(await $.weave.core("commands.remove-success", name))
}

/**
 * @type {PluginCommandHandler}
 */
const commandEdit = async ($, e) => {
  const [name, ...value] = e.subArgs

  if ($.is.empty(name) || value.length === 0) {
    return e.respond(await $.weave("command.edit-usage"))
  }

  if (!$.command.exists(name)) {
    return e.respond(await $.weave.core("commands.does-not-exist"))
  }

  if (!await $.command.isCustom(name)) {
    return e.respond(await $.weave.core("commands.is-plugin-command"))
  }

  await $.db.set(
    "commands",
    { name, module: "custom" },
    { response: value.join(" ") }
  )

  return e.respond(await $.weave.core("commands.edit-success", name))
}

/**
 * @type {PluginCommandHandler}
 */
export const command = async ($, e) => {
  if ($.is.oneOf(e.subcommand, ["enable", "disable", "permission"])) {
    return commandAction($, e, e.subcommand)
  }

  switch (e.subcommand) {
    case "add": return commandAdd($, e)
    case "remove": return commandRemove($, e)
    case "edit": return commandEdit($, e)
  }

  return e.respond(await $.weave("command.usage"))
}

/**
 * @type {PluginCommandHandler}
 */
export const whisperMode = async ($, e) => {
  if (e.subcommand === "enable") {
    await $.settings.set("whisperMode", true)
    return e.respond(await $.weave.core("settings.whisper-mode.enabled-success"))
  }

  if (e.subcommand === "disable") {
    await $.settings.set("whisperMode", false)
    return e.respond(await $.weave.core("settings.whisper-mode.disabled-success"))
  }

  const status = await $.settings.get("whisperMode")
    ? await $.weave.core("common-words.enabled")
    : await $.weave.core("common-words.disabled")

  return e.respond(await $.weave("whisper-mode.usage"), status)
}

/**
 * @type {PluginCommandHandler}
 */
export const lastSeen = async ($, e) => {
  const [target] = e.args

  if ($.is.empty(target)) {
    return e.respond(await $.weave("last-seen.usage"))
  }

  if (await $.user.existsByName(target)) {
    const timeAgo =
      formatDistanceToNow(await $.db.get("users.seen", { name: target }))

    return e.respond(await $.weave("last-seen.response", target, timeAgo))
  } else {
    return e.respond(await $.weave("last-seen.not-seen", target))
  }
}

/**
 * @type {PluginSetup}
 */
export const setup = async $ => {
  $.addCommand("command", {
    cooldown: 0,
    permission: 1
  })

  $.addSubcommand("enable", "command")
  $.addSubcommand("disable", "command")
  $.addSubcommand("permission", "command")
  $.addSubcommand("add", "command")
  $.addSubcommand("remove", "command")
  $.addSubcommand("edit", "command")

  $.addCommand("whisperMode", {
    cooldown: 0,
    permission: 0
  })

  $.addSubcommand("enable", "whispermode")
  $.addSubcommand("disable", "whispermode")

  $.addCommand("lastSeen")
}
