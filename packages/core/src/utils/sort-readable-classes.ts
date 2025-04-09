import SyntaxRuleType from '../syntax-rule-type'
import MasterCSS from '../core'
import compareRulePriority from './compare-rule-priority'
import { SyntaxRule } from '../syntax-rule'

/**
 * Sorts classes in a consistent order
 * @param classes
 * @param options
 * @returns consistent classes
 */
export default function sortReadableClasses(classes: string[], css = new MasterCSS()) {
    css.add(...classes)

    // 先去重 fixedClass for componentsLayer
    const seenFixed = new Set<string>()
    const dedupedComponentRules = css.componentsLayer.rules
        .filter(rule => {
            if (!rule.fixedClass) return true
            if (seenFixed.has(rule.fixedClass)) return false
            seenFixed.add(rule.fixedClass)
            return true
        })
        .sort((a, b) => {
            if (a.fixedClass && b.fixedClass) {
                return a.fixedClass.localeCompare(b.fixedClass, undefined, { numeric: true })
            }
            return 0
        })
    const allRules = [
        ...dedupedComponentRules,
        ...css.generalLayer.rules,
        ...css.baseLayer.rules,
        ...css.presetLayer.rules,
    ]

    const baseSet = new Set(css.baseLayer.rules)
    const presetSet = new Set(css.presetLayer.rules)

    const getGroupIndex = (rule: SyntaxRule): number => {
        if (baseSet.has(rule)) return 4
        if (presetSet.has(rule)) return 5
        if (rule.atRules) return 3
        if (rule.mode) return 2
        if (rule.selectorNodes?.length) return 1
        return 0
    }

    const getTypeScore = (rule: SyntaxRule): number => {
        if (rule.fixedClass) return 0
        if (rule.type === SyntaxRuleType.Utility) return 1
        return 2
    }
    const rulesWithSortKey = allRules.map(rule => ({
        rule,
        sortKey: [
            getGroupIndex(rule),
            getTypeScore(rule),
        ] as const,
    }))

    const sortedRules = rulesWithSortKey.sort((a, b) => {
        for (let i = 0; i < a.sortKey.length; i++) {
            if (a.sortKey[i] !== b.sortKey[i]) {
                return a.sortKey[i] - b.sortKey[i]
            }
        }
        return compareRulePriority(a.rule, b.rule)
    })

    const orderedClasses = sortedRules
        .map(entry => entry.rule.fixedClass || entry.rule.name)
    const unknownClasses = classes
        .filter(className => orderedClasses.indexOf(className) === -1)
        .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
    css.remove(...classes)
    return [...orderedClasses, ...unknownClasses]
}
