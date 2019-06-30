import { resolve } from 'path'

import getPaths from 'env-paths'
import getPackageProps from 'npm-package-arg'

import { name as pkgName } from '../package.json'

export const name = getPackageProps(pkgName).scope.substring(1)

export const paths = getPaths(name, { suffix: '' })
paths.app = resolve(paths.data, '..')
paths.content = resolve(paths.data, 'content')
paths.logs = resolve(paths.data, 'logs')

export const pluginPackageKey = name
export const clientID = 'ejigh97i4w638sdoild5cvile1ajwim'
