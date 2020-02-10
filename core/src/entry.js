import { _, it } from "param.macro"

import isValidPath from "is-valid-path"
import { defaults, isOneOf, textCase } from "stunsail"
import { read, writeAsync } from "fs-jetpack"
import { resolve } from "path"
import TOML from "@iarna/toml"

import log from "./logger"
import startup from "./startup"
import { name, paths } from "./constants"

const usernameRegex = /^(#)?[a-zA-Z0-9][\w]{2,24}$/

const defaultConfig = {
  connections: {
    pubsub: {
      enabled: true
    },
    webhooks: {
      enabled: true,
      port: 8686
    }
  },
  redirectUri: "http://localhost:9339",
  scopes: [
    "user:read:broadcast",
    "user:edit:broadcast",
    "user:edit",
    "channel:read:subscriptions",
    "channel_editor",
    "channel_read",
    "chat:read",
    "chat:edit"
  ]
}

const errorHandler = (err, promise) => {
  // TODO: are the core exit hooks enough for graceful shutdown?
  log.error("unhandled error:", err)
  process.exit(1)
}

process.on("uncaughtException", errorHandler)
process.on("unhandledRejection", errorHandler)

const getQuestions = (required, current) =>
  required.map(setting => {
    if (current[setting]) return false

    return {
      type: "input",
      name: setting,
      message: `Enter the ${textCase(setting)}`,
      validate (value) {
        if (setting.endsWith("Auth")) {
          // oauth token
          return isOneOf(value.length, [36, 30])
        } else if (setting === "clientId") {
          return value.length === 31
        } else if (setting === "clientSecret") {
          return value.length === 30
        } else {
          // username
          return usernameRegex.test(value)
        }
      }
    }
  }).filter(Boolean)

const promptOrStart = async (questions, currentConfig, options) => {
  if (!questions.length) {
    return startup(currentConfig, options)
  }

  if (!process.stdout.isTTY) {
    // being used programmatically, so there's no way to prompt

    throw new Error(
      "Invalid configuration for these properties: " +
      `${questions.map(it.name).join(", ")}.\n` +
      "These need to be provided to the initialization function\n" +
      "when using the Node API, set manually in the config file,\n" +
      "or configured using the command line prompts."
    )
  }

  const inquirer = await import("inquirer")
  const answers = await inquirer.prompt(questions, currentConfig, options)
  const newConfig = { ...currentConfig, ...answers }
  await writeAsync(options.configPath, TOML.stringify(newConfig))
  return startup(newConfig, options)
}

/**
 * @typedef {Object} BotCliInstance
 * @property {import("@converge/types").Core} core
 * @property {import("logger-neue").LoggerNeue} log
 */

/**
 * @param {import("@converge/types").StartupOptions} options
 * @returns {Promise<BotCliInstance>}
 */
export default (options = {}) => {
  options = { name, ...options }

  if (!log.levels[options.fileLevel]) options.fileLevel = "error"
  if (!log.levels[options.consoleLevel]) options.consoleLevel = "info"

  log.setFileLevel(options.fileLevel)
  log.setConsoleLevel(options.consoleLevel)

  log.info("initializing...")

  const required = [
    "clientId",
    "clientSecret"
  ]

  const defaultPath = resolve(paths.config, "config.toml")
  if (!isValidPath(options.configPath)) {
    options.configPath = defaultPath
  }

  const currentConfig = defaults(
    TOML.parse(read(options.configPath) || ""),
    defaultConfig
  )

  if (options.skipPrompt) {
    return promptOrStart([], currentConfig, options)
  }

  return promptOrStart(
    getQuestions(required, currentConfig),
    currentConfig,
    options
  ).then({ core: it, log })
}
