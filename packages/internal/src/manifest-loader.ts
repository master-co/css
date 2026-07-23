import type { MasterCSSDiagnostic } from '@master/css-schema'
import type { MasterCSSManifest } from '@master/css-schema/manifest'
import { defaultBuildManifest } from './project'

export interface MasterCSSVirtualManifestLoadResult {
  readonly manifest: MasterCSSManifest
  readonly entries: readonly string[]
  readonly dependencies: readonly string[]
  readonly diagnostics: readonly MasterCSSDiagnostic[]
}

export interface MasterCSSVirtualManifestHost {
  readonly discoverManifestEntries: (options: {
    readonly root?: string
    readonly signal?: AbortSignal
  }) => Promise<readonly string[]>
  readonly collectStylesheetDependencies: (
    entry: string,
    options: { readonly root?: string }
  ) => readonly string[]
  readonly loadProjectManifest: (options: {
    readonly root?: string
    readonly entries: readonly string[]
    readonly baseManifest: MasterCSSManifest
    readonly signal?: AbortSignal
  }) => Promise<MasterCSSVirtualManifestLoadResult>
}

export interface MasterCSSVirtualManifestLoadOptions {
  readonly host: MasterCSSVirtualManifestHost
  readonly root?: string
  readonly entries?: readonly string[]
  readonly baseManifest?: MasterCSSManifest
  readonly signal?: AbortSignal
  readonly onDependency?: (dependency: string) => void
}

export async function loadMasterCSSVirtualManifest(
  options: MasterCSSVirtualManifestLoadOptions
): Promise<MasterCSSVirtualManifestLoadResult> {
  options.signal?.throwIfAborted()
  const entries = options.entries
    ?? await options.host.discoverManifestEntries({
      root: options.root,
      signal: options.signal
    })
  const dependencies = new Set<string>()
  const addDependency = (dependency: string) => {
    if (dependencies.has(dependency)) return
    dependencies.add(dependency)
    options.onDependency?.(dependency)
  }
  for (const entry of entries) {
    options.signal?.throwIfAborted()
    for (const dependency of options.host.collectStylesheetDependencies(entry, {
      root: options.root
    })) {
      addDependency(dependency)
    }
  }
  const result = await options.host.loadProjectManifest({
    root: options.root,
    entries,
    baseManifest: options.baseManifest ?? defaultBuildManifest,
    signal: options.signal
  })
  for (const dependency of result.dependencies) addDependency(dependency)
  return Object.freeze({
    ...result,
    entries: Object.freeze([...result.entries]),
    dependencies: Object.freeze([...dependencies])
  })
}
