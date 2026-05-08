import UtilityType from '../utility-type'
import createCSS from '../create'
import compareRulePriority from './compare-rule-priority'
import { Utility } from '../utility'
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

    const seenMain = new Set<string>()
    const dedupedMainRules = css.mainLayer.rules
        .filter((rule): rule is Utility => rule instanceof Utility)
        .filter(rule => {
            const className = rule.fixedClass || rule.name
            if (seenMain.has(className)) return false
            seenMain.add(className)
            return true
        })
    const allRules = [
        ...dedupedMainRules,
        ...css.generalLayer.rules,
        ...css.baseLayer.rules,
        ...css.presetLayer.rules,
    ].filter((rule): rule is Utility => rule instanceof Utility)

    const baseSet = new Set(css.baseLayer.rules)
    const presetSet = new Set(css.presetLayer.rules)
    const mainSet = new Set(css.mainLayer.rules)

    const getGroupIndex = (rule: Utility): number => {
        if (baseSet.has(rule)) return 4
        if (presetSet.has(rule)) return 5
        if (mainSet.has(rule)) return 0
        if (rule.atRules) return 3
        if (rule.mode) return 2
        if (rule.selectorNodes?.length) return 1
        return 0
    }

    const getTypeScore = (rule: Utility): number => {
        if (mainSet.has(rule)) return 0
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

        const mainClassA = mainSet.has(a.rule) ? a.rule.fixedClass || a.rule.name : undefined
        const mainClassB = mainSet.has(b.rule) ? b.rule.fixedClass || b.rule.name : undefined
        if (mainClassA && mainClassB) {
            return mainClassA.localeCompare(mainClassB, undefined, { numeric: true })
        }

        return compareRulePriority(a.rule, b.rule)
    })

    const orderedClasses = sortedRules.map(entry => entry.rule.fixedClass || entry.rule.name)
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
