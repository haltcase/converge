import { _, it } from 'param.macro'

import isValidPath from 'is-valid-path'
import { isOneOf, textCase } from 'stunsail'
import { read, writeAsync } from 'fs-jetpack'
import { resolve } from 'path'

import log from './logger'
import startup from './startup'
import { name, paths } from './constants'

const usernameRegex = /^(#)?[a-zA-Z0-9][\w]{2,24}$/

const errorHandler = (err, promise) => {
  // TODO: are the core exit hooks enough for graceful shutdown?
  log.error('unhandled error:', err)
  process.exit(1)
}

process.on('uncaughtException', errorHandler)
process.on('unhandledRejection', errorHandler)

const getQuestions = (required, current) =>
  required.map(setting => {
    if (current[setting]) return false

    return {
      type: 'input',
      name: setting,
      message: `Enter the ${textCase(setting)}`,
      validate (value) {
        if (setting.endsWith('Auth')) {
          // oauth token
          return value.length |> isOneOf(_, [36, 30])
        } else {
          // username
          return usernameRegex.test(value)
        }
      }
    }
  }).filter(Boolean)

const promptOrStart = async (questions, currentConfig, options) => {
  if (!questions.length) {
    return startup(options)
  }

  if (!process.stdout.isTTY) {
    // being used programmatically, so there's no way to prompt

    throw new Error(
      `Invalid configuration for these properties: ` +
      `${questions.map(it.name).join(', ')}.\n` +
      `These need to be provided to the initialization function\n` +
      `when using the Node API, set manually in the config file,\n` +
      `or configured using the command line prompts.`
    )
  }

  const inquirer = require('inquirer')
  const answers = await inquirer.prompt(questions, currentConfig, options)
  const newConfig = Object.assign({}, currentConfig, answers)
  await writeAsync(options.configPath, newConfig)
  return startup(options)
}

export default options => {
  options = Object.assign({ name }, options)

  if (!log.levels[options.fileLevel]) options.fileLevel = 'error'
  if (!log.levels[options.consoleLevel]) options.consoleLevel = 'info'

  log.setFileLevel(options.fileLevel)
  log.setConsoleLevel(options.consoleLevel)

  log.info('initializing...')

  const required = [
    'ownerName',
    'ownerAuth',
    'botName',
    'botAuth'
  ]

  const defaultPath = resolve(paths.config, 'config.json')
  if (!isValidPath(options.configPath)) {
    options.configPath = defaultPath
  }

  const currentConfig = Object.assign({}, read(options.configPath, 'json'))

  if (options.skipPrompt) {
    return promptOrStart([], currentConfig, options)
  }

  return getQuestions(required, currentConfig) |>
    promptOrStart(_, currentConfig, options)
      .then({ core: it, log })
}
