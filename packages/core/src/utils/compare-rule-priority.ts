import { SyntaxRule } from '../syntax-rule'
import { AtRuleNode } from './parse-at'
import { SelectorNode } from './parse-selector'

// ✅ RulePriority definition
export type RulePriority = {
    features?: [string, number, number][]
    selector: number
}

// ✅ Pseudo-class priority (lower = weaker)
const selectorPriority: Record<string, number> = {
    hover: 1,
    focus: 2,
    active: 3,
    disabled: 4,
}

function extractSelectorPriority(nodes: SelectorNode[] = []): number {
    let priority = 0
    for (const node of nodes) {
        if ('value' in node && typeof node.value === 'string') {
            priority += selectorPriority[node.value] ?? 0
        }
        if ('children' in node && Array.isArray(node.children)) {
            priority += extractSelectorPriority(node.children)
        }
    }
    return priority
}

const NOT_COMPARISON_OPERATORS = {
    '>=': '<',
    '<=': '>',
    '>': '<=',
    '<': '>=',
}

function getAtRuleEntries(nestNodes?: AtRuleNode[]) {
    const featureMap = new Map<string, { min?: number; max?: number }>()
    const walk = (list?: AtRuleNode[], isOutsideNot = false) => {
        (list ?? []).forEach((node, i, arr) => {
            const prev = arr[i - 1]
            if ('operator' in node) {
                const entry = featureMap.get(node.name) ?? {}
                let operator = node.operator
                if (isOutsideNot)
                    operator = NOT_COMPARISON_OPERATORS[operator as keyof typeof NOT_COMPARISON_OPERATORS]
                if (prev?.type === 'logical' && prev.value === 'not')
                    operator = NOT_COMPARISON_OPERATORS[operator as keyof typeof NOT_COMPARISON_OPERATORS]
                switch (operator) {
                    case '>':
                        entry.min = node.value + 0.02
                        break
                    case '>=':
                        entry.min = node.value
                        break
                    case '<':
                        entry.max = node.value - 0.02
                        break
                    case '<=':
                        entry.max = node.value
                        break
                }
                featureMap.set(node.name, entry)
            }
            if ('children' in node && Array.isArray(node.children)) {
                walk(node.children, prev?.type === 'logical' && prev.value === 'not')
            }
        })
    }
    walk(nestNodes)
    return featureMap
}

// ✅ Calculate RulePriority from AST
export function calcRulePriority(rule: SyntaxRule): RulePriority {
    const features: [string, number, number][] = []
    const extractFeatures = (nodes: AtRuleNode[]) => {
        const featureMap = getAtRuleEntries(nodes)
        for (const [name, entry] of featureMap.entries()) {
            const max = entry.max ?? Number.MAX_SAFE_INTEGER
            const min = entry.min ?? 0
            features.push([name, min, max])
        }
    }
    if (rule.atRules?.media) extractFeatures(rule.atRules.media)
    if (rule.atRules?.container) extractFeatures(rule.atRules.container)
    features.sort(([a], [b]) => a.localeCompare(b, undefined, { numeric: true }))
    const selector = extractSelectorPriority(rule.selectorNodes ?? [])
    return {
        features,
        selector
    }
}

function compareFeatureTuples(
    a: [string, number, number][],
    b: [string, number, number][]
): number {
    const len = Math.max(a.length, b.length)
    for (let i = 0; i < len; i++) {
        const aa = a[i]
        const bb = b[i]
        if (!aa) return -1
        if (!bb) return 1
        const [nameA, minA, maxA] = aa
        const [nameB, minB, maxB] = bb
        const nameCmp = nameA.localeCompare(nameB, undefined, { numeric: true })
        if (nameCmp !== 0) return nameCmp
        const rangeA = maxA - minA
        const rangeB = maxB - minB
        if (rangeA !== rangeB) return rangeB - rangeA
        if (minA !== minB) return minB - minA
        if (maxA !== maxB) return maxB - maxA
    }
    return 0
}

// ✅ Compare function
export default function compareRulePriority(a: SyntaxRule, b: SyntaxRule): number {
    const getTier = (rule: SyntaxRule): number => {
        const hasSelector = rule.selectorNodes?.length
        const hasAtRules = !!rule.atRules
        const hasMode = !!rule.mode
        if (hasAtRules) return 3
        if (hasMode) return 2
        if (hasSelector) return 1
        return 0
    }

    const aTier = getTier(a)
    const bTier = getTier(b)

    if (aTier !== bTier) return aTier - bTier

    // 1. features
    const fa = a.priority.features || []
    const fb = b.priority.features || []
    const featureCmp = compareFeatureTuples(fa, fb)
    if (featureCmp !== 0) return featureCmp

    // 2. selector
    const selectorCmp = a.priority.selector - b.priority.selector
    if (selectorCmp !== 0) return selectorCmp

    // 3. rule.type
    const typeCmp = a.type - b.type
    if (typeCmp !== 0) return typeCmp

    // 4. fallback: name
    return a.key.localeCompare(b.key, undefined, { numeric: true })
}