import { loadProjectManifest } from '@master/css-compiler/project'
import { findCSSManifestEntryFiles } from '@master/css-compiler/project/entries'
import { resolveMasterCSSWorkspacePackages } from '@master/css-compiler/project/workspace'
import type MasterCSSMCPContext from './context'
import { getErrorMessage } from './result'

export async function loadWorkspaceManifest(context: MasterCSSMCPContext) {
  try {
    const result = await loadProjectManifest(context.root)
    return {
      status: 'loaded' as const,
      manifest: result.manifest,
      entries: result.entries,
      dependencies: result.dependencies ?? [],
      warnings: result.warnings ?? []
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
    findCSSManifestEntryFiles(context.root).catch(() => [])
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
