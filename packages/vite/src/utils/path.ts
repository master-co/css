import { realpathSync } from 'node:fs'
import { basename, dirname, join, resolve } from 'node:path'

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
