import { relative, resolve } from 'path'
import register from '@babel/register'

import isSubdirectory from '../util/is-subdirectory'
import { paths } from '../../constants'

import appConfig from '../../../../babel.config.js'

// TODO?: add to stunsail
const count = (str, search, maxOccurrences) => {
  let num = 0
  let pos = str.indexOf(search)

  while (pos !== -1 && num < maxOccurrences) {
    num++
    pos = str.indexOf(search, pos + 1)
  }

  return num
}

const pluginDir = resolve(paths.data, 'plugins')

const compileIf = path => {
  if (!isSubdirectory(path, pluginDir)) return false

  // if we go more than a single `node_modules` deep, we've hit
  // transitive dependencies which should not be compiled
  const rel = relative(pluginDir, path)
  return count(rel, 'node_modules', 2) < 2
}

const config = {
  ...appConfig,
  ...{
    babelrc: false,
    comments: false,
    ignore: [],
    only: [
      // resolve(paths.data, 'plugins', 'node_modules', '*', '*.js')
      compileIf
    ]
  }
}

// override disabled modules
// config.presets[0][1].modules = true
// don't enable macros
// config.plugins.splice(0, 1)

register(config)
