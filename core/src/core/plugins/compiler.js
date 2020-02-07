import { promises } from 'fs'
import { relative, resolve } from 'path'

import register from '@babel/register'
import FP from 'functional-promises'
import { count } from 'stunsail'

import isSubdirectory from '../util/is-subdirectory'
import { paths } from '../../constants'

import appConfig from '../../../../babel.config.js'

const pluginDir = resolve(paths.data, 'plugins')

appConfig.presets.push('@babel/typescript')

const getConfig = ({ compileIf }) => ({
  ...appConfig,
  ...{
    babelrc: false,
    comments: false,
    ignore: [],
    only: [
      // resolve(paths.data, 'plugins', 'node_modules', '*', '*.js')
      compileIf
    ],
    extensions: ['.ts', '.js', '.mjs']
  }
})

export const setupCompiler = async ({ localPlugins = [] }) => {
  const linkedLocations = await FP.resolve(localPlugins)
    .map(name => promises.realpath(resolve(pluginDir, 'node_modules', name)))
    .filter(dir => !isSubdirectory(pluginDir, dir))

  const compileIf = path => {
    if (linkedLocations.some(dir => isSubdirectory(path, dir))) return true
    if (!isSubdirectory(path, pluginDir)) return false

    // if we go more than a single `node_modules` deep, we've hit
    // transitive dependencies which should not be compiled
    const rel = relative(pluginDir, path)
    return count(rel, 'node_modules', 2) < 2
  }

  const config = getConfig({ compileIf })

  // override disabled modules
  // config.presets[0][1].modules = true
  // don't enable macros
  // config.plugins.splice(0, 1)

  register(config)
}
