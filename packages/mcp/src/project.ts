import { createHash } from 'node:crypto'
import { getToolingBindingInfo } from '@master/css-tooling/node'
import {
  discoverManifestEntries,
  loadProjectManifest
} from '@master/css-compiler/project'
import { resolveMasterCSSWorkspacePackages } from '@master/css-internal/workspace'
import defaultManifestJSON from '@master/css-preset/default-manifest.json' with { type: 'json' }
import type { MasterCSSManifest } from '@master/css-schema/manifest'
import type MasterCSSMCPContext from './context'
import { getErrorMessage } from './result'

const defaultManifest = defaultManifestJSON as unknown as MasterCSSManifest

export function manifestFingerprint(manifest: MasterCSSManifest) {
  return createHash('sha256').update(JSON.stringify(manifest)).digest('hex')
}

export type SemanticContext = 'project' | 'preset'

export async function loadWorkspaceManifest(context: MasterCSSMCPContext, requested: SemanticContext = 'project', explicitEntries?: readonly string[]) {
  let entries: readonly string[] = []
  let versions: ReturnType<typeof getToolingBindingInfo> | undefined
  try {
    versions = getToolingBindingInfo()
    if (requested === 'project') {
      entries = explicitEntries ?? await discoverManifestEntries({ root: context.root })
      if (!entries.length) return {
        status: 'error' as const, reason: 'entry-not-found' as const,
        entries, dependencies: [], warnings: [], diagnostics: [],
        context: requested, versions, fingerprint: null,
        error: 'No project CSS entry was found. Add a project entry or explicitly select context: "preset".'
      }
    }
    const result = requested === 'preset'
      ? { manifest: defaultManifest, entries: [], dependencies: [], diagnostics: [] }
      : await loadProjectManifest({ root: context.root, entries, baseManifest: { version: 1, languageVersion: 2 } })
    return {
      status: 'loaded' as const,
      context: requested, versions,
      fingerprint: manifestFingerprint(result.manifest),
      manifest: result.manifest,
      entries: result.entries,
      dependencies: result.dependencies ?? [],
      diagnostics: result.diagnostics,
      warnings: result.diagnostics.map((diagnostic) => diagnostic.message)
    }
  } catch (error) {
    return {
      status: 'error' as const, reason: 'entry-load-failed' as const,
      context: requested, versions, fingerprint: null,
      entries, dependencies: [] as string[], warnings: [] as string[],
      diagnostics: error && typeof error === 'object' && 'diagnostics' in error && Array.isArray(error.diagnostics)
        ? error.diagnostics : error && typeof error === 'object' && 'diagnostic' in error ? [error.diagnostic] : [],
      error: getErrorMessage(error)
    }
  }
}

export function requireWorkspaceManifest(result: Awaited<ReturnType<typeof loadWorkspaceManifest>>) {
  if (result.status === 'loaded') return result.manifest
  throw Object.assign(new Error(result.error), {
    code: result.reason === 'entry-not-found' ? 'PROJECT_ENTRY_NOT_FOUND' : 'PROJECT_MANIFEST_LOAD_FAILED',
    context: result.context,
    manifest: manifestMetadata(result),
    diagnostics: result.diagnostics
  })
}

export function manifestMetadata(result: Awaited<ReturnType<typeof loadWorkspaceManifest>>) {
  const { manifest: _manifest, ...metadata } = { manifest: undefined, ...result }
  return metadata
}

export async function getWorkspaceInfo(context: MasterCSSMCPContext) {
  const manifest = await loadWorkspaceManifest(context)
  return {
    root: context.root,
    roots: context.roots,
    packages: resolveMasterCSSWorkspacePackages(context.root),
    manifest: manifestMetadata(manifest)
  }
}
