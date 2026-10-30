import type { MasterCSSDiagnostic } from '@master/css-schema'
import type { MasterCSSManifest } from '@master/css-schema/manifest'

export interface MasterCSSProjectDiscoveryOptions {
  readonly root?: string
  readonly signal?: AbortSignal
}

export interface MasterCSSProjectLoadOptions extends MasterCSSProjectDiscoveryOptions {
  readonly baseManifest: MasterCSSManifest
  readonly entries?: readonly string[]
  readonly onDiagnostic?: (diagnostic: MasterCSSDiagnostic) => void
  /** Reports each project CSS file before reading it, including missing imports/references. */
  readonly onDependency?: (file: string) => void
  /** Include authored source and import/reference edges for build-time inspection only. */
  readonly includeSourceGraph?: boolean
}

export interface MasterCSSProjectSourceGraph {
  readonly version: 1
  readonly files: readonly Readonly<{
    source: string
    content: string
    /** Both authored and real paths are inside the project root, outside node_modules. */
    projectOwned: boolean
  }>[]
  /** Definition reachability, including @reference; these edges do not imply CSS delivery. */
  readonly edges: readonly Readonly<{ from: string, specifier: string, resolved: string }>[]
}

export interface MasterCSSProjectCompileOptions extends MasterCSSProjectLoadOptions {
  readonly entries: readonly string[]
}

export interface MasterCSSProjectResult {
  /** Decoded native class registrations from the resolved CSS graph. */
  readonly nativeClassNames: readonly string[]
  readonly manifest: MasterCSSManifest
  readonly entries: readonly string[]
  readonly dependencies: readonly string[]
  readonly diagnostics: readonly MasterCSSDiagnostic[]
  readonly sourceGraph?: MasterCSSProjectSourceGraph
}
