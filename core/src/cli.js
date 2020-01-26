#!/usr/bin/env node

/* eslint-disable import/first */
require('wtfnode')

import { it } from 'param.macro'

import open from 'open'
import args from 'args'
import readline from 'readline'
import { includes } from 'stunsail'

import run from './entry'
import { name, paths } from './constants'

const flags = args
  .option('config', 'Path to configuration file, defaults to OS config directory.')
  .option(['f', 'log-file'], 'Control amount of log file output, defaults to \'error\'.', 'error')
  .option(['l', 'log-console'], 'Control amount of console output, defaults to \'info\'', 'info')
  .parse(process.argv, { name })

const options = {}

if (flags.c) options.configPath = flags.c
options.fileLevel = flags.f
options.consoleLevel = flags.l

let quitting = false

const quit = async ({ core, log }) => {
  if (quitting) return
  quitting = true
  log.info('closing terminal')
  core && await core.shutdown()
  process.exit(0)
}

run(options).then(({ core, log }) => {
  const promptWidth = Math.max(...log.getLevelNames().map(it.length))

  const term = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: 'bot > '.padEnd(promptWidth + 2)
  })

  // wrap logs to ensure the prompt stays at the bottom of the terminal
  log.on('pre:log', () => readline.cursorTo(process.stdout, 0))
  log.on('log', () => term.prompt(true))

  // TODO?: support running commands from terminal
  // TODO?: use unix-like command parsing (support arguments, flags, etc)
  term.on('line', line => {
    if (line.trim() === '') return term.prompt()
    const words = line.split(' ')
    switch (words[0]) {
      case 'quit':
        core.shutdown().then(term.close)
        break
      case 'say':
        // forward to chat as bot
        core.say(words.slice(1).join(' '))
        break
      case 'whisper':
        // whisper a user as bot
        core.whisper(words[1], words.slice(2).join(' '))
        break
      case 'open': {
        // open an app directory
        const choices = Object.keys(paths)
        if (includes(choices, words[1])) {
          open(paths[words[1]])
        } else {
          log.error(`\n\ninvalid option, choices: ${choices.join(', ')}`)
        }

        break
      }
      case 'status': {
        const { count } = core.user
        const s = count === 1 ? '' : 's'
        log.info(`Stream is ${core.stream.isLive ? 'online' : 'offline'}`)
        if (core.stream.isLive) {
          log.info(`Game  : ${core.stream.game}`)
          log.info(`Status: ${core.stream.status}`)
          log.info(`Uptime: ${core.stream.uptime}`)
        }
        log.info(`${count} user${s} in chat`)
        break
      }
      case 'plugin':
        switch (words[1]) {
          case 'install':
          case 'add':
            break
          case 'uninstall':
          case 'remove':
            break
        }
        break
      default:
        log.error(`\n\nnot sure how to handle '${line}'`)
    }

    term.prompt()
  })

  term.on('close', () => quit({ core, log }))
  core.on('shutdown', () => quit({ log }))
  core.on('ready', () => term.prompt())
}).catch(e => {
  console.error('\n', `error: ${e.message || e}`)
})
