import type { MasterCSSPlanUtilityLayerName } from './master-css-plan.js'
import type { UtilityType } from './utility-type.js'

export const MASTER_CSS_RUNTIME_MANIFEST_SCRIPT_ID = 'master-css-runtime-manifest'

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
    layer: MasterCSSPlanUtilityLayerName
    type: UtilityType
    sortTier: number
    priority: MasterCSSRulePriorityIR
    text: string
    nodes?: MasterCSSGeneratedRuleNodeIR[]
    selectorText?: string
    variableNames?: string[]
    animationNames?: string[]
}

export interface MasterCSSRuntimeManifest {
    version: 1
    rules: MasterCSSGeneratedRuleIR[]
}

export function serializeMasterCSSRuntimeManifest(manifest: MasterCSSRuntimeManifest) {
    return JSON.stringify(manifest).replace(/</g, '\\u003c')
}

export function createMasterCSSRuntimeManifestScript(manifest: MasterCSSRuntimeManifest) {
    return `<script type="application/json" id="${MASTER_CSS_RUNTIME_MANIFEST_SCRIPT_ID}">${serializeMasterCSSRuntimeManifest(manifest)}</script>`
}
