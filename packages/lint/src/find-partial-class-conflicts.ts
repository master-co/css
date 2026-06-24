import { generateValidRules } from '@master/css-validator'
import type { GeneratedRule, MasterCSS } from '@master/css-engine'
import {
    inspectMasterCSSClass,
    type MasterCSSClassInspection
} from '@master/css-engine/inspect'
import { splitMasterCSSTopLevel } from '@master/css-lexer'
import { equalVariants } from './rule-signatures'
import suggestCanonicalClassName from './suggest-canonical-class-name'

type ConflictPart = string

interface PartialConflictFamily {
    name: string
    partOrder: ConflictPart[]
    keyParts: Record<string, ConflictPart[]>
    propertyParts?: Record<string, ConflictPart[]>
    replacementKeys: Record<string, string>
    groupedParts?: ConflictPart[][]
    requiresPropertyMatch?: boolean
    disallowMultiValue?: boolean
    formatReplacement?: (key: string, value: string, suffix: string) => string
}

interface PartialClassConflictEntry {
    className: string
    value: string
    suffix: string
    family: PartialConflictFamily
    parts: ConflictPart[]
    rule: GeneratedRule
}

export interface PartialClassConflict {
    className: string
    replacement: string
    conflict: string
}

const physicalSideOrder = ['top', 'right', 'bottom', 'left']
const radiusCornerOrder = ['top-left', 'top-right', 'bottom-right', 'bottom-left']

const partialConflictFamilies: PartialConflictFamily[] = [
    {
        name: 'margin',
        partOrder: physicalSideOrder,
        keyParts: {
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
        },
        groupedParts: [
            ['right', 'left'],
            ['top', 'bottom']
        ]
    },
    {
        name: 'padding',
        partOrder: physicalSideOrder,
        keyParts: {
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
        },
        groupedParts: [
            ['right', 'left'],
            ['top', 'bottom']
        ]
    },
    {
        name: 'inset',
        partOrder: physicalSideOrder,
        keyParts: {
            inset: ['top', 'right', 'bottom', 'left'],
            top: ['top'],
            right: ['right'],
            bottom: ['bottom'],
            left: ['left']
        },
        propertyParts: {
            inset: ['top', 'right', 'bottom', 'left'],
            top: ['top'],
            right: ['right'],
            bottom: ['bottom'],
            left: ['left']
        },
        replacementKeys: {
            'top|right|bottom|left': 'inset',
            top: 'top',
            right: 'right',
            bottom: 'bottom',
            left: 'left'
        },
        requiresPropertyMatch: true,
        disallowMultiValue: true
    },
    {
        name: 'radius',
        partOrder: radiusCornerOrder,
        keyParts: {
            r: ['top-left', 'top-right', 'bottom-right', 'bottom-left'],
            'border-radius': ['top-left', 'top-right', 'bottom-right', 'bottom-left'],
            rtl: ['top-left'],
            'border-top-left-radius': ['top-left'],
            rtr: ['top-right'],
            'border-top-right-radius': ['top-right'],
            rbr: ['bottom-right'],
            'border-bottom-right-radius': ['bottom-right'],
            rbl: ['bottom-left'],
            'border-bottom-left-radius': ['bottom-left']
        },
        propertyParts: {
            'border-radius': ['top-left', 'top-right', 'bottom-right', 'bottom-left'],
            'border-top-left-radius': ['top-left'],
            'border-top-right-radius': ['top-right'],
            'border-bottom-right-radius': ['bottom-right'],
            'border-bottom-left-radius': ['bottom-left']
        },
        replacementKeys: {
            'top-left|top-right|bottom-right|bottom-left': 'r',
            'top-left': 'rtl',
            'top-right': 'rtr',
            'bottom-right': 'rbr',
            'bottom-left': 'rbl'
        },
        requiresPropertyMatch: true,
        disallowMultiValue: true
    },
    {
        name: 'border-width',
        partOrder: physicalSideOrder,
        keyParts: {
            b: ['top', 'right', 'bottom', 'left'],
            'border-width': ['top', 'right', 'bottom', 'left'],
            bt: ['top'],
            'border-top-width': ['top'],
            br: ['right'],
            'border-right-width': ['right'],
            bb: ['bottom'],
            'border-bottom-width': ['bottom'],
            bl: ['left'],
            'border-left-width': ['left']
        },
        propertyParts: {
            'border-width': ['top', 'right', 'bottom', 'left'],
            'border-top-width': ['top'],
            'border-right-width': ['right'],
            'border-bottom-width': ['bottom'],
            'border-left-width': ['left']
        },
        replacementKeys: {
            'top|right|bottom|left': 'b',
            top: 'bt',
            right: 'br',
            bottom: 'bb',
            left: 'bl'
        },
        requiresPropertyMatch: true,
        disallowMultiValue: true
    },
    {
        name: 'border-color',
        partOrder: physicalSideOrder,
        keyParts: {
            b: ['top', 'right', 'bottom', 'left'],
            'border-color': ['top', 'right', 'bottom', 'left'],
            bt: ['top'],
            'border-top-color': ['top'],
            br: ['right'],
            'border-right-color': ['right'],
            bb: ['bottom'],
            'border-bottom-color': ['bottom'],
            bl: ['left'],
            'border-left-color': ['left']
        },
        propertyParts: {
            'border-color': ['top', 'right', 'bottom', 'left'],
            'border-top-color': ['top'],
            'border-right-color': ['right'],
            'border-bottom-color': ['bottom'],
            'border-left-color': ['left']
        },
        replacementKeys: {
            'top|right|bottom|left': 'b',
            top: 'bt',
            right: 'br',
            bottom: 'bb',
            left: 'bl'
        },
        requiresPropertyMatch: true,
        disallowMultiValue: true
    },
    {
        name: 'border-style',
        partOrder: physicalSideOrder,
        keyParts: {
            'border-style': ['top', 'right', 'bottom', 'left'],
            'border-top-style': ['top'],
            'border-right-style': ['right'],
            'border-bottom-style': ['bottom'],
            'border-left-style': ['left']
        },
        propertyParts: {
            'border-style': ['top', 'right', 'bottom', 'left'],
            'border-top-style': ['top'],
            'border-right-style': ['right'],
            'border-bottom-style': ['bottom'],
            'border-left-style': ['left']
        },
        replacementKeys: {
            'top|right|bottom|left': 'b',
            top: 'bt',
            right: 'br',
            bottom: 'bb',
            left: 'bl'
        },
        requiresPropertyMatch: true,
        disallowMultiValue: true,
        formatReplacement: (key, value, suffix) => `${key}-${value}${suffix}`
    }
]

function getDeclarationEntry(rule: GeneratedRule) {
    const entries = Object.entries(rule.declarations || {})
    if (entries.length !== 1) return
    return entries[0] as [string, string | number]
}

function hasTopLevelMultiValue(value: string) {
    return splitMasterCSSTopLevel(value, '|').length > 1
}

function partKey(family: PartialConflictFamily, parts: Iterable<ConflictPart>) {
    const partSet = new Set(parts)
    return family.partOrder.filter((part) => partSet.has(part)).join('|')
}

function partsEqual(family: PartialConflictFamily, a: ConflictPart[], b: ConflictPart[]) {
    return partKey(family, a) === partKey(family, b)
}

function getReplacementClassName(family: PartialConflictFamily, key: string, value: string, suffix: string) {
    return family.formatReplacement?.(key, value, suffix) || `${key}:${value}${suffix}`
}

function getReplacementClassNames(family: PartialConflictFamily, parts: ConflictPart[], value: string, suffix: string) {
    const directKey = family.replacementKeys[partKey(family, parts)]
    if (directKey) return [getReplacementClassName(family, directKey, value, suffix)]

    const remaining = new Set(parts)
    const replacements: string[] = []
    for (const groupedParts of family.groupedParts || []) {
        if (!groupedParts.every((part) => remaining.has(part))) continue
        const axisKey = family.replacementKeys[partKey(family, groupedParts)]
        if (!axisKey) continue
        replacements.push(getReplacementClassName(family, axisKey, value, suffix))
        groupedParts.forEach((part) => remaining.delete(part))
    }

    for (const part of family.partOrder) {
        if (!remaining.has(part)) continue
        const replacementKey = family.replacementKeys[part]
        if (replacementKey) replacements.push(getReplacementClassName(family, replacementKey, value, suffix))
    }

    return replacements.length ? replacements : undefined
}

function getFamilyEntry(
    inspection: MasterCSSClassInspection,
    rule: GeneratedRule
): Omit<PartialClassConflictEntry, 'className' | 'rule'> | undefined {
    const declarationEntry = getDeclarationEntry(rule)
    for (const family of partialConflictFamilies) {
        const propertyParts = declarationEntry && family.propertyParts?.[declarationEntry[0]]
        const keyParts = inspection.key ? family.keyParts[inspection.key] : undefined
        if (family.requiresPropertyMatch && !propertyParts) continue

        const parts = keyParts && (!propertyParts || partsEqual(family, keyParts, propertyParts))
            ? keyParts
            : propertyParts
        if (!parts) continue

        const value = keyParts && inspection.value !== undefined
            ? inspection.value
            : declarationEntry?.[1]
        if (value === undefined) continue

        const normalizedValue = String(value)
        if (family.disallowMultiValue && hasTopLevelMultiValue(normalizedValue)) continue

        return {
            value: normalizedValue,
            suffix: inspection.suffix,
            family,
            parts
        }
    }
}

function getCandidateEntry(
    className: string,
    css: MasterCSS,
    inspection = inspectMasterCSSClass(css, className)
): PartialClassConflictEntry | undefined {
    const rules = generateValidRules(className, css)
    if (rules.length !== 1) return

    const rule = rules[0]
    if (rule.layerName !== 'utilities') return

    const familyEntry = getFamilyEntry(inspection, rule)
    if (!familyEntry) return

    return {
        className,
        ...familyEntry,
        rule,
    }
}

function isPreferredFamilyKey(family: PartialConflictFamily, key?: string) {
    return Boolean(key && Object.values(family.replacementKeys).includes(key))
}

function getClassEntry(className: string, css: MasterCSS): PartialClassConflictEntry | undefined {
    const directInspection = inspectMasterCSSClass(css, className)
    const directEntry = getCandidateEntry(className, css, directInspection)
    if (directEntry && isPreferredFamilyKey(directEntry.family, directInspection.key)) return directEntry

    const canonicalClassName = suggestCanonicalClassName(className, css)
    const canonicalEntry = canonicalClassName ? getCandidateEntry(canonicalClassName, css) : undefined
    if (canonicalEntry) return { ...canonicalEntry, className }
    return directEntry
}

function isProperSubset(subset: ConflictPart[], superset: ConflictPart[]) {
    return subset.length < superset.length
        && subset.every((part) => superset.includes(part))
}

function getRemainingParts(parts: ConflictPart[], coveredParts: ConflictPart[]) {
    return parts.filter((part) => !coveredParts.includes(part))
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
    if (source.suffix !== conflict.suffix) return
    if (!equalVariants(source.rule, conflict.rule)) return
    if (!isProperSubset(conflict.parts, source.parts)) return

    const replacementClassNames = getReplacementClassNames(
        source.family,
        getRemainingParts(source.parts, conflict.parts),
        source.value,
        source.suffix
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
