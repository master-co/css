import {
  MASTER_CSS_DIAGNOSTIC_VERSION,
  type MasterCSSDiagnostic
} from '@master/css-schema'
import { resolve } from 'node:path'
import { findCSSManifestEntryFilesSync } from './entries'
import type {
  MasterCSSProjectCompileOptions,
  MasterCSSProjectDiscoveryOptions,
  MasterCSSProjectLoadOptions,
  MasterCSSProjectResult
} from './options'
import { loadBindingProjectManifest } from './binding-project'

export type {
  MasterCSSProjectCompileOptions,
  MasterCSSProjectDiscoveryOptions,
  MasterCSSProjectLoadOptions,
  MasterCSSProjectResult
} from './options'

function warningDiagnostic(message: string): MasterCSSDiagnostic {
  return Object.freeze({
    version: MASTER_CSS_DIAGNOSTIC_VERSION,
    code: 'PROJECT_WARNING',
    domain: 'project',
    severity: 'warning',
    message
  })
}

function assertStylesheetEntries(entries: readonly string[] | undefined) {
  for (const entry of entries ?? []) {
    if (!entry.replace(/[?#].*$/, '').endsWith('.css')) {
      throw new TypeError('Master CSS project entries must be CSS files.')
    }
  }
}

function immutableProjectResult(
  result: ReturnType<typeof loadBindingProjectManifest>,
  onDiagnostic: MasterCSSProjectLoadOptions['onDiagnostic']
): MasterCSSProjectResult {
  const diagnostics = Object.freeze(result.warnings.map(warningDiagnostic))
  for (const diagnostic of diagnostics) onDiagnostic?.(diagnostic)
  return Object.freeze({
    manifest: Object.freeze(result.manifest),
    entries: Object.freeze([...result.entries]),
    dependencies: Object.freeze([...result.dependencies]),
    diagnostics
  })
}

export function discoverManifestEntriesSync(
  options: Omit<MasterCSSProjectDiscoveryOptions, 'signal'> = {}
): readonly string[] {
  return Object.freeze(findCSSManifestEntryFilesSync(resolve(options.root ?? process.cwd())))
}

export function loadProjectManifestSync(
  options: Omit<MasterCSSProjectLoadOptions, 'signal'>
): MasterCSSProjectResult {
  assertStylesheetEntries(options.entries)
  return immutableProjectResult(loadBindingProjectManifest(
    resolve(options.root ?? process.cwd()),
    options.baseManifest,
    options.entries
  ), options.onDiagnostic)
}

export function compileProjectManifestSync(
  options: Omit<MasterCSSProjectCompileOptions, 'signal'>
): MasterCSSProjectResult {
  return loadProjectManifestSync(options)
}
