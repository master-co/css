import MasterCSS from './core'
import createCSS from './create'
import parseAt from './utils/parse-at'
import generateAt from './utils/generate-at'
import parseSelector from './utils/parse-selector'
import generateSelector from './utils/generate-selector'
import compareRulePriority from './utils/compare-rule-priority'
import type { Utility } from './utility'
import type { MasterCSSManifest } from 'shared/master-css-manifest'
import type { MasterCSSEmittedGlobals } from './emitted-globals'
import type { MasterCSSOptions } from './core'

export { MasterCSS, createCSS, compareRulePriority, generateAt, generateSelector, parseAt, parseSelector }
export type { Utility as GeneratedRule }
export type * from 'shared/master-css-manifest'

export function createCompilerCSS(manifest: MasterCSSManifest, emittedGlobals?: MasterCSSEmittedGlobals, options?: MasterCSSOptions) {
    return createCSS(manifest, emittedGlobals, options)
}

export function expandClassName(manifest: MasterCSSManifest, className: string, mode?: string) {
    return createCompilerCSS(manifest).createAll(className, undefined, mode)
}

export function inspectGeneratedRule(rule: Utility) {
    return {
        className: rule.name,
        key: rule.key,
        layer: rule.layerName,
        explicitLayer: rule.explicitLayerName,
        selector: rule.selectorText,
        declarations: rule.declarations,
        declarationRules: rule.declarationRules,
        atRules: rule.atRules,
        priority: rule.priority,
        variableNames: rule.variableNames ? [...rule.variableNames] : [],
        animationNames: rule.animationNames ? [...rule.animationNames] : []
    }
}
