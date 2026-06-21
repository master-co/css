import type { MasterCSSPreloaded } from '@master/css-engine'

export type { MasterCSSPreloaded }

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
