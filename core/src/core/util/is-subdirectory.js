import { isAbsolute, normalize, relative } from "path"

/**
 * @param {string} path
 * @param {string} parent
 * @returns {boolean}
 */
export default (path, parent) => {
  const rel = relative(normalize(parent), normalize(path))
  return (
    !rel.startsWith("..") &&
    rel.length > 2 &&
    !isAbsolute(rel)
  )
}
