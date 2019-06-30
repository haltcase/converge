import { connect } from 'trilogy'
import { join } from 'path'
import { readAsync } from 'fs-jetpack'

import Core from './core'
import log from './logger'
import { paths } from './constants'

export default async options => {
  log.trace('starting up...')
  options.db = connect(join(paths.data, 'bot.db'))

  const config = await readAsync(options.configPath, 'json')
  return new Core(config, options)
}
