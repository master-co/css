import path from 'node:path'
import type { Config } from '@master/css'
import type { MasterCSSPlan } from 'shared/master-css-plan'

export const VIRTUAL_CONFIG_ID = 'virtual:master-css-config'
export const MASTER_CSS_CONFIG_QUERY = '?master-css-config'
export const RESOLVED_MASTER_CSS_CONFIG_QUERY_PREFIX = '\0master-css-config:'
export const VIRTUAL_CONFIG_DIR = 'node_modules/.master-css'
export const VIRTUAL_CONFIG_FILE = 'master-css-config.js'
export const EMPTY_CONFIG_MODULE = 'export default {};'

export interface CSSConfigLoadResult<TConfig extends object = Config> {
    config: TConfig
    plan?: MasterCSSPlan
    dependencies: string[]
    classNames?: string[]
    nativeClassNames?: string[]
    nativeCSS?: string
    css?: string
    generatedCSS?: string
    warnings?: string[]
}

export type CSSConfigModuleResult<TConfig extends object = Config> = CSSConfigLoadResult<TConfig> & {
    code: string
}

export function isMasterCSSConfigRequest(id: string) {
    return id.endsWith(MASTER_CSS_CONFIG_QUERY)
}

export function stripMasterCSSConfigQuery(id: string) {
    return isMasterCSSConfigRequest(id)
        ? id.slice(0, -MASTER_CSS_CONFIG_QUERY.length)
        : id
}

export function stripResourceQuery(resourcePath: string) {
    return resourcePath.replace(/[?#].*$/, '')
}

export function toConfigModule(config: object) {
    return `export default ${JSON.stringify(config)};`
}

export function toConfigModuleResult<T extends CSSConfigLoadResult>(result: T): T & { code: string } {
    return {
        ...result,
        code: toConfigModule(result.config)
    }
}

export function toResolvedMasterCSSConfigId(file: string) {
    return RESOLVED_MASTER_CSS_CONFIG_QUERY_PREFIX + Buffer.from(file).toString('base64url')
}

export function fromResolvedMasterCSSConfigId(id: string) {
    return id.startsWith(RESOLVED_MASTER_CSS_CONFIG_QUERY_PREFIX)
        ? Buffer.from(id.slice(RESOLVED_MASTER_CSS_CONFIG_QUERY_PREFIX.length), 'base64url').toString()
        : undefined
}

function encodeVirtualFilename(id: string) {
    return Buffer.from(id).toString('base64url')
}

export function toVirtualDefaultConfigModulePath(context: string) {
    return path.join(context, VIRTUAL_CONFIG_DIR, VIRTUAL_CONFIG_FILE)
}

export function toVirtualCSSConfigModulePath(context: string, file: string) {
    return path.join(context, VIRTUAL_CONFIG_DIR, `${encodeVirtualFilename(file)}.js`)
}

function escapeRegExp(source: string) {
    return source.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export function createVirtualDefaultConfigModulePathPattern() {
    const source = [...VIRTUAL_CONFIG_DIR.split('/'), VIRTUAL_CONFIG_FILE]
        .map(escapeRegExp)
        .join(String.raw`[/\\]`)
    return new RegExp(String.raw`(?:^|[/\\])${source}$`)
}
