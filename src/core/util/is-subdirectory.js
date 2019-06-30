import { isAbsolute, normalize, relative } from 'path'

export default (path, parent) => {
  const rel = relative(normalize(parent), normalize(path))
  return (
    !rel.startsWith('..') &&
    rel.length > 2 &&
    !isAbsolute(rel)
  )
}
