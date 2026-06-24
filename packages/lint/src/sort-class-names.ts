import { compareRulePriority, type MasterCSS } from '@master/css'
import UtilityType from '@master/css-schema/utility-type'

const LAYER_ORDER = ['theme', 'base', 'defaults', 'components', 'utilities']

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

export default function sortClassNames(classNames: string[], css: MasterCSS) {
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
