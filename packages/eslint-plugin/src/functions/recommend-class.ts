import { builtinKeyAliases, builtinNativeValueNamespaces } from '@master/css-engine'
import UtilityType from '@master/css-schema/utility-type'
import { equalVariants, type MasterCSS } from '../utils/master-css'
import type { GeneratedRule } from '@master/css'

interface RecommendClassOptions {
    preferStaticUtilities: boolean
    preferVariables: boolean
    preferKeyAliases: boolean
}

interface ClassParts {
    base: string
    suffix: string
    key?: string
    value?: string
}

interface RecommendationCandidate {
    className: string
    order: number
}

interface MatchingVariableKeys {
    keys: string[]
    kind: 'numeric' | 'token'
}

interface RecommendationIndex {
    staticCandidatesBySignature: Map<string, string[]>
    preferredAliasesByProperty: Map<string, string[]>
    variableKeysByPropertySignature: Map<string, string[]>
}

const recommendationIndexes = new WeakMap<MasterCSS, RecommendationIndex>()

const MODIFIER_SIGNS = new Set(['!', '*', '>', '+', '~', ':', '[', '@', '_'])
const EPSILON = 0.000001

function stable(value: unknown): string {
    if (!value || typeof value !== 'object') return JSON.stringify(value)
    if (Array.isArray(value)) return `[${value.map(stable).join(',')}]`
    return `{${Object.entries(value)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, item]) => `${JSON.stringify(key)}:${stable(item)}`)
        .join(',')}}`
}

function getDeclarationPropertySignature(rule: Pick<GeneratedRule, 'declarations'>) {
    return Object.keys(rule.declarations || {}).sort().join('\0')
}

function getDeclarationSignature(rule: Pick<GeneratedRule, 'declarations'>) {
    return stable(rule.declarations || {})
}

function getRulesSignature(rules: GeneratedRule[]) {
    return rules.map(getDeclarationSignature).sort().join('\0')
}

function isTopLevelModifier(value: string, index: number) {
    return MODIFIER_SIGNS.has(value[index])
}

function findModifierIndex(className: string, start: number) {
    let quote = ''
    let depth = 0
    for (let index = start; index < className.length; index++) {
        const char = className[index]
        if (quote) {
            if (char === '\\') {
                index++
            } else if (char === quote) {
                quote = ''
            }
            continue
        }
        if (char === '"' || char === '\'') {
            quote = char
            continue
        }
        if (char === '(' || char === '[' || char === '{') {
            depth++
            continue
        }
        if (char === ')' || char === ']' || char === '}') {
            if (depth > 0) depth--
            continue
        }
        if (depth === 0 && isTopLevelModifier(className, index)) return index
    }
    return className.length
}

function splitClassName(className: string): ClassParts {
    const indexOfColon = className.indexOf(':')
    if (indexOfColon > 0) {
        const end = findModifierIndex(className, indexOfColon + 1)
        const base = className.slice(0, end)
        return {
            base,
            suffix: className.slice(end),
            key: className.slice(0, indexOfColon),
            value: className.slice(indexOfColon + 1, end)
        }
    }
    const end = findModifierIndex(className, 0)
    return {
        base: className.slice(0, end),
        suffix: className.slice(end)
    }
}

function pushMapValue(map: Map<string, string[]>, key: string, value: string) {
    const values = map.get(key)
    if (values) {
        if (!values.includes(value)) values.push(value)
        return
    }
    map.set(key, [value])
}

function getMatcherNames(utility: MasterCSS['definedUtilities'][number]) {
    return utility.matchers.flatMap((matcher) => {
        if (matcher.type === 'static') return [matcher.name]
        if (matcher.type === 'pattern') return matcher.values.map((value) => matcher.prefix + value)
        return []
    })
}

function getVariableMatcherKeys(utility: MasterCSS['definedUtilities'][number]) {
    return utility.matchers.flatMap((matcher) => matcher.type === 'variable' ? matcher.keys : [])
}

function buildPreferredAliasesByProperty() {
    const aliasesByProperty = new Map<string, string[]>()
    for (const [alias, property] of Object.entries(builtinKeyAliases)) {
        pushMapValue(aliasesByProperty, property, alias)
    }
    for (const aliases of aliasesByProperty.values()) {
        aliases.sort((a, b) => a.length - b.length || a.localeCompare(b))
    }
    return aliasesByProperty
}

function getUtilityPropertySignatures(css: MasterCSS, utility: MasterCSS['definedUtilities'][number], key: string) {
    const variableKeys = utility.variables ? [...utility.variables.keys()] : []
    const sampleKey = variableKeys[0]
    if (!sampleKey) return []
    const rules = css.generate(`${key}:${sampleKey}`)
    if (!rules.length) return []
    return [...new Set(rules.map(getDeclarationPropertySignature).filter(Boolean))]
}

function buildRecommendationIndex(css: MasterCSS): RecommendationIndex {
    const staticCandidatesBySignature = new Map<string, string[]>()
    const preferredAliasesByProperty = buildPreferredAliasesByProperty()
    const variableKeysByPropertySignature = new Map<string, string[]>()

    for (const namespace of builtinNativeValueNamespaces) {
        for (const property of namespace.properties) {
            for (const alias of preferredAliasesByProperty.get(property) || []) {
                pushMapValue(variableKeysByPropertySignature, property, alias)
            }
            pushMapValue(variableKeysByPropertySignature, property, property)
        }
    }

    for (const utility of css.definedUtilities) {
        if (utility.type === UtilityType.Semantic && utility.layer === 'utilities') {
            for (const name of getMatcherNames(utility)) {
                if (name.includes(':')) continue
                const rules = css.generate(name)
                if (!rules.length || rules.some((rule) => rule.layerName !== 'utilities')) continue
                pushMapValue(staticCandidatesBySignature, getRulesSignature(rules), name)
            }
        }

        const matcherKeys = getVariableMatcherKeys(utility)
        if (!matcherKeys.length || !utility.variables?.size) continue
        for (const key of matcherKeys) {
            for (const signature of getUtilityPropertySignatures(css, utility, key)) {
                pushMapValue(variableKeysByPropertySignature, signature, key)
            }
        }
    }

    for (const values of staticCandidatesBySignature.values()) {
        values.sort((a, b) => a.length - b.length || a.localeCompare(b))
    }
    for (const values of variableKeysByPropertySignature.values()) {
        values.sort((a, b) => a.length - b.length || a.localeCompare(b))
    }

    return {
        staticCandidatesBySignature,
        preferredAliasesByProperty,
        variableKeysByPropertySignature
    }
}

function getRecommendationIndex(css: MasterCSS) {
    let index = recommendationIndexes.get(css)
    if (!index) {
        index = buildRecommendationIndex(css)
        recommendationIndexes.set(css, index)
    }
    return index
}

function parseNumber(value: string) {
    const match = /^([+-]?(?:\d+(?:\.\d+)?|\.\d+))([a-z%]*)$/i.exec(value)
    if (!match) return
    return {
        value: Number(match[1]),
        unit: match[2]
    }
}

function normalizeNumericValue(value: string | number, css: MasterCSS) {
    if (typeof value === 'number') return { kind: 'number', value }
    const parsed = parseNumber(value)
    if (!parsed) return
    switch (parsed.unit) {
        case '':
            return { kind: 'number', value: parsed.value }
        case 'rem':
            return { kind: 'rem', value: parsed.value }
        case 'px':
            return { kind: 'rem', value: parsed.value / css.settings.rootSize }
        case 'x':
            return { kind: 'rem', value: parsed.value * css.settings.baseUnit / css.settings.rootSize }
        default:
            return
    }
}

function getVariableNumericValue(variable: any, css: MasterCSS) {
    if (variable.numeric) {
        return normalizeNumericValue(
            `${variable.numeric.value}${variable.numeric.unit || ''}`,
            css
        )
    }
    return normalizeNumericValue(variable.value, css)
}

function valuesMatch(a: ReturnType<typeof normalizeNumericValue>, b: ReturnType<typeof normalizeNumericValue>) {
    return Boolean(a && b && a.kind === b.kind && Math.abs(a.value - b.value) < EPSILON)
}

function getMatchingVariableKeys(rules: GeneratedRule[], rawValue: string, css: MasterCSS) {
    const sourceValue = normalizeNumericValue(rawValue, css)
    const tokenKeys = new Set<string>()
    const numericKeys = new Set<string>()
    for (const rule of rules) {
        const variables = (rule as any).registeredUtility?.variables
        if (!variables) continue
        if (variables.has(rawValue)) tokenKeys.add(rawValue)
        if (!sourceValue) continue
        for (const [key, variable] of variables) {
            if (valuesMatch(sourceValue, getVariableNumericValue(variable, css))) {
                numericKeys.add(key)
            }
        }
    }
    const keys = tokenKeys.size ? tokenKeys : numericKeys
    const kind = tokenKeys.size ? 'token' : 'numeric'
    return {
        keys: [...keys].sort((a, b) => a.length - b.length || a.localeCompare(b)),
        kind
    } satisfies MatchingVariableKeys
}

function getVariableCandidateKeys(index: RecommendationIndex, signature: string, sourceKey: string, match: MatchingVariableKeys, preferKeyAliases: boolean) {
    let keys = getCandidateKeysForPropertySignature(index, signature, sourceKey)
    if (!preferKeyAliases) {
        const keyAliases = index.preferredAliasesByProperty.get(signature) || []
        keys = keys.filter((key) => key === sourceKey || !keyAliases.includes(key))
    }
    if (match.kind === 'numeric') return keys
    return keys.filter((key) => key === sourceKey || signature === sourceKey)
}

function getCandidateKeysForPropertySignature(index: RecommendationIndex, signature: string, sourceKey: string) {
    return [
        sourceKey,
        ...(index.variableKeysByPropertySignature.get(signature) || [])
    ].filter(Boolean)
}

function hasSameRuleShape(sourceRules: GeneratedRule[], candidateRules: GeneratedRule[]) {
    if (sourceRules.length !== candidateRules.length) return false
    const remaining = [...candidateRules]
    for (const sourceRule of sourceRules) {
        const index = remaining.findIndex((candidateRule) =>
            candidateRule.layerName === sourceRule.layerName
            && getDeclarationPropertySignature(candidateRule) === getDeclarationPropertySignature(sourceRule)
            && equalVariants(candidateRule, sourceRule)
        )
        if (index === -1) return false
        remaining.splice(index, 1)
    }
    return true
}

function createCandidate(candidateBase: string, parts: ClassParts, order: number): RecommendationCandidate | undefined {
    if (!candidateBase || candidateBase === parts.base) return
    return {
        className: candidateBase + parts.suffix,
        order
    }
}

export default function recommendClass(className: string, css: MasterCSS, options: RecommendClassOptions) {
    const sourceRules = css.generate(className)
    if (!sourceRules.length) return

    const index = getRecommendationIndex(css)
    const parts = splitClassName(className)
    const candidates: RecommendationCandidate[] = []

    if (options.preferStaticUtilities) {
        for (const candidateBase of index.staticCandidatesBySignature.get(getRulesSignature(sourceRules)) || []) {
            const candidate = createCandidate(candidateBase, parts, 0)
            if (candidate) candidates.push(candidate)
        }
    }

    if (parts.key && parts.value) {
        if (options.preferVariables) {
            const variableMatch = getMatchingVariableKeys(sourceRules, parts.value, css)
            for (const rule of sourceRules) {
                const propertySignature = getDeclarationPropertySignature(rule)
                for (const key of getVariableCandidateKeys(index, propertySignature, parts.key, variableMatch, options.preferKeyAliases)) {
                    for (const variableKey of variableMatch.keys) {
                        const candidate = createCandidate(`${key}:${variableKey}`, parts, 1)
                        if (candidate) candidates.push(candidate)
                    }
                }
            }
        }

        if (options.preferKeyAliases) {
            for (const property of Object.keys(sourceRules[0]?.declarations || {})) {
                if (parts.key !== property) continue
                for (const alias of index.preferredAliasesByProperty.get(property) || []) {
                    const candidate = createCandidate(`${alias}:${parts.value}`, parts, 2)
                    if (candidate) candidates.push(candidate)
                }
            }
        }
    }

    const uniqueCandidates = [...new Map(candidates.map((candidate) => [candidate.className, candidate])).values()]
        .sort((a, b) => a.order - b.order || a.className.length - b.className.length || a.className.localeCompare(b.className))

    for (const candidate of uniqueCandidates) {
        if (candidate.className === className) continue
        const candidateRules = css.generate(candidate.className)
        if (!candidateRules.length || !hasSameRuleShape(sourceRules, candidateRules)) continue
        return candidate.className
    }
}
