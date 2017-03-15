#!/usr/bin/env node
'use strict'

const opn = require('opn')
const args = require('args')
const readline = require('readline')
const isOneOf = require('stunsail/is-one-of')

const run = require('./entry')
const { paths } = require('./constants')

const flags = args
  .option('config', 'Path to configuration file, defaults to OS config directory.')
  .option(['f', 'log-file'], `Control amount of log file output, defaults to 'error'.`)
  .option(['l', 'log-console'], `Control amount of console output, defaults to 'error'`)
  .parse(process.argv, { name: 'singularity' })

const options = {}

if (flags.c) options.configPath = flags.c
if (flags.f) options.fileLevel = flags.f
if (flags.l) options.consoleLevel = flags.l

run(options).then(core => {
  let term = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: 'bot > '
  })

  term.on('line', line => {
    if (line.trim() === '') return term.prompt()
    let words = line.split(' ')
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
      case 'open':
        // open an app directory

        let choices = Object.keys(paths)
        if (isOneOf(choices, words[1])) {
          opn(paths[words[1]])
        } else {
          let choiceString = choices.join(', ')
          console.log('\n', `invalid option, choices: ${choiceString}`)
        }

        break
      default:
        console.log('\n', `not sure how to handle '${line}'`)
    }

    term.prompt()
  })

  term.on('close', () => quit(core))
  core.on('shutdown', () => quit())
  core.on('ready', () => term.prompt())
}).catch(e => {
  console.error('\n', `error: ${e.message || e}`)
})

function quit (core) {
  console.log('closing terminal')
  if (core) core.shutdown().then(() => process.exit(0))
  process.exit(0)
}

