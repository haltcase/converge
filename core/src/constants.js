import getPkg from 'pkg.macro'

import { resolve } from 'path'

import getPaths from 'env-paths'
import getPackageProps from 'npm-package-arg'

const pkg = getPkg(['name', 'version'])

export const name = getPackageProps(pkg.name).scope.substring(1)

/**
 * @type {string}
 */
export const version = pkg.version

/**
 * @typedef {Object} Paths
 * @property {string} app
 * @property {string} cache
 * @property {string} config
 * @property {string} content
 * @property {string} data
 * @property {string} log
 * @property {string} logs
 * @property {string} temp
 */

/**
 * @type {Paths}
 */
export const paths = getPaths(name, { suffix: '' })
paths.app = resolve(paths.data, '..')
paths.content = resolve(paths.data, 'content')
paths.logs = resolve(paths.data, 'logs')

export const pluginPackageKey = name
