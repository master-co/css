import { VIRTUAL_MODULE_DIR } from '@master/css-internal/node'
import path from 'node:path'

export function isVirtualManifestModulePath(modulePath: string) {
  return modulePath.replace(/\\/g, '/').includes(`${VIRTUAL_MODULE_DIR}/`)
}

export function normalizePath(filePath: string) {
  return path.resolve(filePath).replace(/\\/g, '/')
}

export function hasModifiedFile(modifiedFiles: ReadonlySet<string> | undefined, filePath: string) {
  if (!modifiedFiles) return false
  const normalizedFilePath = normalizePath(filePath)
  for (const eachModifiedFile of modifiedFiles) {
    if (normalizePath(eachModifiedFile) === normalizedFilePath) return true
  }
  return false
}
