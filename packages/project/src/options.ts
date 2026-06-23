import type { CompileCSSManifestResult, CompileProjectManifestResult } from '@master/css-compiler'
import type { MasterCSSManifest } from '@master/css-schema/manifest'

export interface LoadManifestOptions {
    baseManifest?: MasterCSSManifest
    classes?: string[]
    onWarning?: (warning: string) => void
}

export type LoadManifestResult = CompileCSSManifestResult

export interface LoadProjectManifestOptions extends LoadManifestOptions {
    entries?: string[]
}

export type LoadProjectManifestResult = CompileProjectManifestResult
