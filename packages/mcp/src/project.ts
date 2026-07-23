import {
  discoverManifestEntries,
  loadProjectManifest
} from '@master/css-compiler/project'
import { resolveMasterCSSWorkspacePackages } from '@master/css-build-internal/workspace'
import defaultManifestJSON from '@master/css-preset/default-manifest.json' with { type: 'json' }
import type { MasterCSSManifest } from '@master/css-schema/manifest'
import type MasterCSSMCPContext from './context'
import { getErrorMessage } from './result'

const defaultManifest = defaultManifestJSON as unknown as MasterCSSManifest

export async function loadWorkspaceManifest(context: MasterCSSMCPContext) {
  try {
    const result = await loadProjectManifest({
      root: context.root,
      baseManifest: defaultManifest
    })
    return {
      status: 'loaded' as const,
      manifest: result.manifest,
      entries: result.entries,
      dependencies: result.dependencies ?? [],
      warnings: result.diagnostics.map((diagnostic) => diagnostic.message)
    }
  } catch (error) {
    return {
      status: 'error' as const,
      entries: [] as string[],
      dependencies: [] as string[],
      warnings: [] as string[],
      error: getErrorMessage(error)
    }
  }
}

export async function getWorkspaceInfo(context: MasterCSSMCPContext) {
  const [manifest, entries] = await Promise.all([
    loadWorkspaceManifest(context),
    discoverManifestEntries({ root: context.root }).catch(() => [])
  ])
  return {
    root: context.root,
    roots: context.roots,
    packages: resolveMasterCSSWorkspacePackages(context.root),
    manifest: {
      status: manifest.status,
      entries: manifest.status === 'loaded' ? manifest.entries : entries,
      dependencies: manifest.dependencies,
      warnings: manifest.warnings,
      ...(manifest.status === 'error' ? { error: manifest.error } : {})
    }
  }
}
