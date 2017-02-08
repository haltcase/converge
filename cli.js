#!/usr/bin/env node
'use strict'

const args = require('args')
const run = require('./entry')

const flags = args
  .option('config', 'Path to configuration file, defaults to OS config directory.')
  .parse(process.argv, { name: 'singularity' })

const options = {}

if (flags.config) options.configPath = flags.config

run(options)
