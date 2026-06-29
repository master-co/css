import {
    builtinKeyAliases,
    builtinNativeValueNamespaces,
    type GeneratedRule,
    type MasterCSS
} from '@master/css-engine'
import {
    inspectMasterCSSClass,
    normalizeMasterCSSNumericValue,
    type MasterCSSClassInspection
} from '@master/css-engine/inspect'
import { splitMasterCSSTopLevel } from '@master/css-lexer'
import UtilityType from '@master/css-schema/utility-type'
import type { Variable } from '@master/css-schema/css-syntax'
import {
    getDeclarationPropertySignature,
    getRulesSignature,
    stable
} from './rule-signatures'

export interface CanonicalClassNameOptions {
    preferStaticUtilities?: boolean
    preferThemeTokens?: boolean
    preferPropertyAliases?: boolean
    preferVariableReferences?: boolean
    preferMultiValueTokens?: boolean
    preferCompositionUtilities?: boolean
    preferConditionOrder?: boolean
    preferNativeDeclarationsInCompose?: boolean
    preferVariantBlocksInCompose?: boolean
}

type ResolvedCanonicalClassNameOptions = Required<CanonicalClassNameOptions>

export const defaultCanonicalClassNameOptions: ResolvedCanonicalClassNameOptions = {
    preferStaticUtilities: true,
    preferThemeTokens: true,
    preferPropertyAliases: true,
    preferVariableReferences: true,
    preferMultiValueTokens: true,
    preferCompositionUtilities: true,
    preferConditionOrder: true,
    preferNativeDeclarationsInCompose: true,
    preferVariantBlocksInCompose: true
}

export type ClassParts = Pick<MasterCSSClassInspection, 'base' | 'suffix' | 'key' | 'value'>

interface ClassPartsWithVariables extends ClassParts {
    variables: Map<string, Variable>
}

interface ClassInspectionParts extends ClassPartsWithVariables {
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

const EPSILON = 0.000001

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

function splitTopLevelValueSegments(value: string) {
    const segments = splitMasterCSSTopLevel(value, '|')
    if (segments.length <= 1) return
    const values = segments.map(({ start, end }) => value.slice(start, end))
    if (values.some((segment) => segment === '')) return
    return values
}

function getVariableNumericValue(variable: Variable, css: MasterCSS) {
    if (variable.numeric) {
        return normalizeMasterCSSNumericValue(
            css,
            `${variable.numeric.value}${variable.numeric.unit || ''}`,
        )
    }
    if (variable.value !== undefined) return normalizeMasterCSSNumericValue(css, variable.value)
}

function valuesMatch(a: ReturnType<typeof normalizeMasterCSSNumericValue>, b: ReturnType<typeof normalizeMasterCSSNumericValue>) {
    return Boolean(a && b && a.kind === b.kind && Math.abs(a.value - b.value) < EPSILON)
}

function getVariableReferenceName(value: string) {
    return /^var\(--([A-Za-z0-9_-]+)\)$/.exec(value)?.[1]
}

function getMatchingVariableKeys(
    variables: Map<string, Variable>,
    rawValue: string,
    css: MasterCSS,
    options: ResolvedCanonicalClassNameOptions
) {
    const sourceValue = normalizeMasterCSSNumericValue(css, rawValue)
    const variableReferenceName = options.preferVariableReferences ? getVariableReferenceName(rawValue) : undefined
    const tokenKeys = new Set<string>()
    const numericKeys = new Set<string>()
    if (variables.has(rawValue)) tokenKeys.add(rawValue)
    for (const [key, variable] of variables) {
        if (variableReferenceName && variable.name === variableReferenceName) {
            tokenKeys.add(key)
        }
        if (!sourceValue) continue
        if (valuesMatch(sourceValue, getVariableNumericValue(variable, css))) {
            numericKeys.add(key)
        }
    }
    const keys = tokenKeys.size ? tokenKeys : numericKeys
    const kind = tokenKeys.size ? 'token' : 'numeric'
    return {
        keys: [...keys].sort((a, b) => a.length - b.length || a.localeCompare(b)),
        kind
    } satisfies MatchingVariableKeys
}

function getMatchingMultiValueVariableKeys(
    variables: Map<string, Variable>,
    rawValue: string,
    css: MasterCSS,
    options: ResolvedCanonicalClassNameOptions
): MatchingVariableKeys | undefined {
    if (!options.preferMultiValueTokens) return
    const segments = splitTopLevelValueSegments(rawValue)
    if (!segments) return

    const segmentKeys: string[] = []
    let kind: MatchingVariableKeys['kind'] = 'token'
    for (const segment of segments) {
        const match = getMatchingVariableKeys(variables, segment, css, options)
        if (!match.keys.length) return
        if (match.kind === 'numeric') kind = 'numeric'
        segmentKeys.push(match.keys[0])
    }
    return {
        keys: [segmentKeys.join('|')],
        kind
    }
}

function getVariableCandidateKeys(index: RecommendationIndex, signature: string, sourceKey: string, match: MatchingVariableKeys, preferPropertyAliases: boolean) {
    let keys = getCandidateKeysForPropertySignature(index, signature, sourceKey)
    if (!preferPropertyAliases) {
        const propertyAliases = index.preferredAliasesByProperty.get(signature) || []
        keys = keys.filter((key) => key === sourceKey || !propertyAliases.includes(key))
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

function hasSameRuleScope(sourceRule: GeneratedRule, candidateRule: GeneratedRule) {
    return candidateRule.layerName === sourceRule.layerName
        && candidateRule.mode === sourceRule.mode
        && stable(candidateRule.atRules) === stable(sourceRule.atRules)
        && stable(candidateRule.selectorNodes) === stable(sourceRule.selectorNodes)
}

function hasSameCanonicalRuleShape(sourceRules: GeneratedRule[], candidateRules: GeneratedRule[]) {
    if (sourceRules.length !== candidateRules.length) return false
    const remaining = [...candidateRules]
    for (const sourceRule of sourceRules) {
        const index = remaining.findIndex((candidateRule) =>
            hasSameRuleScope(sourceRule, candidateRule)
            && getDeclarationPropertySignature(candidateRule) === getDeclarationPropertySignature(sourceRule)
        )
        if (index === -1) return false
        remaining.splice(index, 1)
    }
    return true
}

function getSafeBreakpointTokenName(token: string, css: MasterCSS) {
    const match = /^(?:[<>]=?)?([A-Za-z0-9_-]+)$/.exec(token)
    if (!match) return
    const name = match[1]
    if (!css.breakpointAtRules.has(name)) return
    return name
}

function getCanonicalConditionStateToken(stateToken: string | undefined, css: MasterCSS) {
    if (!stateToken?.includes('@')) return

    const parts = splitMasterCSSTopLevel(stateToken, '@')
    if (parts.length <= 2) return

    const selectorPrefix = stateToken.slice(parts[0].start, parts[0].end)
    const conditions = parts.slice(1).map(({ start, end }) => stateToken.slice(start, end))
    if (conditions.some((condition) => !condition)) return

    let mode: string | undefined
    const breakpointConditions: string[] = []
    for (const condition of conditions) {
        const isMode = css.modes.includes(condition)
        const isBreakpoint = Boolean(getSafeBreakpointTokenName(condition, css))
        if (isMode && isBreakpoint) return
        if (isMode) {
            if (mode) return
            mode = condition
            continue
        }
        if (!isBreakpoint) return
        breakpointConditions.push(condition)
    }

    if (!mode || !breakpointConditions.length) return

    const canonicalStateToken = selectorPrefix + [...breakpointConditions, mode].map((condition) => `@${condition}`).join('')
    if (canonicalStateToken === stateToken) return
    return canonicalStateToken
}

function getCanonicalConditionSuffix(parts: MasterCSSClassInspection, css: MasterCSS, options: ResolvedCanonicalClassNameOptions) {
    if (!options.preferConditionOrder) return parts.suffix
    if (parts.rules.some((rule) => rule.layerName !== 'utilities')) return parts.suffix
    const canonicalStateToken = getCanonicalConditionStateToken(parts.stateToken, css)
    if (!canonicalStateToken) return parts.suffix
    return (parts.important ? '!' : '') + canonicalStateToken
}

function createCandidate(candidateBase: string, parts: ClassParts, order: number, suffix = parts.suffix): RecommendationCandidate | undefined {
    if (!candidateBase || (candidateBase === parts.base && suffix === parts.suffix)) return
    return {
        className: candidateBase + suffix,
        order
    }
}

export default function suggestCanonicalClassName(
    className: string,
    css: MasterCSS,
    options: CanonicalClassNameOptions = defaultCanonicalClassNameOptions
) {
    const resolvedOptions: ResolvedCanonicalClassNameOptions = {
        ...defaultCanonicalClassNameOptions,
        ...options
    }
    const sourceInspection = inspectMasterCSSClass(css, className)
    const sourceRules = sourceInspection.rules
    if (!sourceRules.length) return

    const index = getRecommendationIndex(css)
    const parts: ClassInspectionParts = sourceInspection
    const canonicalSuffix = getCanonicalConditionSuffix(sourceInspection, css, resolvedOptions)
    const candidates: RecommendationCandidate[] = []

    if (resolvedOptions.preferStaticUtilities) {
        for (const candidateBase of index.staticCandidatesBySignature.get(getRulesSignature(sourceRules)) || []) {
            const candidate = createCandidate(candidateBase, parts, 0, canonicalSuffix)
            if (candidate) candidates.push(candidate)
        }
    }

    if (parts.key && parts.value) {
        if (resolvedOptions.preferThemeTokens) {
            const variableMatch = getMatchingMultiValueVariableKeys(parts.variables, parts.value, css, resolvedOptions)
                || getMatchingVariableKeys(parts.variables, parts.value, css, resolvedOptions)
            for (const rule of sourceRules) {
                const propertySignature = getDeclarationPropertySignature(rule)
                for (const key of getVariableCandidateKeys(index, propertySignature, parts.key, variableMatch, resolvedOptions.preferPropertyAliases)) {
                    for (const variableKey of variableMatch.keys) {
                        const candidate = createCandidate(`${key}:${variableKey}`, parts, 1, canonicalSuffix)
                        if (candidate) candidates.push(candidate)
                    }
                }
            }
        }

        if (resolvedOptions.preferPropertyAliases) {
            for (const property of Object.keys(sourceRules[0]?.declarations || {})) {
                if (parts.key !== property) continue
                for (const alias of index.preferredAliasesByProperty.get(property) || []) {
                    const candidate = createCandidate(`${alias}:${parts.value}`, parts, 2, canonicalSuffix)
                    if (candidate) candidates.push(candidate)
                }
            }
        }
    }

    const conditionCandidate = createCandidate(parts.base, parts, 3, canonicalSuffix)
    if (conditionCandidate) candidates.push(conditionCandidate)

    const uniqueCandidates = [...new Map(candidates.map((candidate) => [candidate.className, candidate])).values()]
        .sort((a, b) => a.order - b.order || a.className.length - b.className.length || a.className.localeCompare(b.className))

    for (const candidate of uniqueCandidates) {
        if (candidate.className === className) continue
        const candidateRules = css.generate(candidate.className)
        if (!candidateRules.length || !hasSameCanonicalRuleShape(sourceRules, candidateRules)) continue
        return candidate.className
    }
}
