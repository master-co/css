import type { GeneratedRule, MasterCSS } from '@master/css'
import {
    equalVariants,
    getDeclarationSignature
} from './rule-signatures'
import suggestCanonicalClassName, {
    defaultCanonicalClassNameOptions,
    splitClassName,
    type CanonicalClassNameOptions
} from './suggest-canonical-class-name'

export interface CanonicalClassGroupSuggestion {
    classNames: string[]
    recommended: string
}

interface CompositionRecipe {
    properties: [string, string]
    targetKey: string
}

interface ClassGroupEntry {
    index: number
    className: string
    canonicalClassName: string
    key?: string
    value?: string
    suffix: string
    property: string
    rule: GeneratedRule
}

type ResolvedCanonicalClassNameOptions = Required<CanonicalClassNameOptions>

const COMPOSITION_RECIPES: CompositionRecipe[] = [
    { properties: ['width', 'height'], targetKey: 'size' },
    { properties: ['min-width', 'min-height'], targetKey: 'min-size' },
    { properties: ['max-width', 'max-height'], targetKey: 'max-size' },
]

function resolveOptions(options: CanonicalClassNameOptions): ResolvedCanonicalClassNameOptions {
    return {
        ...defaultCanonicalClassNameOptions,
        ...options
    }
}

function getEntry(className: string, index: number, css: MasterCSS, options: ResolvedCanonicalClassNameOptions): ClassGroupEntry | undefined {
    const canonicalClassName = suggestCanonicalClassName(className, css, options) || className
    const rules = css.generate(canonicalClassName)
    if (rules.length !== 1) return

    const rule = rules[0]
    const declarationKeys = Object.keys(rule.declarations || {})
    if (declarationKeys.length !== 1) return

    const parts = splitClassName(canonicalClassName)
    if (!parts.key || !parts.value) return

    return {
        index,
        className,
        canonicalClassName,
        key: parts.key,
        value: parts.value,
        suffix: parts.suffix,
        property: declarationKeys[0],
        rule
    }
}

function getMergedDeclarations(entries: ClassGroupEntry[]) {
    const declarations: Record<string, unknown> = {}
    for (const entry of entries) {
        for (const [property, value] of Object.entries(entry.rule.declarations || {})) {
            if (property in declarations && declarations[property] !== value) return
            declarations[property] = value
        }
    }
    return declarations
}

function isSameVariantScope(entries: ClassGroupEntry[]) {
    return entries.every((entry) => equalVariants(entry.rule, entries[0].rule))
}

function getCandidateClassNames(entries: ClassGroupEntry[], recipe: CompositionRecipe, css: MasterCSS, options: ResolvedCanonicalClassNameOptions) {
    const candidates = new Set<string>()
    for (const entry of entries) {
        const candidate = `${recipe.targetKey}:${entry.value}${entry.suffix}`
        candidates.add(suggestCanonicalClassName(candidate, css, options) || candidate)
    }
    return [...candidates].sort((a, b) => a.length - b.length || a.localeCompare(b))
}

function getCompositionSuggestion(entries: ClassGroupEntry[], recipe: CompositionRecipe, css: MasterCSS, options: ResolvedCanonicalClassNameOptions): CanonicalClassGroupSuggestion | undefined {
    if (entries[0].suffix !== entries[1].suffix) return
    if (!isSameVariantScope(entries)) return

    const mergedDeclarations = getMergedDeclarations(entries)
    if (!mergedDeclarations) return
    const mergedSignature = getDeclarationSignature({ declarations: mergedDeclarations })

    for (const candidateClassName of getCandidateClassNames(entries, recipe, css, options)) {
        if (entries.some((entry) => entry.canonicalClassName === candidateClassName)) continue
        const candidateRules = css.generate(candidateClassName)
        if (candidateRules.length !== 1) continue

        const candidateRule = candidateRules[0]
        if (candidateRule.layerName !== 'utilities') continue
        if (!equalVariants(candidateRule, entries[0].rule)) continue
        if (getDeclarationSignature(candidateRule) !== mergedSignature) continue

        return {
            classNames: entries.map((entry) => entry.className),
            recommended: candidateClassName
        }
    }
}

function getMatchingRecipe(entries: ClassGroupEntry[]) {
    const properties = new Set(entries.map((entry) => entry.property))
    return COMPOSITION_RECIPES.find((recipe) =>
        recipe.properties.length === properties.size
        && recipe.properties.every((property) => properties.has(property))
    )
}

export default function suggestCanonicalClassGroups(
    classNames: string[],
    css: MasterCSS,
    options: CanonicalClassNameOptions = defaultCanonicalClassNameOptions
) {
    const resolvedOptions = resolveOptions(options)
    if (!resolvedOptions.preferCompositionUtilities) return []

    const entries = classNames
        .map((className, index) => getEntry(className, index, css, resolvedOptions))
        .filter((entry): entry is ClassGroupEntry => Boolean(entry))

    const suggestions: CanonicalClassGroupSuggestion[] = []
    const usedIndexes = new Set<number>()
    for (let i = 0; i < entries.length; i++) {
        const entry = entries[i]
        if (usedIndexes.has(entry.index)) continue
        for (let j = i + 1; j < entries.length; j++) {
            const compareEntry = entries[j]
            if (usedIndexes.has(compareEntry.index)) continue
            const groupEntries = [entry, compareEntry].sort((a, b) => a.index - b.index)
            const recipe = getMatchingRecipe(groupEntries)
            if (!recipe) continue
            const suggestion = getCompositionSuggestion(groupEntries, recipe, css, resolvedOptions)
            if (!suggestion) continue
            suggestions.push(suggestion)
            groupEntries.forEach(({ index }) => usedIndexes.add(index))
            break
        }
    }

    return suggestions
}
