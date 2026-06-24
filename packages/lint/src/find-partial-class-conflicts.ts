import { generateValidRules } from '@master/css-validator'
import type { GeneratedRule, MasterCSS } from '@master/css'
import { equalVariants } from './rule-signatures'
import suggestCanonicalClassName, { splitClassName, type ClassParts } from './suggest-canonical-class-name'

type Side = 'top' | 'right' | 'bottom' | 'left'

interface SpacingFamily {
    name: 'margin' | 'padding'
    keySides: Record<string, Side[]>
    replacementKeys: Record<string, string>
}

interface PartialClassConflictEntry {
    className: string
    parts: ClassParts
    family: SpacingFamily
    sides: Side[]
    rule: GeneratedRule
}

export interface PartialClassConflict {
    className: string
    replacement: string
    conflict: string
}

const sideOrder: Side[] = ['top', 'right', 'bottom', 'left']

const spacingFamilies: SpacingFamily[] = [
    {
        name: 'margin',
        keySides: {
            m: ['top', 'right', 'bottom', 'left'],
            mx: ['right', 'left'],
            my: ['top', 'bottom'],
            mt: ['top'],
            mr: ['right'],
            mb: ['bottom'],
            ml: ['left']
        },
        replacementKeys: {
            'top|right|bottom|left': 'm',
            'right|left': 'mx',
            'top|bottom': 'my',
            top: 'mt',
            right: 'mr',
            bottom: 'mb',
            left: 'ml'
        }
    },
    {
        name: 'padding',
        keySides: {
            p: ['top', 'right', 'bottom', 'left'],
            px: ['right', 'left'],
            py: ['top', 'bottom'],
            pt: ['top'],
            pr: ['right'],
            pb: ['bottom'],
            pl: ['left']
        },
        replacementKeys: {
            'top|right|bottom|left': 'p',
            'right|left': 'px',
            'top|bottom': 'py',
            top: 'pt',
            right: 'pr',
            bottom: 'pb',
            left: 'pl'
        }
    }
]

function getFamily(key?: string) {
    if (!key) return
    return spacingFamilies.find((family) => key in family.keySides)
}

function sideKey(sides: Iterable<Side>) {
    const sideSet = new Set(sides)
    return sideOrder.filter((side) => sideSet.has(side)).join('|')
}

function getReplacementClassNames(family: SpacingFamily, sides: Side[], value: string, suffix: string) {
    const directKey = family.replacementKeys[sideKey(sides)]
    if (directKey) return [`${directKey}:${value}${suffix}`]

    const remaining = new Set(sides)
    const replacements: string[] = []
    for (const axisSides of [
        ['right', 'left'] as Side[],
        ['top', 'bottom'] as Side[]
    ]) {
        if (!axisSides.every((side) => remaining.has(side))) continue
        const axisKey = family.replacementKeys[sideKey(axisSides)]
        if (!axisKey) continue
        replacements.push(`${axisKey}:${value}${suffix}`)
        axisSides.forEach((side) => remaining.delete(side))
    }

    for (const side of sideOrder) {
        if (!remaining.has(side)) continue
        const replacementKey = family.replacementKeys[side]
        if (replacementKey) replacements.push(`${replacementKey}:${value}${suffix}`)
    }

    return replacements.length ? replacements : undefined
}

function getClassEntry(className: string, css: MasterCSS): PartialClassConflictEntry | undefined {
    const directParts = splitClassName(className)
    const directFamily = getFamily(directParts.key)
    const canonicalClassName = directFamily ? className : suggestCanonicalClassName(className, css) || className
    const parts = splitClassName(canonicalClassName)
    const family = getFamily(parts.key)
    if (!family || !parts.key || !parts.value) return

    const rules = generateValidRules(canonicalClassName, css)
    if (rules.length !== 1) return

    const rule = rules[0]
    if (rule.layerName !== 'utilities') return

    return {
        className,
        parts,
        family,
        sides: family.keySides[parts.key],
        rule
    }
}

function isProperSubset(subset: Side[], superset: Side[]) {
    return subset.length < superset.length
        && subset.every((side) => superset.includes(side))
}

function getRemainingSides(sides: Side[], coveredSides: Side[]) {
    return sides.filter((side) => !coveredSides.includes(side))
}

function validateReplacement(classNames: string[], source: PartialClassConflictEntry, css: MasterCSS) {
    for (const className of classNames) {
        const rules = generateValidRules(className, css)
        if (rules.length !== 1 || rules[0].layerName !== 'utilities' || !equalVariants(rules[0], source.rule)) return
    }
    return classNames.join(' ')
}

function getPartialConflictReplacement(source: PartialClassConflictEntry, conflict: PartialClassConflictEntry, css: MasterCSS) {
    if (source.family.name !== conflict.family.name) return
    if (source.parts.suffix !== conflict.parts.suffix) return
    if (!equalVariants(source.rule, conflict.rule)) return
    if (!isProperSubset(conflict.sides, source.sides)) return
    if (source.parts.value === undefined) return

    const replacementClassNames = getReplacementClassNames(
        source.family,
        getRemainingSides(source.sides, conflict.sides),
        source.parts.value,
        source.parts.suffix
    )
    if (!replacementClassNames) return

    return validateReplacement(replacementClassNames, source, css)
}

export default function findPartialClassConflicts(classNames: string[], css: MasterCSS): PartialClassConflict[] {
    const entries = classNames
        .map((className) => getClassEntry(className, css))
        .filter((entry): entry is PartialClassConflictEntry => Boolean(entry))

    const conflicts: PartialClassConflict[] = []
    for (let i = 0; i < entries.length; i++) {
        const entry = entries[i]
        for (let j = i + 1; j < entries.length; j++) {
            const compareEntry = entries[j]
            const replacement = getPartialConflictReplacement(entry, compareEntry, css)
            if (!replacement) continue
            conflicts.push({
                className: entry.className,
                replacement,
                conflict: compareEntry.className
            })
            break
        }
    }
    return conflicts
}
