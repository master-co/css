/* eslint-disable @typescript-eslint/no-unsafe-declaration-merging */
import { Utility } from './utility'
import { type PropertiesHyphen } from 'csstype'
import type { Rule } from './rule'
import Layer from './layer'
import ThemeLayer from './theme-layer'
import UtilityLayer from './utility-layer'
import NonLayer from './non-layer'
import VariableRule from './variable-rule'
import AnimationRule from './animation-rule'
import type { Variable } from 'shared/css-syntax'
import UtilityType from 'shared/utility-type'
import { AtRule } from './utils/parse-at'
import parseValue from './utils/parse-value'
import type { SelectorNode } from './utils/parse-selector'
import type { MasterCSSPreloaded } from './preloaded'
import { isNativeCSSShorthandProperty } from 'shared/native-css-shorthand'
import type {
    MasterCSSPlan,
    MasterCSSPlanAtRules,
    MasterCSSPlanAnimations,
    MasterCSSPlanSettings,
    MasterCSSPlanUtility,
    MasterCSSPlanUtilityBuckets,
    MasterCSSPlanUtilityLayerName,
    MasterCSSPlanUtilityMatcher,
    MasterCSSPlanVariableAliasSet,
    MasterCSSPlanVariantBranch,
    MasterCSSPlanVariantToken
} from 'shared/master-css-plan'
import builtinKeyAliases from './key-aliases'
import builtinNativeValueNamespaces, { type MasterCSSBuiltinNativeValueNamespace } from './native-value-namespaces'

export type CompiledUtility = MasterCSSPlanUtility & {
    variables?: Map<string, Variable>
}

export interface NativeCSSDeclaration {
    property: string
    value: string
}

export type NativeCSSDeclarationMatcher = (declaration: NativeCSSDeclaration) => boolean

export interface MasterCSSOptions {
    nativeDeclarationMatcher?: NativeCSSDeclarationMatcher
}

type EngineSettings = MasterCSSPlanSettings & {
    rootSize: number
    baseUnit: number
    defaultMode: NonNullable<MasterCSSPlanSettings['defaultMode']>
    modeTrigger: NonNullable<MasterCSSPlanSettings['modeTrigger']>
    modes: string[]
}

const DEFAULT_SETTINGS: EngineSettings = {
    rootSize: 16,
    baseUnit: 4,
    defaultMode: 'light',
    modeTrigger: 'media',
    modes: ['light', 'dark']
}

function assertMasterCSSPlan(plan: MasterCSSPlan): asserts plan is MasterCSSPlan {
    if (!plan || plan.version !== 3) {
        throw new TypeError('Unsupported MasterCSSPlan version. Expected version 3.')
    }
}

function isNameBoundary(char: string | undefined) {
    return char === undefined || !/[a-zA-Z0-9-]/.test(char)
}

function getKeyedValue(className: string, keys: string[]) {
    for (const key of keys) {
        const prefix = key + ':'
        if (className.startsWith(prefix) && className.length > prefix.length) {
            return className.slice(prefix.length)
        }
    }
}

function matchesStaticUtility(className: string, name: string) {
    if (!className.startsWith(name)) return false
    const next = className[name.length]
    return next === undefined || next === '!' || next === '*' || next === '>' || next === '+'
        || next === '~' || next === ':' || next === '[' || next === '@' || next === '_' || next === '.'
}

function getFunctionValueName(value: string) {
    return /^-{0,2}([_a-zA-Z][-_a-zA-Z0-9]*)\(/.exec(value)?.[1]
}

function matchesNumericFunctionValue(value: string) {
    const name = getFunctionValueName(value)
    return name === 'calc' || name === 'clamp' || name === 'min' || name === 'max'
}

function matchesImageFunctionValue(value: string) {
    const name = getFunctionValueName(value)
    if (!name) return false
    return name === 'url'
        || name === 'element'
        || name === 'paint'
        || name === 'cross-fade'
        || name.endsWith('-gradient')
        || name.includes('image')
}

function matchesColorFunctionValue(value: string) {
    const name = getFunctionValueName(value)
    return Boolean(name)
        && !matchesNumericFunctionValue(value)
        && !matchesImageFunctionValue(value)
}

function hasTopLevelValueSeparator(value: string) {
    let depth = 0
    let quote = ''
    for (let index = 0; index < value.length; index++) {
        const char = value[index]
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
        if (char === '|' && depth === 0) return true
    }
    return false
}

function matchesValueSegmentPolicy(value: string, matcher: MasterCSSPlanUtilityMatcher) {
    return (matcher.type !== 'variable' && matcher.type !== 'value')
        || matcher.segments === 'multiple'
        || !hasTopLevelValueSeparator(value)
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

function isPureNativeDeclarationUtilityDefinition(
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

export default class MasterCSS {
    readonly definedUtilities: CompiledUtility[] = []
    protected readonly variableMatcherUtilities: CompiledUtility[] = []
    protected readonly valueMatcherUtilities: CompiledUtility[] = []
    protected readonly keyMatcherUtilities: CompiledUtility[] = []
    protected readonly patternMatcherUtilities: CompiledUtility[] = []
    protected readonly arbitraryMatcherUtilities: CompiledUtility[] = []
    readonly settings!: EngineSettings
    readonly rules: (Layer | Rule)[] = []
    readonly classUtilities = new Map<string, Utility[]>()
    readonly animationsNonLayer = new NonLayer(this)
    readonly baseLayer = new UtilityLayer('base', this)
    readonly themeLayer = new ThemeLayer('theme', this)
    readonly defaultsLayer = new UtilityLayer('defaults', this)
    readonly componentsLayer = new UtilityLayer('components', this)
    readonly utilitiesLayer = new UtilityLayer('utilities', this)
    readonly selectors = new Map<string, SelectorNode[]>()
    readonly variables = new Map<string, Variable>()
    readonly modes: string[] = []
    readonly atRules = new Map<string, AtRule>()
    readonly variants = new Map<MasterCSSPlanVariantToken, MasterCSSPlanVariantBranch[]>()
    readonly breakpointAtRules = new Map<string, AtRule>()
    readonly containerAtRules = new Map<string, AtRule>()
    readonly animations = new Map<string, MasterCSSPlanAnimations[string]>()
    protected readonly staticVariableTokens = new Set<string>()
    protected readonly staticAnimationTokens = new Set<string>()
    readonly preloaded: Required<MasterCSSPreloaded> = {
        variables: {},
        animations: {}
    }
    protected readonly nativeDeclarationFastPathBlockedProperties = new Set<string>()
    protected readonly nativeDeclarationMatches = new Map<string, boolean>()
    protected readonly nativeDeclarationUtilities = new Map<string, CompiledUtility>()
    protected readonly nativeValueNamespaceUtilities = new Map<string, CompiledUtility>()
    protected readonly keyAliases = new Map<string, string>()

    readonly plan!: MasterCSSPlan

    constructor(
        plan: MasterCSSPlan,
        preloaded?: MasterCSSPreloaded,
        protected readonly options: MasterCSSOptions = {}
    ) {
        this.loadPlan(plan)
        this.registerPreloaded(preloaded)
        if (new.target === MasterCSS) {
            this.insertStaticResources()
        }
    }

    get text() {
        return this.rules
            .sort((a, b) => {
                const order = ['theme', 'base', 'defaults', 'components', 'utilities']
                const indexA = order.indexOf(a.name) === -1 ? Infinity : order.indexOf(a.name)
                const indexB = order.indexOf(b.name) === -1 ? Infinity : order.indexOf(b.name)
                return indexA - indexB
            })
            .map(({ text }) => text).join('')
    }

    getUtilityLayer(layerName: MasterCSSPlanUtilityLayerName = 'utilities') {
        switch (layerName) {
            case 'base':
                return this.baseLayer
            case 'defaults':
                return this.defaultsLayer
            case 'components':
                return this.componentsLayer
            case 'utilities':
                return this.utilitiesLayer
            default:
                throw new Error(`Unsupported utility layer: ${layerName}`)
        }
    }

    getUtilityLayers() {
        return [this.baseLayer, this.defaultsLayer, this.componentsLayer, this.utilitiesLayer]
    }

    loadPlan(plan: MasterCSSPlan) {
        assertMasterCSSPlan(plan)
        // @ts-expect-error read-only
        this.plan = plan
        this.loadResolvedPlan()
    }

    private loadResolvedPlan() {
        // @ts-expect-error read-only
        this.settings = {
            ...DEFAULT_SETTINGS,
            ...(this.plan.settings || {}),
            modes: this.plan.settings?.modes ? [...this.plan.settings.modes] : [...DEFAULT_SETTINGS.modes]
        }
        this.loadKeyAliases()
        this.loadVariables()
        this.loadAnimations()
        this.loadAtRuleAliases()
        this.loadVariantAliases()
        const resolveAliasRef = this.createVariableAliasRefResolver()
        this.loadNativeValueNamespaces(resolveAliasRef)
        this.loadUtilities(resolveAliasRef)
    }

    private loadKeyAliases() {
        for (const [key, property] of Object.entries(builtinKeyAliases)) {
            if (key && property && key !== property) {
                this.keyAliases.set(key, property)
            }
        }
    }

    protected applyPreloadedCounts(preloaded: MasterCSSPreloaded) {
        for (const [name, count] of Object.entries(preloaded.variables || {})) {
            if (!count) continue
            this.themeLayer.tokenCounts.set(name, (this.themeLayer.tokenCounts.get(name) || 0) + count)
        }
        for (const [name, count] of Object.entries(preloaded.animations || {})) {
            if (!count) continue
            this.animationsNonLayer.tokenCounts.set(name, (this.animationsNonLayer.tokenCounts.get(name) || 0) + count)
        }
    }

    registerPreloaded(preloaded?: MasterCSSPreloaded) {
        if (!preloaded) return
        for (const [name, count] of Object.entries(preloaded.variables || {})) {
            if (!count) continue
            this.preloaded.variables[name] = (this.preloaded.variables[name] || 0) + count
        }
        for (const [name, count] of Object.entries(preloaded.animations || {})) {
            if (!count) continue
            this.preloaded.animations[name] = (this.preloaded.animations[name] || 0) + count
        }
        this.applyPreloadedCounts(preloaded)
    }

    isPreloadedVariable(name: string) {
        return Boolean(this.preloaded.variables[name])
    }

    isPreloadedAnimation(name: string) {
        return Boolean(this.preloaded.animations[name])
    }

    protected insertStaticVariable(name: string, visited = new Set<string>()) {
        if (visited.has(name)) return
        visited.add(name)
        const variable = this.variables.get(name)
        if (!variable || variable.inline) return

        if (!this.staticVariableTokens.has(name)) {
            if (!this.isPreloadedVariable(name)) {
                if (!this.themeLayer.get(name)) {
                    this.themeLayer.insert(new VariableRule(name, variable, this))
                }
                const count = this.themeLayer.tokenCounts.get(name) || 0
                this.themeLayer.tokenCounts.set(name, count + 1)
            }
            this.staticVariableTokens.add(name)
        }

        variable.dependencies?.forEach((dependency) => this.insertStaticVariable(dependency, visited))
    }

    protected insertStaticAnimation(name: string) {
        if (this.staticAnimationTokens.has(name)) return
        const keyframes = this.animations.get(name)
        if (!keyframes) return

        let rule = this.animationsNonLayer.rules.find((eachRule) => eachRule.name === name) as AnimationRule | undefined
        if (!this.isPreloadedAnimation(name)) {
            if (!rule) {
                rule = new AnimationRule(name, keyframes, this)
                this.animationsNonLayer.insert(rule)
            }
            const count = this.animationsNonLayer.tokenCounts.get(name) || 0
            this.animationsNonLayer.tokenCounts.set(name, count + 1)
        } else if (!rule) {
            rule = new AnimationRule(name, keyframes, this)
        }

        this.staticAnimationTokens.add(name)
        rule.variableNames?.forEach((variableName) => this.insertStaticVariable(variableName))
    }

    insertStaticResources() {
        for (const [name, variable] of this.variables) {
            if (variable.static) this.insertStaticVariable(name)
        }
        for (const name of this.animations.keys()) {
            if (this.plan.animationOptions?.[name]?.static) this.insertStaticAnimation(name)
        }
        return this
    }

    private loadAnimations() {
        const { animations } = this.plan
        if (animations) {
            for (const animationName in animations) {
                const eachAnimation: MasterCSSPlanAnimations[string] = {}
                this.animations.set(animationName, eachAnimation)
                const eachKeyframes = animations[animationName]
                for (const eachKeyframeValue in eachKeyframes) {
                    const newValueByPropertyName: any = eachAnimation[eachKeyframeValue] = {}
                    const eachKeyframeDeclarations = eachKeyframes[eachKeyframeValue as 'from' | 'to' | `${number}%`]
                    for (const propertyName in eachKeyframeDeclarations) {
                        newValueByPropertyName[propertyName] = eachKeyframeDeclarations[propertyName as keyof PropertiesHyphen]
                    }
                }
            }
        }

    }

    private loadVariables() {
        const { variables = [] } = this.plan
        const { modes = [] } = this.settings
        this.modes.push(...modes)
        for (const definition of variables) {
            if (!definition.name || !definition.type || definition.value === false) continue
            this.variables.set(definition.name, {
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
    }

    private loadAtRuleMap(target: Map<string, AtRule>, atRules: MasterCSSPlanAtRules | undefined) {
        if (!atRules) return
        for (const [name, atRule] of Object.entries(atRules)) {
            target.set(name, {
                id: atRule.id,
                nodes: atRule.nodes
            } as AtRule)
        }
    }

    private loadAtRuleAliases() {
        this.loadAtRuleMap(this.atRules, this.plan.atRules)
        this.loadAtRuleMap(this.breakpointAtRules, this.plan.breakpointAtRules)
        this.loadAtRuleMap(this.containerAtRules, this.plan.containerAtRules)
    }

    private loadVariantAliases() {
        if (this.plan.selectors) {
            for (const [name, nodes] of Object.entries(this.plan.selectors)) {
                this.selectors.set(name, nodes as SelectorNode[])
            }
        }

        const { variants } = this.plan
        if (!variants) return

        for (const variant of variants) {
            this.variants.set(variant.token, variant.branches.map((branch) => ({
                ...branch,
                ...(branch.selectorNodes?.length ? { selectorNodes: branch.selectorNodes as SelectorNode[] } : {}),
                ...(branch.atRules?.length ? { atRules: [...branch.atRules] } : {}),
                ...(branch.atRuleNodes?.length ? { atRuleNodes: branch.atRuleNodes.map((atRule) => ({
                    id: atRule.id,
                    nodes: atRule.nodes
                } as AtRule)) } : {})
            })))
        }
    }

    private loadBucket(target: CompiledUtility[], indexes: number[] | undefined) {
        if (!indexes) return
        for (const index of indexes) {
            const utility = this.definedUtilities[index]
            if (utility) target.push(utility)
        }
    }

    private loadUtilityBuckets(buckets: MasterCSSPlanUtilityBuckets | undefined) {
        this.loadBucket(this.variableMatcherUtilities, buckets?.variable)
        this.loadBucket(this.valueMatcherUtilities, buckets?.value)
        this.loadBucket(this.keyMatcherUtilities, buckets?.key)
        this.loadBucket(this.patternMatcherUtilities, buckets?.pattern)
        this.loadBucket(this.arbitraryMatcherUtilities, buckets?.arbitrary)
    }

    private registerNativeDeclarationFastPathPolicy(utility: CompiledUtility) {
        const isPureNativeDeclaration = isPureNativeDeclarationUtilityDefinition(utility)
        for (const matcher of utility.matchers) {
            if (matcher.type !== 'key' && matcher.type !== 'value' && matcher.type !== 'variable') continue
            for (const key of matcher.keys) {
                if (isPureNativeDeclaration && key === utility.emit.property) continue
                this.nativeDeclarationFastPathBlockedProperties.add(key)
            }
        }
    }

    private createVariableAliasRefResolver() {
        const aliasRefCache = new Map<string, MasterCSSPlanVariableAliasSet>()
        return (ref: string): MasterCSSPlanVariableAliasSet => {
            const cached = aliasRefCache.get(ref)
            if (cached) return cached

            const namespace = ref[0] === '=' || ref[0] === '~' ? ref.slice(1) : ''
            const aliases: MasterCSSPlanVariableAliasSet = []
            const usedKeys = new Set<string>()
            if (namespace) {
                for (const variable of this.variables.values()) {
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

    private compileUtilityDefinition(
        utility: MasterCSSPlanUtility,
        resolveAliasRef: (ref: string) => MasterCSSPlanVariableAliasSet
    ): CompiledUtility {
        const definedUtility = {
            ...utility,
            matchers: utility.matchers.map((matcher) => ({ ...matcher }))
        } as CompiledUtility

        const variableAliases = [
            ...(utility.variableAliases || []),
            ...(utility.variableAliasRefs || []).flatMap(resolveAliasRef)
        ]
        if (variableAliases.length) {
            definedUtility.variables = new Map()
            for (const [variableKey, variableName] of variableAliases) {
                if (definedUtility.variables.has(variableKey)) continue
                const variable = this.variables.get(variableName)
                if (variable) definedUtility.variables.set(variableKey, variable)
            }
        }

        deriveUtilityMetadata(definedUtility)
        return definedUtility
    }

    private createNativeValueNamespaceUtility(
        property: string,
        namespace: Pick<MasterCSSBuiltinNativeValueNamespace, 'variableAliasRefs'>
    ): MasterCSSPlanUtility {
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

    private loadNativeValueNamespaces(resolveAliasRef: (ref: string) => MasterCSSPlanVariableAliasSet) {
        for (const namespace of builtinNativeValueNamespaces) {
            if (!namespace.properties?.length || !namespace.variableAliasRefs?.length) continue
            for (const property of namespace.properties) {
                if (!property || this.nativeValueNamespaceUtilities.has(property)) continue
                const utility = this.compileUtilityDefinition(
                    this.createNativeValueNamespaceUtility(property, namespace),
                    resolveAliasRef
                )
                this.nativeValueNamespaceUtilities.set(property, utility)
            }
        }
    }

    private loadUtilities(resolveAliasRef: (ref: string) => MasterCSSPlanVariableAliasSet) {
        const { utilities } = this.plan

        if (!utilities) return

        for (const utility of utilities) {
            const definedUtility = this.compileUtilityDefinition(utility, resolveAliasRef)
            this.registerNativeDeclarationFastPathPolicy(definedUtility)
            this.definedUtilities.push(definedUtility)
        }
        this.loadUtilityBuckets(this.plan.utilityBuckets)
    }

    resolveVariant(token: MasterCSSPlanVariantToken) {
        return this.variants.get(token)
    }

    parseValue(token: string | number, unit = '') {
        return parseValue(token, unit, this.settings.rootSize)
    }

    /**
     * Match check if Master CSS utility
     * @param className
     * @returns css text
     */
    private matchesMatcher(className: string, utility: CompiledUtility, matcher: MasterCSSPlanUtilityMatcher) {
        switch (matcher.type) {
            case 'static':
                return matchesStaticUtility(className, matcher.name)
            case 'key':
                return getKeyedValue(className, matcher.keys) !== undefined
            case 'variable': {
                const value = getKeyedValue(className, matcher.keys)
                if (value === undefined || !utility.variables?.size) return false
                if (!matchesValueSegmentPolicy(value, matcher)) return false
                for (const [variableKey, variable] of utility.variables) {
                    if (value.startsWith(variableKey) && isNameBoundary(value[variableKey.length])) return true
                    const negativeVariableKey = '-' + variableKey
                    if (
                        variableKey[0] !== '-'
                        && variable.type === 'number'
                        && value.startsWith(negativeVariableKey)
                        && isNameBoundary(value[negativeVariableKey.length])
                    ) return true
                }
                return false
            }
            case 'value': {
                const value = getKeyedValue(className, matcher.keys)
                if (value === undefined) return false
                if (!matchesValueSegmentPolicy(value, matcher)) return false
                switch (utility.kind) {
                    case 'color':
                        return value[0] === '#'
                            || matchesColorFunctionValue(value)
                            || (value.startsWith('currentColor') && isNameBoundary(value[12]))
                            || (value.startsWith('transparent') && isNameBoundary(value[11]))
                    case 'number':
                        return /[\d.]/.test(value[0]) || matchesNumericFunctionValue(value)
                    case 'image':
                        return matchesImageFunctionValue(value)
                    default:
                        return false
                }
            }
            case 'pattern':
                return matcher.values.some((value) => matchesStaticUtility(className, matcher.prefix + value))
            case 'group':
                return className[0] === '{' && className.includes('}')
        }
    }

    private matchesUtility(className: string, utility: CompiledUtility, matcherType?: MasterCSSPlanUtilityMatcher['type']) {
        return utility.matchers.some((matcher) =>
            (!matcherType || matcher.type === matcherType) && this.matchesMatcher(className, utility, matcher)
        )
    }

    private matchesExactUtilityDefinition(className: string, utility: CompiledUtility) {
        return utility.matchers.some((matcher) =>
            matcher.type === 'static' && matchesStaticUtility(className, matcher.name)
        )
    }

    private hasClassKey(className: string) {
        if (className[0] === '{') return false

        const indexOfColon = className.indexOf(':')
        if (indexOfColon <= 0) return false

        const key = className.slice(0, indexOfColon)
        return !key.startsWith('--')
    }

    private getClassKeyAlias(className: string) {
        if (className[0] === '{') return

        const indexOfColon = className.indexOf(':')
        if (indexOfColon <= 0) return

        const key = className.slice(0, indexOfColon)
        if (key.startsWith('--')) return

        const canonicalKey = this.keyAliases.get(key)
        if (!canonicalKey) return

        return {
            canonicalKey,
            indexOfColon,
            key
        }
    }

    private canonicalizeClassName(className: string, fixedClass?: string) {
        const keyAlias = this.getClassKeyAlias(className)
        if (!keyAlias) return { className, fixedClass }

        return {
            className: keyAlias.canonicalKey + className.slice(keyAlias.indexOfColon),
            fixedClass
        }
    }

    private matchResolvedClassName(className: string): CompiledUtility | undefined {
        for (const eachUtility of this.variableMatcherUtilities) {
            if (this.matchesUtility(className, eachUtility, 'variable')) return eachUtility
        }

        for (const eachUtility of this.valueMatcherUtilities) {
            if (this.matchesUtility(className, eachUtility, 'value')) return eachUtility
        }

        for (const eachUtility of this.keyMatcherUtilities) {
            if (this.matchesUtility(className, eachUtility, 'key')) return eachUtility
        }

        for (const eachUtility of this.arbitraryMatcherUtilities) {
            if (this.matchesUtility(className, eachUtility)) return eachUtility
        }

        for (const eachUtility of this.patternMatcherUtilities) {
            if (this.matchesUtility(className, eachUtility, 'pattern')) return eachUtility
        }
    }

    private matchRawManagedClassName(className: string): CompiledUtility | undefined {
        for (const eachUtility of this.variableMatcherUtilities) {
            if (this.matchesUtility(className, eachUtility, 'variable')) return eachUtility
        }

        for (const eachUtility of this.valueMatcherUtilities) {
            if (this.matchesUtility(className, eachUtility, 'value')) return eachUtility
        }

        for (const eachUtility of this.keyMatcherUtilities) {
            if (this.matchesUtility(className, eachUtility, 'key')) return eachUtility
        }

        for (const eachUtility of this.patternMatcherUtilities) {
            if (this.matchesUtility(className, eachUtility, 'pattern')) return eachUtility
        }
    }

    match(className: string): CompiledUtility | undefined {
        if (this.hasClassKey(className)) {
            const rawRegisteredUtility = this.matchRawManagedClassName(className)
            if (rawRegisteredUtility) return rawRegisteredUtility
        }
        return this.matchResolvedClassName(this.canonicalizeClassName(className).className)
    }

    private matchAllResolvedClassName(className: string): CompiledUtility[] {
        /**
         * 1. variable
         * @example fg:primary bg:blue
         */
        for (const eachUtility of this.variableMatcherUtilities) {
            if (this.matchesUtility(className, eachUtility, 'variable')) return [eachUtility]
        }

        /**
         * 2. value (ambiguous key with raw color/number/image)
         * @example bg:#fff font:.75rem
         */
        for (const eachUtility of this.valueMatcherUtilities) {
            if (this.matchesUtility(className, eachUtility, 'value')) return [eachUtility]
        }

        /**
         * 3. full key
         * @example text-align:center color:blue-40
         */
        for (const eachUtility of this.keyMatcherUtilities) {
            if (this.matchesUtility(className, eachUtility, 'key')) return [eachUtility]
        }

        /**
         * 4. arbitrary
         * @example custom RegExp, utility
         */
        const staticUtilities: CompiledUtility[] = []
        for (const eachUtility of this.arbitraryMatcherUtilities) {
            if (!this.matchesUtility(className, eachUtility)) continue
            if (eachUtility.matchers.some((matcher) => matcher.type === 'static')) {
                staticUtilities.push(eachUtility)
                continue
            }
            return [eachUtility]
        }
        if (staticUtilities.length) return staticUtilities

        /**
         * 5. enum pattern
         * @example text-center bg-cover
         */
        for (const eachUtility of this.patternMatcherUtilities) {
            if (this.matchesUtility(className, eachUtility, 'pattern')) return [eachUtility]
        }
        return []
    }

    private matchAllRawManagedClassName(className: string): CompiledUtility[] {
        for (const eachUtility of this.variableMatcherUtilities) {
            if (this.matchesUtility(className, eachUtility, 'variable')) return [eachUtility]
        }

        for (const eachUtility of this.valueMatcherUtilities) {
            if (this.matchesUtility(className, eachUtility, 'value')) return [eachUtility]
        }

        for (const eachUtility of this.keyMatcherUtilities) {
            if (this.matchesUtility(className, eachUtility, 'key')) return [eachUtility]
        }

        for (const eachUtility of this.patternMatcherUtilities) {
            if (this.matchesUtility(className, eachUtility, 'pattern')) return [eachUtility]
        }

        return []
    }

    matchAll(className: string): CompiledUtility[] {
        if (this.hasClassKey(className)) {
            const rawRegisteredUtilities = this.matchAllRawManagedClassName(className)
            if (rawRegisteredUtilities.length) return rawRegisteredUtilities
        }
        return this.matchAllResolvedClassName(this.canonicalizeClassName(className).className)
    }

    private parseNativeDeclarationProperty(className: string) {
        const indexOfColon = className.indexOf(':')
        if (indexOfColon <= 0) return

        const property = className.slice(0, indexOfColon)
        if (!/^(?:--[-_a-zA-Z0-9]+|-?[_a-zA-Z][-_a-zA-Z0-9]*)$/.test(property)) return

        return property
    }

    private getNativeDeclarationUtility(property: string): CompiledUtility {
        const cached = this.nativeDeclarationUtilities.get(property)
        if (cached) return cached

        const utility = {
            id: property,
            name: property,
            type: isNativeCSSShorthandProperty(property)
                ? UtilityType.Shorthand
                : UtilityType.Normal,
            order: 0,
            emit: {
                type: 'property',
                property
            },
            matchers: [{
                type: 'key',
                keys: [property]
            }]
        } satisfies CompiledUtility

        this.nativeDeclarationUtilities.set(property, utility)
        return utility
    }

    private matchNativeDeclaration(declaration: NativeCSSDeclaration) {
        if (declaration.property.startsWith('--')) return true
        const matcher = this.options.nativeDeclarationMatcher
        if (!matcher) return false
        const cacheKey = declaration.property + '\0' + declaration.value
        const cached = this.nativeDeclarationMatches.get(cacheKey)
        if (cached !== undefined) return cached
        const matched = matcher(declaration)
        this.nativeDeclarationMatches.set(cacheKey, matched)
        return matched
    }

    private isNativeDeclarationUtility(utility: Utility) {
        const entries = Object.entries(utility.declarations || {})
        if (entries.length !== 1) return false
        const [[property, value]] = entries
        return this.matchNativeDeclaration({
            property,
            value: String(value)
        })
    }

    private shouldValidateNativeDeclarationUtility(utility: CompiledUtility) {
        if (!this.options.nativeDeclarationMatcher) return false
        return isPureNativeDeclarationUtilityDefinition(utility)
            && utility.matchers.every((matcher) => matcher.type === 'key')
    }

    private createNativeDeclarationFallback(className: string, fixedClass?: string, mode?: string, sourceClassName = className): Utility[] {
        if (!this.options.nativeDeclarationMatcher) return []
        const property = this.parseNativeDeclarationProperty(className)
        if (!property) return []

        const registeredUtility = this.getNativeDeclarationUtility(property)
        const utility = this.createWithDefinition(sourceClassName, registeredUtility, fixedClass, mode)
        if (!utility?.valid || !this.isNativeDeclarationUtility(utility)) return []

        const utilities = [utility]
        for (let branchIndex = 1; branchIndex < utility.branchCount; branchIndex++) {
            const branchUtility = this.createWithDefinition(sourceClassName, registeredUtility, fixedClass, mode, branchIndex)
            if (branchUtility?.valid && this.isNativeDeclarationUtility(branchUtility)) utilities.push(branchUtility)
        }
        return utilities
    }

    private createNativeValueNamespaceFallback(className: string, fixedClass?: string, mode?: string, sourceClassName = className): Utility[] {
        const property = this.parseNativeDeclarationProperty(className)
        if (!property) return []

        const registeredUtility = this.nativeValueNamespaceUtilities.get(property)
        if (!registeredUtility) return []

        const utility = this.createWithDefinition(sourceClassName, registeredUtility, fixedClass, mode)
        if (!utility?.valid || this.options.nativeDeclarationMatcher && !this.isNativeDeclarationUtility(utility)) return []

        const utilities = [utility]
        for (let branchIndex = 1; branchIndex < utility.branchCount; branchIndex++) {
            const branchUtility = this.createWithDefinition(sourceClassName, registeredUtility, fixedClass, mode, branchIndex)
            if (
                branchUtility?.valid
                && (!this.options.nativeDeclarationMatcher || this.isNativeDeclarationUtility(branchUtility))
            ) {
                utilities.push(branchUtility)
            }
        }
        return utilities
    }

    private createNativeValueNamespaceFastPath(className: string, fixedClass?: string, mode?: string, sourceClassName = className): Utility[] {
        const property = this.parseNativeDeclarationProperty(className)
        if (!property) return []
        if (this.nativeDeclarationFastPathBlockedProperties.has(property)) return []
        return this.createNativeValueNamespaceFallback(className, fixedClass, mode, sourceClassName)
    }

    private createNativeDeclarationFastPath(className: string, fixedClass?: string, mode?: string, sourceClassName = className): Utility[] {
        const property = this.parseNativeDeclarationProperty(className)
        if (!property) return []
        if (!property.startsWith('--') && this.nativeDeclarationFastPathBlockedProperties.has(property)) return []
        return this.createNativeDeclarationFallback(className, fixedClass, mode, sourceClassName)
    }

    /**
     * Generate utilities from class name
     * @param className
     * @returns Utility[]
     */
    generate(className: string, mode?: string): Utility[] {
        return this.createAll(className, undefined, mode)
    }

    /**
     * Create utility from given class name
     * @param className
     * @returns Utility
     */
    create(className: string, fixedClass?: string, mode?: string): Utility | undefined {
        const sourceClassName = className
        if (this.hasClassKey(className)) {
            const rawRegisteredUtility = this.matchRawManagedClassName(className)
            if (rawRegisteredUtility) {
                const utility = this.createWithDefinition(sourceClassName, rawRegisteredUtility, fixedClass, mode)
                if (utility?.valid) return utility
            }
        }

        const canonicalClass = this.canonicalizeClassName(className, fixedClass)
        className = canonicalClass.className
        fixedClass = canonicalClass.fixedClass
        const fastPathNativeValueNamespaceUtilities = this.createNativeValueNamespaceFastPath(className, fixedClass, mode, sourceClassName)
        if (fastPathNativeValueNamespaceUtilities.length) return fastPathNativeValueNamespaceUtilities[0]

        const fastPathNativeUtilities = this.createNativeDeclarationFastPath(className, fixedClass, mode, sourceClassName)
        if (fastPathNativeUtilities.length) return fastPathNativeUtilities[0]

        const registeredUtility = this.matchResolvedClassName(className)
        if (registeredUtility && this.matchesExactUtilityDefinition(className, registeredUtility)) {
            const nativeValueNamespaceUtilities = this.createNativeValueNamespaceFallback(className, fixedClass, mode, sourceClassName)
            if (nativeValueNamespaceUtilities.length) return nativeValueNamespaceUtilities[0]

            const nativeUtilities = this.createNativeDeclarationFallback(className, fixedClass, mode, sourceClassName)
            if (nativeUtilities.length) return nativeUtilities[0]
        }
        if (registeredUtility) return this.createWithDefinition(sourceClassName, registeredUtility, fixedClass, mode)
        return (
            this.createNativeValueNamespaceFallback(className, fixedClass, mode, sourceClassName)[0]
            || this.createNativeDeclarationFallback(className, fixedClass, mode, sourceClassName)[0]
        )
    }

    createAll(className: string, fixedClass?: string, mode?: string): Utility[] {
        const sourceClassName = className
        if (this.hasClassKey(className)) {
            const rawRegisteredUtilities = this.matchAllRawManagedClassName(className)
            const rawUtilities: Utility[] = []
            for (const registeredUtility of rawRegisteredUtilities) {
                const utility = this.createWithDefinition(sourceClassName, registeredUtility, fixedClass, mode)
                if (utility && utility.valid) {
                    rawUtilities.push(utility)
                    for (let branchIndex = 1; branchIndex < utility.branchCount; branchIndex++) {
                        const branchUtility = this.createWithDefinition(sourceClassName, registeredUtility, fixedClass, mode, branchIndex)
                        if (branchUtility?.valid) rawUtilities.push(branchUtility)
                    }
                }
            }
            if (rawUtilities.length) return rawUtilities
        }

        const canonicalClass = this.canonicalizeClassName(className, fixedClass)
        className = canonicalClass.className
        fixedClass = canonicalClass.fixedClass
        const fastPathNativeValueNamespaceUtilities = this.createNativeValueNamespaceFastPath(className, fixedClass, mode, sourceClassName)
        if (fastPathNativeValueNamespaceUtilities.length) return fastPathNativeValueNamespaceUtilities

        const fastPathNativeUtilities = this.createNativeDeclarationFastPath(className, fixedClass, mode, sourceClassName)
        if (fastPathNativeUtilities.length) return fastPathNativeUtilities

        const registeredUtilities = this.matchAllResolvedClassName(className)
        if (registeredUtilities.length && registeredUtilities.every((utility) => this.matchesExactUtilityDefinition(className, utility))) {
            const nativeValueNamespaceUtilities = this.createNativeValueNamespaceFallback(className, fixedClass, mode, sourceClassName)
            if (nativeValueNamespaceUtilities.length) return nativeValueNamespaceUtilities

            const nativeUtilities = this.createNativeDeclarationFallback(className, fixedClass, mode, sourceClassName)
            if (nativeUtilities.length) return nativeUtilities
        }

        const utilities: Utility[] = []
        for (const registeredUtility of registeredUtilities) {
            const utility = this.createWithDefinition(sourceClassName, registeredUtility, fixedClass, mode)
            if (utility && utility.valid) {
                utilities.push(utility)
                for (let branchIndex = 1; branchIndex < utility.branchCount; branchIndex++) {
                    const branchUtility = this.createWithDefinition(sourceClassName, registeredUtility, fixedClass, mode, branchIndex)
                    if (branchUtility?.valid) utilities.push(branchUtility)
                }
            }
        }
        if (utilities.length) return utilities
        const nativeValueNamespaceUtilities = this.createNativeValueNamespaceFallback(className, fixedClass, mode, sourceClassName)
        return nativeValueNamespaceUtilities.length
            ? nativeValueNamespaceUtilities
            : this.createNativeDeclarationFallback(className, fixedClass, mode, sourceClassName)
    }

    createWithDefinition(className: string, registeredUtility: CompiledUtility, fixedClass?: string, mode?: string, branchIndex = 0): Utility | undefined {
        const candidate = new Utility(className, this, registeredUtility, fixedClass, mode, branchIndex)
        if (
            candidate.valid
            && this.shouldValidateNativeDeclarationUtility(registeredUtility)
            && !this.isNativeDeclarationUtility(candidate)
        ) return
        for (const layer of this.getUtilityLayers()) {
            const rule = layer.get(candidate.key)
            const utility = rule instanceof Utility && rule.registeredUtility === registeredUtility
                ? rule
                : undefined
            if (utility) return utility
        }
        return candidate
    }

    /**
     * Create utility from given selector text
     * @param selectorText
     */
    createFromSelectorText(selectorText: string, layerName?: MasterCSSPlanUtilityLayerName) {
        const selectorTextSplits = selectorText.split(' ')
        const stopChars = /[.#\[!\*>+~:,\s]/
        for (let i = 0; i < selectorTextSplits.length; i++) {
            const eachField = selectorTextSplits[i]
            const modeSelector = this.getModeSelector(eachField)
            if (
                i === 0 && (eachField === modeSelector) ||
                (i === 0 || i === 1) && (eachField === this.settings.scope)
            ) continue
            if (eachField.startsWith('.')) {
                const eachFieldName = eachField.slice(1)
                let className = ''
                let l = 0
                while (l < eachFieldName.length) {
                    const char = eachFieldName[l]
                    const nextChar = eachFieldName[l + 1]
                    if (char === '\\' && nextChar) {
                        className += nextChar
                        l += 2
                        continue
                    }
                    if (stopChars.test(char)) break
                    className += char
                    l++
                }
                const utilities = this.generate(className)
                    .filter((utility) => !layerName || utility.layerName === layerName)
                if (utilities.length) return utilities
            }
        }
    }

    /**
     * 根據蒐集到的所有 DOM class 重新 create
     */
    refresh(plan: MasterCSSPlan = this.plan) {
        this.reset()
        this.loadPlan(plan)
        this.applyPreloadedCounts(this.preloaded)
        this.insertStaticResources()
        return this
    }

    reset() {
        // @ts-ignore
        this.animations = new Map()
        // @ts-ignore
        this.variables = new Map()
        // @ts-ignore
        this.atRules = new Map()
        // @ts-ignore
        this.variants = new Map()
        // @ts-ignore
        this.breakpointAtRules = new Map()
        // @ts-ignore
        this.containerAtRules = new Map()
        // @ts-ignore
        this.selectors = new Map()
        // @ts-ignore
        this.classUtilities = new Map()
        this.modes.length = 0
        this.definedUtilities.length = 0
        this.variableMatcherUtilities.length = 0
        this.valueMatcherUtilities.length = 0
        this.keyMatcherUtilities.length = 0
        this.patternMatcherUtilities.length = 0
        this.arbitraryMatcherUtilities.length = 0
        this.staticVariableTokens.clear()
        this.staticAnimationTokens.clear()
        this.keyAliases.clear()
        this.nativeValueNamespaceUtilities.clear()
        this.nativeDeclarationFastPathBlockedProperties.clear()
        this.baseLayer.reset()
        this.themeLayer.reset()
        this.defaultsLayer.reset()
        this.componentsLayer.reset()
        this.utilitiesLayer.reset()
        this.animationsNonLayer.reset()
        return this
    }

    destroy() {
        this.reset()
        return this
    }

    add(...classNames: string[]) {
        for (const className of classNames) {
            const rules = this.classUtilities.get(className)
            if (rules) continue
            const newRules = this.generate(className)
            if (newRules.length) {
                newRules.forEach((eachUtility) => eachUtility.layer.insert(eachUtility))
                this.classUtilities.set(className, newRules)
            }
        }
        return this
    }

    remove(...classNames: string[]) {
        /**
         * class name 從 DOM tree 中被移除，
         * 匹配並刪除對應的 rule
         */
        for (const className of classNames) {
            const rules = this.classUtilities.get(className)
            if (rules) {
                rules.forEach((rule) => rule.layer.delete(rule.key))
                this.classUtilities.delete(className)
            }
        }
    }

    getModeSelector(modeName: string) {
        switch (this.settings.modeTrigger) {
            case 'class':
                return '.' + modeName
            case 'host':
                return ':host(.' + modeName + ')'
        }
    }
}

export default interface MasterCSS {
    style: HTMLStyleElement | null
    Native: typeof CSS
}
