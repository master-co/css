import { realpathSync } from 'node:fs'
import { basename, dirname, isAbsolute, join, relative, resolve } from 'node:path'

/** Identify a module by its root-relative ID, so the identity survives moving the project. */
export function toRootRelativeModuleId(root: string | undefined, id: string) {
  const prefix = id.startsWith('\0') ? '\0' : ''
  const path = id.slice(prefix.length)
  if (!root || !isAbsolute(path)) return id
  return prefix + relative(root, path).replace(/\\/g, '/')
}

export function normalizeFilePath(file: string) {
  let ancestor = resolve(file)
  const missing: string[] = []
  while (true) {
    try {
      return join(realpathSync.native(ancestor), ...missing).replace(/\\/g, '/')
    } catch {
      const parent = dirname(ancestor)
      if (parent === ancestor) return resolve(file).replace(/\\/g, '/')
      missing.unshift(basename(ancestor))
      ancestor = parent
    }
  }
}

export function includesFile(dependencies: string[], file: string) {
  const normalizedFile = normalizeFilePath(file)
  return dependencies.some((dependency) => normalizeFilePath(dependency) === normalizedFile)
}
