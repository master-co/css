import type { MasterCSSManifestUtilityLayerName } from './master-css-manifest.js'
import type { UtilityType } from './utility-type.js'

export const MASTER_CSS_HYDRATION_MANIFEST_SCRIPT_ID = 'master-css-hydration-manifest'
export const MASTER_CSS_HYDRATION_MANIFEST_ATTR = 'data-master-css-hydration-manifest'
export const MASTER_CSS_HYDRATION_MANIFEST_ASSET_BASE = '/_master-css/hydration/'
export const MASTER_CSS_HYDRATION_MANIFEST_FILE_BASENAME = 'master-css-hydration'

export interface MasterCSSRulePriorityIR {
    features?: [string, number, number][]
    selector: number
}

export interface MasterCSSGeneratedRuleNodeIR {
    text: string
}

export interface MasterCSSGeneratedRuleIR {
    className: string
    key: string
    layer: MasterCSSManifestUtilityLayerName
    type: UtilityType
    sortTier: number
    priority: MasterCSSRulePriorityIR
    text: string
    nodes?: MasterCSSGeneratedRuleNodeIR[]
    selectorText?: string
    variableNames?: string[]
    animationNames?: string[]
}

export interface MasterCSSHydrationManifest {
    version: 1
    rules: MasterCSSGeneratedRuleIR[]
}

export function serializeMasterCSSHydrationManifest(hydrationManifest: MasterCSSHydrationManifest) {
    return JSON.stringify(hydrationManifest).replace(/</g, '\\u003c')
}

export function createMasterCSSHydrationManifestScript(hydrationManifest: MasterCSSHydrationManifest) {
    return `<script type="application/json" id="${MASTER_CSS_HYDRATION_MANIFEST_SCRIPT_ID}">${serializeMasterCSSHydrationManifest(hydrationManifest)}</script>`
}
