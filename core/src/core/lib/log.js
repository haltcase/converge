import { _ } from 'param.macro'

import { EOL } from 'os'
import { parse, join } from 'path'
import { appendAsync } from 'fs-jetpack'
import { format } from 'date-fns'

import log from '../../logger'
import { paths } from '../../constants'

/**
 * @param {import('@converge/types/index').Core} context
 */
export default async context => {
  const writeLog = (source, data, channel = '') => {
    const filePath = source
      |> parse(_).name + '.txt'
      |> join(paths.logs, channel, _)

    const timestamp = format(Date.now(), 'yyyy-MM-dd HH:mm:ss aaaa')
    const line = `${timestamp} :: ${data}${EOL}`
    return appendAsync(filePath, line)
  }

  const botLog = (source, ...args) => {
    if (args.length < 1) return
    log.info(...args)
    writeLog(source, args[0])
  }

  for (const level of log.getLevelNames()) {
    botLog[level] = (source, ...args) => {
      if (args.length < 1) return
      log[level](...args)
      writeLog(source, args[0], level)
    }
  }

  context.extend({
    log: botLog
  })
}
