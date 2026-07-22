import { loadNativeBinding } from '@master/css-native'
import type { MasterCSSManifest } from '@master/css-schema/manifest'
import { stringifyMasterCSSManifestJSON } from '@master/css-schema/manifest-json'
import { resolveCSSImportGraph } from '@master/css-compiler'
import { realpathSync } from 'node:fs'
import { join, relative, resolve, sep } from 'node:path'
import type { LoadProjectManifestResult } from './options'

type ProjectBinding = {
  loadProjectManifestJson(
    projectDir: string,
    baseManifestJSON: string,
    entries?: string[]
  ): string
  loadProjectManifestPreparedJson(
    projectDir: string,
    baseManifestJSON: string,
    graphsJSON: string
  ): string
  findCssManifestEntries(projectDir: string): string[]
}

export function loadRustProjectManifest(
  projectDir: string,
  baseManifest: MasterCSSManifest,
  entries?: string[]
): LoadProjectManifestResult {
  const binding = loadNativeBinding({ required: true })!.binding as unknown as ProjectBinding
  const root = resolve(projectDir)
  let realRoot = root
  try {
    realRoot = realpathSync.native(root)
  } catch {
    // The Rust project layer reports unreadable project roots with its typed error.
  }
  const preservePath = (file: string) => realRoot !== root && (file === realRoot || file.startsWith(`${realRoot}${sep}`))
    ? join(root, relative(realRoot, file))
    : file
  const resolvedEntries = (entries ?? binding.findCssManifestEntries(projectDir)).map(preservePath)
  const graphs = resolvedEntries.map((entry) => ({
    entry,
    ...resolveCSSImportGraph(entry, { projectDir })
  }))
  const result = JSON.parse(binding.loadProjectManifestPreparedJson(
    projectDir,
    stringifyMasterCSSManifestJSON(baseManifest),
    JSON.stringify(graphs)
  )) as LoadProjectManifestResult
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
