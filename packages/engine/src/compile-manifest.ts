import { type PropertiesHyphen } from 'csstype'
import type { Variable } from 'shared/css-syntax'
import { isNativeCSSShorthandProperty } from 'shared/native-css-shorthand'
import type {
    MasterCSSManifest,
    MasterCSSManifestAnimations,
    MasterCSSManifestAtRules,
    MasterCSSManifestSettings,
    MasterCSSManifestUtility,
    MasterCSSManifestUtilityMatcher,
    MasterCSSManifestVariableAliasSet,
    MasterCSSManifestVariantBranch,
    MasterCSSManifestVariantToken
} from 'shared/master-css-manifest'
import UtilityType from 'shared/utility-type'
import { MATCH_NAME_BOUNDARY } from './common'
import builtinKeyAliases from './key-aliases'
import builtinNativeValueNamespaces, { type MasterCSSBuiltinNativeValueNamespace } from './native-value-namespaces'
import type { AtRule } from './utils/parse-at'
import type { SelectorNode } from './utils/parse-selector'

export type CompiledUtility = Omit<MasterCSSManifestUtility, 'emit'> & {
    emit: MasterCSSManifestUtility['emit'] | { type: 'group' }
    variables?: Map<string, Variable>
}

export type EngineSettings = MasterCSSManifestSettings & {
    rootSize: number
    baseUnit: number
    defaultMode: NonNullable<MasterCSSManifestSettings['defaultMode']>
    modeTrigger: NonNullable<MasterCSSManifestSettings['modeTrigger']>
    modes: string[]
}

const DEFAULT_SETTINGS: EngineSettings = {
    rootSize: 16,
    baseUnit: 4,
    defaultMode: 'light',
    modeTrigger: 'media',
    modes: ['light', 'dark']
}

export interface CompiledManifest {
    manifest: MasterCSSManifest
    settings: EngineSettings
    definedUtilities: CompiledUtility[]
    variableMatcherUtilities: CompiledUtility[]
    valueMatcherUtilities: CompiledUtility[]
    keyMatcherUtilities: CompiledUtility[]
    patternMatcherUtilities: CompiledUtility[]
    arbitraryMatcherUtilities: CompiledUtility[]
    variableMatcherIndex: Map<string, CompiledUtility[]>
    valueMatcherIndex: Map<string, CompiledUtility[]>
    keyMatcherIndex: Map<string, CompiledUtility[]>
    patternMatcherIndex?: Map<string, CompiledUtility[]>
    arbitraryStaticMatcherIndex?: Map<string, CompiledUtility[]>
    selectors: Map<string, SelectorNode[]>
    variables: Map<string, Variable>
    modes: string[]
    atRules: Map<string, AtRule>
    variants: Map<MasterCSSManifestVariantToken, MasterCSSManifestVariantBranch[]>
    breakpointAtRules: Map<string, AtRule>
    containerAtRules: Map<string, AtRule>
    animations: Map<string, MasterCSSManifestAnimations[string]>
    nativeDeclarationFastPathBlockedProperties: Set<string>
    nativeValueNamespaceUtilities: Map<string, CompiledUtility>
    keyAliases: Map<string, string>
}

// Manifests are compiled by object identity. Mutating a manifest after first use is unsupported.
const compiledManifestCache = new WeakMap<MasterCSSManifest, CompiledManifest>()

function assertMasterCSSManifest(manifest: MasterCSSManifest): asserts manifest is MasterCSSManifest {
    if (!manifest || manifest.version !== 1) {
        throw new TypeError('Unsupported MasterCSSManifest version. Expected version 1.')
    }
}

function pushUnique(target: string[], values: string[]) {
    for (const value of values) {
        if (!target.includes(value)) target.push(value)
    }
}

function deriveUtilityMetadata(utility: CompiledUtility) {
    const keys = utility.keys ? [...utility.keys] : []
    const aliasGroups = utility.aliasGroups ? [...utility.aliasGroups] : []

    for (const matcher of utility.matchers) {
        if (matcher.type === 'key') {
            pushUnique(keys, matcher.keys)
        } else if (matcher.type === 'variable' || matcher.type === 'value') {
            pushUnique(aliasGroups, matcher.keys)
        }
    }

    if (keys.length && !utility.keys) utility.keys = keys
    if (aliasGroups.length && !utility.aliasGroups) utility.aliasGroups = aliasGroups
    if (!utility.key) utility.key = keys[0] || aliasGroups[0]
}

export function isPureNativeDeclarationUtilityDefinition(
    utility: CompiledUtility
): utility is CompiledUtility & { emit: { type: 'property', property: string } } {
    return utility.emit.type === 'property'
        && utility.id === utility.emit.property
        && utility.name === utility.emit.property
        && !utility.variableAliasRefs?.length
        && !utility.variableAliases?.length
        && !utility.kind
        && !utility.atRules?.length
}

function getVariableKeyByNamespace(variableName: string, namespace: string) {
    const negative = variableName.startsWith('-')
    const positiveName = negative ? variableName.slice(1) : variableName
    if (positiveName !== namespace && !positiveName.startsWith(namespace + '-')) return
    const key = positiveName === namespace ? '' : positiveName.slice(namespace.length + 1)
    return negative ? '-' + key : key
}

function isIndexableMatchName(name: string) {
    for (let index = 0; index < name.length; index++) {
        if (MATCH_NAME_BOUNDARY.has(name[index])) return false
    }
    return true
}

function pushIndexedUtility(index: Map<string, CompiledUtility[]>, key: string, utility: CompiledUtility) {
    const utilities = index.get(key)
    if (utilities) {
        if (!utilities.includes(utility)) utilities.push(utility)
    } else {
        index.set(key, [utility])
    }
}

function createKeyedMatcherIndex(
    utilities: CompiledUtility[],
    matcherType: 'variable' | 'value' | 'key'
) {
    const index = new Map<string, CompiledUtility[]>()
    for (const utility of utilities) {
        for (const matcher of utility.matchers) {
            if (matcher.type !== matcherType) continue
            for (const key of matcher.keys) {
                pushIndexedUtility(index, key, utility)
            }
        }
    }
    return index
}

function createPatternMatcherIndex(utilities: CompiledUtility[]) {
    const index = new Map<string, CompiledUtility[]>()
    for (const utility of utilities) {
        for (const matcher of utility.matchers) {
            if (matcher.type !== 'pattern') continue
            for (const value of matcher.values) {
                const name = matcher.prefix + value
                if (isIndexableMatchName(name)) {
                    pushIndexedUtility(index, name, utility)
                }
            }
        }
    }
    return index
}

function canIndexPatternUtilities(utilities: CompiledUtility[]) {
    return utilities.every((utility) =>
        utility.matchers.every((matcher) =>
            matcher.type !== 'pattern'
            || matcher.values.every((value) => isIndexableMatchName(matcher.prefix + value))
        )
    )
}

function createStaticMatcherIndex(utilities: CompiledUtility[]) {
    const index = new Map<string, CompiledUtility[]>()
    for (const utility of utilities) {
        for (const matcher of utility.matchers) {
            if (matcher.type === 'static' && isIndexableMatchName(matcher.name)) {
                pushIndexedUtility(index, matcher.name, utility)
            }
        }
    }
    return index
}

function canIndexStaticOnlyUtilities(utilities: CompiledUtility[]) {
    return utilities.every((utility) =>
        utility.matchers.length
        && utility.matchers.every((matcher) => matcher.type === 'static' && isIndexableMatchName(matcher.name))
    )
}

function createCompiledSettings(manifest: MasterCSSManifest): EngineSettings {
    return {
        ...DEFAULT_SETTINGS,
        ...(manifest.settings || {}),
        modes: manifest.settings?.modes ? [...manifest.settings.modes] : [...DEFAULT_SETTINGS.modes]
    }
}

export function cloneCompiledSettings(settings: EngineSettings): EngineSettings {
    return {
        ...settings,
        modes: [...settings.modes]
    }
}

function compileKeyAliases() {
    const keyAliases = new Map<string, string>()
    for (const [key, property] of Object.entries(builtinKeyAliases)) {
        if (key && property && key !== property) {
            keyAliases.set(key, property)
        }
    }
    return keyAliases
}

function compileVariables(manifest: MasterCSSManifest) {
    const variables = new Map<string, Variable>()
    for (const definition of manifest.variables || []) {
        if (!definition.name || !definition.type || definition.value === false) continue
        variables.set(definition.name, {
            name: definition.name,
            key: definition.key,
            type: definition.type,
            ...(definition.namespace ? { namespace: definition.namespace } : {}),
            ...(definition.value !== undefined ? {
                value: Array.isArray(definition.value) ? definition.value.join(',') : definition.value
            } : {}),
            ...(definition.numeric ? { numeric: { ...definition.numeric } } : {}),
            ...(definition.modes ? { modes: { ...definition.modes } } : {}),
            ...(definition.dependencies?.length ? { dependencies: new Set(definition.dependencies) } : {}),
            ...(definition.inline ? { inline: true } : {}),
            ...(definition.static ? { static: true } : {})
        } as Variable)
    }
    return variables
}

function compileAnimations(manifest: MasterCSSManifest) {
    const animations = new Map<string, MasterCSSManifestAnimations[string]>()
    if (!manifest.animations) return animations
    for (const animationName in manifest.animations) {
        const eachAnimation: MasterCSSManifestAnimations[string] = {}
        animations.set(animationName, eachAnimation)
        const eachKeyframes = manifest.animations[animationName]
        for (const eachKeyframeValue in eachKeyframes) {
            const newValueByPropertyName: any = eachAnimation[eachKeyframeValue] = {}
            const eachKeyframeDeclarations = eachKeyframes[eachKeyframeValue as 'from' | 'to' | `${number}%`]
            for (const propertyName in eachKeyframeDeclarations) {
                newValueByPropertyName[propertyName] = eachKeyframeDeclarations[propertyName as keyof PropertiesHyphen]
            }
        }
    }
    return animations
}

function compileAtRuleMap(atRules: MasterCSSManifestAtRules | undefined) {
    const target = new Map<string, AtRule>()
    if (!atRules) return target
    for (const [name, atRule] of Object.entries(atRules)) {
        target.set(name, {
            id: atRule.id,
            nodes: atRule.nodes
        } as AtRule)
    }
    return target
}

function compileVariantAliases(manifest: MasterCSSManifest) {
    const selectors = new Map<string, SelectorNode[]>()
    if (manifest.selectors) {
        for (const [name, nodes] of Object.entries(manifest.selectors)) {
            selectors.set(name, nodes as SelectorNode[])
        }
    }

    const variants = new Map<MasterCSSManifestVariantToken, MasterCSSManifestVariantBranch[]>()
    for (const variant of manifest.variants || []) {
        variants.set(variant.token, variant.branches.map((branch) => ({
            ...branch,
            ...(branch.selectorNodes?.length ? { selectorNodes: branch.selectorNodes as SelectorNode[] } : {}),
            ...(branch.atRules?.length ? { atRules: [...branch.atRules] } : {}),
            ...(branch.atRuleNodes?.length ? { atRuleNodes: branch.atRuleNodes.map((atRule) => ({
                id: atRule.id,
                nodes: atRule.nodes
            } as AtRule)) } : {})
        })))
    }

    return { selectors, variants }
}

function createVariableAliasRefResolver(variables: Map<string, Variable>) {
    const aliasRefCache = new Map<string, MasterCSSManifestVariableAliasSet>()
    return (ref: string): MasterCSSManifestVariableAliasSet => {
        const cached = aliasRefCache.get(ref)
        if (cached) return cached

        const namespace = ref[0] === '=' || ref[0] === '~' ? ref.slice(1) : ''
        const aliases: MasterCSSManifestVariableAliasSet = []
        const usedKeys = new Set<string>()
        if (namespace) {
            for (const variable of variables.values()) {
                const key = getVariableKeyByNamespace(variable.name, namespace)
                if (key === undefined || usedKeys.has(key)) continue
                usedKeys.add(key)
                aliases.push([key, variable.name])
            }
        }
        aliasRefCache.set(ref, aliases)
        return aliases
    }
}

function compileUtilityDefinition(
    utility: MasterCSSManifestUtility,
    variables: Map<string, Variable>,
    resolveAliasRef: (ref: string) => MasterCSSManifestVariableAliasSet
): CompiledUtility {
    const definedUtility = {
        ...utility,
        matchers: utility.matchers.map((matcher: MasterCSSManifestUtilityMatcher) => ({ ...matcher }))
    } as CompiledUtility

    const variableAliases = [
        ...(utility.variableAliases || []),
        ...(utility.variableAliasRefs || []).flatMap(resolveAliasRef)
    ]
    if (variableAliases.length) {
        definedUtility.variables = new Map()
        for (const [variableKey, variableName] of variableAliases) {
            if (definedUtility.variables.has(variableKey)) continue
            const variable = variables.get(variableName)
            if (variable) definedUtility.variables.set(variableKey, variable)
        }
    }

    deriveUtilityMetadata(definedUtility)
    return definedUtility
}

function createNativeValueNamespaceUtility(
    property: string,
    namespace: Pick<MasterCSSBuiltinNativeValueNamespace, 'variableAliasRefs'>
): MasterCSSManifestUtility {
    return {
        id: property,
        name: property,
        type: isNativeCSSShorthandProperty(property)
            ? UtilityType.Shorthand
            : UtilityType.Normal,
        order: 0,
        variableAliasRefs: [...namespace.variableAliasRefs],
        emit: {
            type: 'property',
            property
        },
        matchers: [{
            type: 'key',
            keys: [property]
        }]
    }
}

function compileNativeValueNamespaces(
    variables: Map<string, Variable>,
    resolveAliasRef: (ref: string) => MasterCSSManifestVariableAliasSet
) {
    const nativeValueNamespaceUtilities = new Map<string, CompiledUtility>()
    for (const namespace of builtinNativeValueNamespaces) {
        if (!namespace.properties?.length || !namespace.variableAliasRefs?.length) continue
        for (const property of namespace.properties) {
            if (!property || nativeValueNamespaceUtilities.has(property)) continue
            const utility = compileUtilityDefinition(
                createNativeValueNamespaceUtility(property, namespace),
                variables,
                resolveAliasRef
            )
            nativeValueNamespaceUtilities.set(property, utility)
        }
    }
    return nativeValueNamespaceUtilities
}

function registerNativeDeclarationFastPathPolicy(
    target: Set<string>,
    utility: CompiledUtility
) {
    const isPureNativeDeclaration = isPureNativeDeclarationUtilityDefinition(utility)
    for (const matcher of utility.matchers) {
        if (matcher.type !== 'key' && matcher.type !== 'value' && matcher.type !== 'variable') continue
        for (const key of matcher.keys) {
            if (isPureNativeDeclaration && key === utility.emit.property) continue
            target.add(key)
        }
    }
}

function loadBucket(target: CompiledUtility[], definedUtilities: CompiledUtility[], indexes: number[] | undefined) {
    if (!indexes) return
    for (const index of indexes) {
        const utility = definedUtilities[index]
        if (utility) target.push(utility)
    }
}

function compileUtilities(
    manifest: MasterCSSManifest,
    variables: Map<string, Variable>,
    resolveAliasRef: (ref: string) => MasterCSSManifestVariableAliasSet
) {
    const definedUtilities: CompiledUtility[] = []
    const variableMatcherUtilities: CompiledUtility[] = []
    const valueMatcherUtilities: CompiledUtility[] = []
    const keyMatcherUtilities: CompiledUtility[] = []
    const patternMatcherUtilities: CompiledUtility[] = []
    const arbitraryMatcherUtilities: CompiledUtility[] = []
    const nativeDeclarationFastPathBlockedProperties = new Set<string>()

    for (const utility of manifest.utilities || []) {
        const definedUtility = compileUtilityDefinition(utility, variables, resolveAliasRef)
        registerNativeDeclarationFastPathPolicy(nativeDeclarationFastPathBlockedProperties, definedUtility)
        definedUtilities.push(definedUtility)
    }

    loadBucket(variableMatcherUtilities, definedUtilities, manifest.utilityBuckets?.variable)
    loadBucket(valueMatcherUtilities, definedUtilities, manifest.utilityBuckets?.value)
    loadBucket(keyMatcherUtilities, definedUtilities, manifest.utilityBuckets?.key)
    loadBucket(patternMatcherUtilities, definedUtilities, manifest.utilityBuckets?.pattern)
    loadBucket(arbitraryMatcherUtilities, definedUtilities, manifest.utilityBuckets?.arbitrary)

    return {
        definedUtilities,
        variableMatcherUtilities,
        valueMatcherUtilities,
        keyMatcherUtilities,
        patternMatcherUtilities,
        arbitraryMatcherUtilities,
        variableMatcherIndex: createKeyedMatcherIndex(variableMatcherUtilities, 'variable'),
        valueMatcherIndex: createKeyedMatcherIndex(valueMatcherUtilities, 'value'),
        keyMatcherIndex: createKeyedMatcherIndex(keyMatcherUtilities, 'key'),
        patternMatcherIndex: canIndexPatternUtilities(patternMatcherUtilities)
            ? createPatternMatcherIndex(patternMatcherUtilities)
            : undefined,
        arbitraryStaticMatcherIndex: canIndexStaticOnlyUtilities(arbitraryMatcherUtilities)
            ? createStaticMatcherIndex(arbitraryMatcherUtilities)
            : undefined,
        nativeDeclarationFastPathBlockedProperties
    }
}

export function compileManifest(manifest: MasterCSSManifest): CompiledManifest {
    assertMasterCSSManifest(manifest)
    const settings = createCompiledSettings(manifest)
    const variables = compileVariables(manifest)
    const animations = compileAnimations(manifest)
    const { selectors, variants } = compileVariantAliases(manifest)
    const resolveAliasRef = createVariableAliasRefResolver(variables)
    const nativeValueNamespaceUtilities = compileNativeValueNamespaces(variables, resolveAliasRef)
    const utilities = compileUtilities(manifest, variables, resolveAliasRef)

    return {
        manifest,
        settings,
        definedUtilities: utilities.definedUtilities,
        variableMatcherUtilities: utilities.variableMatcherUtilities,
        valueMatcherUtilities: utilities.valueMatcherUtilities,
        keyMatcherUtilities: utilities.keyMatcherUtilities,
        patternMatcherUtilities: utilities.patternMatcherUtilities,
        arbitraryMatcherUtilities: utilities.arbitraryMatcherUtilities,
        variableMatcherIndex: utilities.variableMatcherIndex,
        valueMatcherIndex: utilities.valueMatcherIndex,
        keyMatcherIndex: utilities.keyMatcherIndex,
        patternMatcherIndex: utilities.patternMatcherIndex,
        arbitraryStaticMatcherIndex: utilities.arbitraryStaticMatcherIndex,
        selectors,
        variables,
        modes: [...settings.modes],
        atRules: compileAtRuleMap(manifest.atRules),
        variants,
        breakpointAtRules: compileAtRuleMap(manifest.breakpointAtRules),
        containerAtRules: compileAtRuleMap(manifest.containerAtRules),
        animations,
        nativeDeclarationFastPathBlockedProperties: utilities.nativeDeclarationFastPathBlockedProperties,
        nativeValueNamespaceUtilities,
        keyAliases: compileKeyAliases()
    }
}

export function getCompiledManifest(manifest: MasterCSSManifest) {
    const cached = compiledManifestCache.get(manifest)
    if (cached) return cached
    const compiledManifest = compileManifest(manifest)
    compiledManifestCache.set(manifest, compiledManifest)
    return compiledManifest
}
