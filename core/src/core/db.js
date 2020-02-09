import FP from "functional-promises"

import log from "../logger"

/**
 * @param {import("@converge/types").Core} context
 */
export default async (context, db) => {
  log.trace("preparing database")

  const data = db

  data.addTable = (name, keyed = false) => {
    const keyType = keyed
      ? { type: "increments" }
      : { type: String, primary: true }

    return db.model(name, {
      key: keyType,
      value: String,
      info: String
    })
  }

  data.addTableCustom = (name, schema) => {
    return db.model(name, schema)
  }

  data.getConfig = (key, defaultValue) => {
    return db.get("settings.value", { key }, defaultValue)
  }

  data.setConfig = (key, value) => {
    return db.updateOrCreate("settings", { key }, { value })
  }

  data.confirmConfig = (key, value) => {
    return db.findOrCreate("settings", { key }, { value })
  }

  data.getPluginConfig = async (pluginAndKey, defaultValue) => {
    const [plugin, key] = pluginAndKey.split(".", 2)
    if (!plugin || !key) {
      throw new Error("invalid database identifier")
    }

    return db.get("plugin_settings.value", { key, plugin }, defaultValue)
  }

  data.setPluginConfig = async (pluginAndKey, value) => {
    const [plugin, key] = pluginAndKey.split(".", 2)
    if (!plugin || !key || typeof value === "undefined") {
      throw new Error("invalid database identifier")
    }

    return db.updateOrCreate("plugin_settings", { key, plugin }, { value })
  }

  data.getRandomRow = (table, where = {}) => {
    return db.findOne(table, where, { random: true })
  }

  data.exists = (...args) => {
    return db.findOne(...args).then(Boolean)
  }

  context.extend({ db: data })

  await FP.all([
    db.model("settings", {
      key: { type: String, primary: true },
      value: String,
      info: String
    }),
    db.model("users", {
      id: { type: Number, primary: true },
      name: { type: String, unique: true },
      mod: { type: Boolean, defaultTo: false },
      seen: Date
    }),
    db.model("usertypes", {
      id: { type: Number, primary: true },
      name: { type: String, unique: true },
      admin: { type: Boolean, defaultTo: false },
      mod: { type: Boolean, defaultTo: false }
    }),
    db.model("plugin_settings", {
      plugin: String,
      key: String,
      value: String,
      info: String
    }, {
      primary: ["plugin", "key"]
    })
  ]).catch(e => {
    log.error(e)
    return context.shutdown()
  })

  return data
}
