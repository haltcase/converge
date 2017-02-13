'use strict'

const isValidPath = require('is-valid-path')
const { read, writeAsync } = require('fs-jetpack')
const { includes, lowerCase } = require('lodash')
const { resolve } = require('path')

const log = require('./core/logger')
const startup = require('./startup')
const { paths } = require('./constants')

process.on('uncaughtException', console.error)
process.on('unhandledRejection', console.error)

module.exports = function initialize (options) {
  log.info('initializing...')
  options = Object.assign({ name: 'singularity-bot' }, options)

  let required = [
    'ownerName',
    'ownerAuth',
    'botName',
    'botAuth'
  ]

  // TODO: decide on a name for this thing
  let paths = getPaths(options.name, { suffix: '' })

  let defaultPath = resolve(paths.config, 'config.json')
  if (!isValidPath(options.configPath)) {
    options.configPath = defaultPath
  }

  let currentConfig = Object.assign({}, read(options.configPath, 'json'))

  if (options.skipPrompt) {
    return promptOrStart([], currentConfig, options)
  }

  let questions = getQuestions(required, currentConfig)
  return promptOrStart(questions, currentConfig, options)
}

function promptOrStart (questions, currentConfig, options) {
  if (!questions.length) {
    return startup(options)
  }

  if (!process.stdout.isTTY) {
    // being used programmatically, so there's no way to prompt

    throw new Error(
      `Invalid configuration for these properties: ` +
      `${questions.map(q => q.name).join(', ')}.\n` +
      `These need to be provided to the initialization function\n` +
      `when using the Node API, set manually in the config file,\n` +
      `or configured using the command line prompts.`
    )
  }

  // eslint-disable-next-line prefer-let/prefer-let
  const inquirer = require('inquirer')
  return inquirer.prompt(questions, currentConfig, options)
    .then(answers => {
      let newConfig = Object.assign({}, currentConfig, answers)
      return writeAsync(options.configPath, newConfig)
    })
    .then(() => startup(options))
}

function getQuestions (required, current) {
  return required
    .map(setting => {
      if (current[setting]) return false

      return {
        type: 'input',
        name: setting,
        message: `Enter the ${lowerCase(setting)}`,
        validate (value) {
          if (setting.slice(-4) === 'Auth') {
            // oauth token
            let validLengths = [36, 30]
            return includes(validLengths, value.length)
          } else {
            // username
            return /^(#)?[a-zA-Z0-9][\w]{2,24}$/.test(value)
          }
        }
      }
    })
    .filter(Boolean)
}
