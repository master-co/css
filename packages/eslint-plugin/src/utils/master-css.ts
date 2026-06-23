import { compareRulePriority, type MasterCSS, type MasterCSSManifest } from '@master/css'
import { createCSSWithNativeDeclarations } from '@master/css-validator'
import { createRequire } from 'node:module'
import UtilityType from '@master/css-schema/utility-type'

export type { MasterCSS, MasterCSSManifest }
const require = createRequire(import.meta.url)
const defaultManifest = require('@master/css-preset/default-manifest.json') as MasterCSSManifest
export { createCSSWithNativeDeclarations, defaultManifest }

export const CLASS_ATTRIBUTES = ['class', 'className']
export const CLASS_DECLARATIONS: string[] = []
export const CLASS_FUNCTIONS = ['clsx', 'cva', 'ctl', 'cv', 'class', 'classnames', 'classVariant', 'styled(?:\\s+)?(?:\\.\\w+)?', 'classList(?:\\s+)?\\.(?:add|remove|toggle|replace)']

const LAYER_ORDER = ['theme', 'base', 'defaults', 'components', 'utilities']
function stable(value: unknown): string {
    if (!value || typeof value !== 'object') return JSON.stringify(value)
    if (Array.isArray(value)) return `[${value.map(stable).join(',')}]`
    return `{${Object.entries(value)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, item]) => `${JSON.stringify(key)}:${stable(item)}`)
        .join(',')}}`
}

export function equalDeclarations(a: unknown, b: unknown) {
    if (!a || !b || typeof a !== 'object' || typeof b !== 'object') return stable(a) === stable(b)
    const aKeys = Object.keys(a).sort()
    const bKeys = Object.keys(b).sort()
    return stable(aKeys) === stable(bKeys)
}

export function equalVariants(
    a: { selectorText?: string, atRules?: unknown, layerName?: string, variantBranchKey?: string },
    b: { selectorText?: string, atRules?: unknown, layerName?: string, variantBranchKey?: string }
) {
    const branchA = a.variantBranchKey
    const branchB = b.variantBranchKey
    return (branchA !== undefined || branchB !== undefined ? branchA === branchB : a.selectorText === b.selectorText)
        && a.layerName === b.layerName
        && stable(a.atRules) === stable(b.atRules)
}

function getLayerOrder(layerName?: string) {
    const index = LAYER_ORDER.indexOf(layerName || 'utilities')
    return index === -1 ? LAYER_ORDER.length : index
}

function getReadableGroupOrder(rule: { atRules?: unknown, mode?: unknown, selectorNodes?: unknown[] }) {
    if (rule.atRules) return 3
    if (rule.mode) return 2
    if (rule.selectorNodes?.length) return 1
    return 0
}

function getReadableTypeOrder(rule: { fixedClass?: string, type?: number }) {
    if (rule.fixedClass) return 0
    if (rule.type === UtilityType.Semantic) return 1
    return 2
}

export function sortReadableClasses(classNames: string[], css: MasterCSS) {
    return [...new Set(classNames)].sort((a, b) => {
        const ruleA = css.generate(a)[0]
        const ruleB = css.generate(b)[0]
        if (!ruleA && !ruleB) return a.localeCompare(b)
        if (!ruleA) return 1
        if (!ruleB) return -1
        const layerCmp = getLayerOrder(ruleA.layerName) - getLayerOrder(ruleB.layerName)
        if (layerCmp !== 0) return layerCmp
        const groupCmp = getReadableGroupOrder(ruleA) - getReadableGroupOrder(ruleB)
        if (groupCmp !== 0) return groupCmp
        const typeCmp = getReadableTypeOrder(ruleA) - getReadableTypeOrder(ruleB)
        if (typeCmp !== 0) return typeCmp
        return compareRulePriority(ruleA, ruleB) || a.localeCompare(b)
    })
}
