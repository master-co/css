import type { MasterCSSManifest } from '@master/css-schema/manifest'
import { stringifyMasterCSSManifestJSON } from '@master/css-schema/manifest-json'
import { MANIFEST_ASSET_FILE, MANIFEST_MODULE_FILE } from './manifest-facade'

export type { MasterCSSManifest }

export const VIRTUAL_MANIFEST_ID = 'virtual:master-css-manifest'
export const MASTER_CSS_MANIFEST_QUERY = '?master-css-manifest'
export const VIRTUAL_MANIFEST_FILE = MANIFEST_MODULE_FILE
export const VIRTUAL_MANIFEST_ASSET_FILE = MANIFEST_ASSET_FILE
export const EMPTY_MANIFEST_JSON = '{"version":1}'

export interface CSSManifestLoadResult {
    manifest: MasterCSSManifest
    dependencies: string[]
    classNames?: string[]
    nativeClassNames?: string[]
    nativeCSS?: string
    css?: string
    generatedCSS?: string
    warnings?: string[]
}

export type CSSManifestJSONResult = CSSManifestLoadResult & {
    json: string
}

export function isMasterCSSManifestRequest(id: string) {
    return id.endsWith(MASTER_CSS_MANIFEST_QUERY)
}

export function stripMasterCSSManifestQuery(id: string) {
    return isMasterCSSManifestRequest(id)
        ? id.slice(0, -MASTER_CSS_MANIFEST_QUERY.length)
        : id
}

export function stripResourceQuery(resourcePath: string) {
    return resourcePath.replace(/[?#].*$/, '')
}

export function toManifestJSON(manifest: MasterCSSManifest) {
    return stringifyMasterCSSManifestJSON(manifest)
}

export function toManifestJSONResult<T extends CSSManifestLoadResult>(result: T): T & { json: string } {
    return {
        ...result,
        json: toManifestJSON(result.manifest)
    }
}
