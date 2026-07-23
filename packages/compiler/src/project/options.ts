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
}

export interface MasterCSSProjectCompileOptions extends MasterCSSProjectLoadOptions {
  readonly entries: readonly string[]
}

export interface MasterCSSProjectResult {
  readonly manifest: MasterCSSManifest
  readonly entries: readonly string[]
  readonly dependencies: readonly string[]
  readonly diagnostics: readonly MasterCSSDiagnostic[]
}
