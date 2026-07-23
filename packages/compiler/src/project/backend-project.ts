import { loadNativeCompilerBackend } from '@master/css-backend/compiler'
import type { CSSDirectiveExtractionPolicy } from '@master/css-schema/css-directives'
import type { MasterCSSManifest } from '@master/css-schema/manifest'
import { resolveCSSImportGraph } from '../node-compiler'
import { realpathSync } from 'node:fs'
import { join, relative, resolve, sep } from 'node:path'

interface BackendProjectSourceEntryPlan {
  entry: string
  include: string[]
  exclude: string[]
  files: string[]
}

interface BackendProjectManifestResult {
  entries: string[]
  manifest: MasterCSSManifest
  dependencies: string[]
  extractionPolicy: CSSDirectiveExtractionPolicy
  classNames: string[]
  nativeClassNames: string[]
  nativeCSS: string
  css: string
  generatedCSS: string
  warnings: string[]
  sourcePlan: {
    version: 1
    entries: BackendProjectSourceEntryPlan[]
    files: string[]
  }
}

export function loadBackendProjectManifest(
  projectDir: string,
  baseManifest: MasterCSSManifest,
  entries?: readonly string[]
): BackendProjectManifestResult {
  const compiler = loadNativeCompilerBackend({ required: true })!
  const root = resolve(projectDir)
  let realRoot = root
  try {
    realRoot = realpathSync.native(root)
  } catch {
    // The backend project layer reports unreadable project roots with its typed error.
  }
  const preservePath = (file: string) => realRoot !== root && (file === realRoot || file.startsWith(`${realRoot}${sep}`))
    ? join(root, relative(realRoot, file))
    : file
  const resolvedEntries = (entries ?? compiler.findManifestEntries(projectDir)).map(preservePath)
  const graphs = resolvedEntries.map((entry) => ({
    entry,
    ...resolveCSSImportGraph(entry, { projectDir })
  }))
  const result = compiler.loadPreparedProjectManifest(
    projectDir,
    baseManifest,
    graphs
  ) as BackendProjectManifestResult
  result.entries = result.entries.map(preservePath)
  result.dependencies = result.dependencies.map(preservePath)
  result.sourcePlan.files = result.sourcePlan.files.map(preservePath)
  result.sourcePlan.entries = result.sourcePlan.entries.map((entry) => ({
    ...entry,
    entry: preservePath(entry.entry),
    files: entry.files.map(preservePath)
  }))
  return result
}
