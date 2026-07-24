import {
  MASTER_CSS_DIAGNOSTIC_VERSION,
  type MasterCSSDiagnostic
} from '@master/css-schema'
import { resolve } from 'node:path'
import { findCSSManifestEntryFilesSync } from './entries'
import {
  type MasterCSSProjectCompileOptions,
  type MasterCSSProjectDiscoveryOptions,
  type MasterCSSProjectLoadOptions,
  type MasterCSSProjectResult
} from './options'
import { loadBindingProjectManifest } from './binding-project'

export type {
  MasterCSSProjectCompileOptions,
  MasterCSSProjectDiscoveryOptions,
  MasterCSSProjectLoadOptions,
  MasterCSSProjectResult
} from './options'

function throwIfAborted(signal: AbortSignal | undefined) {
  signal?.throwIfAborted()
}

function assertStylesheetEntries(entries: readonly string[] | undefined) {
  for (const entry of entries ?? []) {
    if (!entry.replace(/[?#].*$/, '').endsWith('.css')) {
      throw new TypeError('Master CSS project entries must be CSS files.')
    }
  }
}

function warningDiagnostic(message: string): MasterCSSDiagnostic {
  return Object.freeze({
    version: MASTER_CSS_DIAGNOSTIC_VERSION,
    code: 'PROJECT_WARNING',
    domain: 'project',
    severity: 'warning',
    message
  })
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

export async function discoverManifestEntries(
  options: MasterCSSProjectDiscoveryOptions = {}
): Promise<readonly string[]> {
  throwIfAborted(options.signal)
  const entries = findCSSManifestEntryFilesSync(resolve(options.root ?? process.cwd()))
  throwIfAborted(options.signal)
  return Object.freeze(entries)
}

export async function loadProjectManifest(
  options: MasterCSSProjectLoadOptions
): Promise<MasterCSSProjectResult> {
  throwIfAborted(options.signal)
  assertStylesheetEntries(options.entries)
  const result = loadBindingProjectManifest(
    resolve(options.root ?? process.cwd()),
    options.baseManifest,
    options.entries
  )
  throwIfAborted(options.signal)
  return immutableProjectResult(result, options.onDiagnostic)
}

export async function compileProjectManifest(
  options: MasterCSSProjectCompileOptions
): Promise<MasterCSSProjectResult> {
  return loadProjectManifest(options)
}
