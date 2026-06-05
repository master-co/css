import path from 'node:path'
import { VIRTUAL_CONFIG_DIR } from './css-config-module.js'

export interface MasterCSSPreloaded {
    variables?: Record<string, number>
    animations?: Record<string, number>
}

export const VIRTUAL_PRELOADED_ID = 'virtual:master-css-preloaded'
export const VIRTUAL_PRELOADED_FILE = 'master-css-preloaded.js'
export const EMPTY_PRELOADED_MODULE = 'export default { variables: {}, animations: {} };'

export function normalizePreloaded(preloaded: MasterCSSPreloaded = {}): Required<MasterCSSPreloaded> {
    return {
        variables: preloaded.variables || {},
        animations: preloaded.animations || {}
    }
}

export function toPreloadedModule(preloaded: MasterCSSPreloaded) {
    return `export default ${JSON.stringify(normalizePreloaded(preloaded))};`
}

export function toVirtualPreloadedModulePath(context: string) {
    return path.join(context, VIRTUAL_CONFIG_DIR, VIRTUAL_PRELOADED_FILE)
}
