import { realpathSync } from 'node:fs'
import { extname, join, relative, resolve, sep } from 'node:path'
import {
  inspectCSS,
  resolveMasterCSSPackageEntryFile,
  stripRequestSuffix,
  stripWindowsExtendedPathPrefix
} from '../node-compiler'
import { createCompilerBindingSessionSync } from '@master/css-binding/compiler/node'

export function cleanCSSManifestRequest(id: string) {
  return stripRequestSuffix(id)
}

export function isCSSManifestRequest(id: string) {
  return extname(cleanCSSManifestRequest(id)) === '.css'
}

export { resolveMasterCSSPackageEntryFile }

export function hasMasterCSSManifestEntrypoint(source: string) {
  return inspectCSS(source).hasMasterEntry
}

export async function findCSSManifestEntryFiles(projectDir = process.cwd()) {
  return findCSSManifestEntryFilesSync(projectDir)
}

export function findCSSManifestEntryFilesSync(projectDir = process.cwd()) {
  const root = resolve(projectDir)
  let realRoot = root
  try {
    realRoot = resolve(stripWindowsExtendedPathPrefix(realpathSync.native(root)))
  } catch {
    // Let the native project layer report unreadable roots.
  }
  return createCompilerBindingSessionSync()
    .findManifestEntries(root)
    .map((entry) => {
      const absoluteEntry = resolve(stripWindowsExtendedPathPrefix(entry))
      return realRoot !== root
        && (absoluteEntry === realRoot || absoluteEntry.startsWith(`${realRoot}${sep}`))
        ? join(root, relative(realRoot, absoluteEntry))
        : absoluteEntry
    })
}
