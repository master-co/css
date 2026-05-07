import UtilityType from '../utility-type'
import createCSS from '../create'
import compareRulePriority from './compare-rule-priority'
import { Utility } from '../utility'
import ComponentRule from '../component-rule'
import { __UNSORTED__ } from '../common'

/**
 * Sorts classes in a consistent order
 * @param classes
 * @param options
 * @returns consistent classes
 */
export default function sortReadableClasses(classes: string[], css = createCSS()) {
    const shouldSortClasses = []
    const unsortedClasses = []
    for (const className of classes) {
        if (className.includes(__UNSORTED__)) {
            unsortedClasses.push(className)
        } else {
            shouldSortClasses.push(className)
        }
    }

    css.add(...shouldSortClasses)

    // 先去重 fixedClass for componentsLayer
    const seenFixed = new Set<string>()
    const dedupedComponentRules = css.componentsLayer.rules
        .filter((rule): rule is Utility | ComponentRule => rule instanceof Utility || rule instanceof ComponentRule)
        .filter(rule => {
            const componentClass = rule instanceof ComponentRule ? rule.name : rule.fixedClass
            if (!componentClass) return true
            if (seenFixed.has(componentClass)) return false
            seenFixed.add(componentClass)
            return true
        })
    const allRules = [
        ...dedupedComponentRules,
        ...css.utilitiesLayer.rules,
        ...css.baseLayer.rules,
        ...css.presetLayer.rules,
    ].filter((rule): rule is Utility | ComponentRule => rule instanceof Utility || rule instanceof ComponentRule)

    const baseSet = new Set(css.baseLayer.rules)
    const presetSet = new Set(css.presetLayer.rules)

    const getGroupIndex = (rule: Utility | ComponentRule): number => {
        if (rule instanceof ComponentRule) {
            if (rule.atRules) return 3
            if (rule.selector && rule.selector !== '&') return 1
            return 0
        }
        if (baseSet.has(rule)) return 4
        if (presetSet.has(rule)) return 5
        if (rule.atRules) return 3
        if (rule.mode) return 2
        if (rule.selectorNodes?.length) return 1
        return 0
    }

    const getTypeScore = (rule: Utility | ComponentRule): number => {
        if (rule instanceof ComponentRule) return 0
        if (rule.fixedClass) return 0
        if (rule.type === UtilityType.Static) return 1
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

        const componentClassA = a.rule instanceof ComponentRule ? a.rule.name : a.rule.fixedClass
        const componentClassB = b.rule instanceof ComponentRule ? b.rule.name : b.rule.fixedClass
        if (componentClassA && componentClassB) {
            return componentClassA.localeCompare(componentClassB, undefined, { numeric: true })
        }

        if (a.rule instanceof ComponentRule || b.rule instanceof ComponentRule) return 0
        return compareRulePriority(a.rule, b.rule)
    })

    const orderedClasses = sortedRules.map(entry => entry.rule instanceof ComponentRule ? entry.rule.name : entry.rule.fixedClass || entry.rule.name)
    css.remove(...shouldSortClasses)

    return [
        ...orderedClasses,
        ...[
            ...shouldSortClasses
                .filter(className => orderedClasses.indexOf(className) === -1),
            ...unsortedClasses
        ]
            .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
    ]
}
