const { resolve, sep } = require('path')
const { find } = require('fs-jetpack')

const internalPath = resolve(__dirname, 'internal')

const slashRegex = /\\/g

const toDist = path =>
  resolve('dist', path.split(sep).slice(1).join(sep), '..')

const internalPlugins = find(internalPath, { matching: 'package.json' })
  .map(pkg => `'${toDist(pkg).replace(slashRegex, '\\\\')}'`)
  .join(',\n')

module.exports = `[${internalPlugins}]`
