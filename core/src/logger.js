import { join } from 'path'
import loggerNeue from 'logger-neue'

import { paths } from './constants'

/**
 * @type {import('@converge/types/index').LogApi}
 */
export default loggerNeue({
  file: {
    path: join(paths.log, 'app.log'),
    level: 'error'
  },
  console: {
    level: 'info',
    fullColor: true
  },
  levels: {
    /* eslint-disable key-spacing */
    error:  [0, ['red', 'bold', 'underline']],
    warn:   [1, 'yellow'],
    info:   [2, 'magenta'],
    debug:  [3, 'cyan'],
    trace:  [4],
    absurd: [5, 'gray']
    /* eslint-enable key-spacing */
  }
})
