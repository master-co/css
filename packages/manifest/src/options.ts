import type { CSSManifestLoadResult } from '@master/css-integration/manifest-module'
import type { MasterCSSManifest } from 'shared/master-css-manifest'

export interface LoadManifestOptions {
    baseManifest?: MasterCSSManifest
    classes?: string[]
    onWarning?: (warning: string) => void
}

export type LoadManifestResult = CSSManifestLoadResult

export interface LoadProjectManifestOptions extends LoadManifestOptions {
    entries?: string[]
}

export type LoadProjectManifestResult = LoadManifestResult & {
    entries: string[]
}
