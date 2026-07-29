import { createCompilerBindingSessionSync } from '@master/css-binding/compiler/node'
import type { CSSDirectiveExtractionPolicy } from '@master/css-schema/css-directives'
import type { MasterCSSManifest } from '@master/css-schema/manifest'
import {
  resolveCSSImportGraph,
  stripWindowsExtendedPathPrefix
} from '../node-compiler'
import { realpathSync } from 'node:fs'
import { join, relative, resolve, sep } from 'node:path'

interface BindingProjectSourceEntryPlan {
  entry: string
  include: string[]
  exclude: string[]
  files: string[]
}

interface BindingProjectManifestResult {
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
    entries: BindingProjectSourceEntryPlan[]
    files: string[]
  }
}

export function loadBindingProjectManifest(
  projectDir: string,
  baseManifest: MasterCSSManifest,
  entries?: readonly string[]
): BindingProjectManifestResult {
  const compiler = createCompilerBindingSessionSync()
  const root = resolve(projectDir)
  let realRoot = root
  try {
    realRoot = resolve(stripWindowsExtendedPathPrefix(realpathSync.native(root)))
  } catch {
    // The binding project layer reports unreadable project roots with its typed error.
  }
  const preservePath = (file: string) => {
    const absoluteFile = resolve(stripWindowsExtendedPathPrefix(file))
    return realRoot !== root
      && (absoluteFile === realRoot || absoluteFile.startsWith(`${realRoot}${sep}`))
      ? join(root, relative(realRoot, absoluteFile))
      : absoluteFile
  }
  const resolvedEntries = (entries ?? compiler.findManifestEntries(projectDir)).map(preservePath)
  const graphs = resolvedEntries.map((entry) => ({
    entry,
    ...resolveCSSImportGraph(entry, { projectDir })
  }))
  const result = compiler.loadPreparedProjectManifest(
    projectDir,
    baseManifest,
    graphs
  ) as BindingProjectManifestResult
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
