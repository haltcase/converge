#!/usr/bin/env node
'use strict'

const args = require('args')
const run = require('./entry')
const readline = require('readline')

const flags = args
  .option('config', 'Path to configuration file, defaults to OS config directory.')
  .parse(process.argv, { name: 'singularity' })

const options = {}

if (flags.config) options.configPath = flags.config

run(options).then(core => {
  let term = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: 'bot > '
  })

  term.on('line', line => {
    let words = line.split(' ')
    switch (words[0]) {
      case 'quit':
        core.shutdown()
        term.close()
        break
      case 'say':
        // forward to chat as bot
        console.log(words.slice(1).join(' '))
        break
      case 'whisper':
        // whisper a user as bot
        console.log(`to: ${words[1]}, msg: ${words.slice(2).join(' ')}`)
        break
      default:
        console.log(`not sure how to handle '${line}'`)
    }

    term.prompt()
  })

  term.on('close', () => quit(core))
  core.on('shutdown', quit)
  core.onAny((_, one, two) => {
    console.log(one.event)
  })

  core.on('ready', () => term.prompt())
}).catch(e => {
  console.error(`bot > error: ${e.message || e}`)
})

function quit (core) {
  console.log('closing terminal')
  if (core) core.shutdown()
  process.exit(0)
}

