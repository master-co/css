/* eslint-disable @typescript-eslint/no-unsafe-declaration-merging */
import { Utility } from './utility'
import { type PropertiesHyphen } from 'csstype'
import type { Rule } from './rule'
import Layer from './layer'
import ThemeLayer from './theme-layer'
import UtilityLayer from './utility-layer'
import NonLayer from './non-layer'
import type { Variable } from 'shared/css-syntax'
import { AtRule } from './utils/parse-at'
import parseValue from './utils/parse-value'
import type { SelectorNode } from './utils/parse-selector'
import type { MasterCSSPreloaded } from './preloaded'
import type {
    MasterCSSPlan,
    MasterCSSPlanAtRules,
    MasterCSSPlanAnimations,
    MasterCSSPlanFunctions,
    MasterCSSPlanSettings,
    MasterCSSPlanUtility,
    MasterCSSPlanUtilityBuckets,
    MasterCSSPlanUtilityLayerName,
    MasterCSSPlanUtilityMatcher,
    MasterCSSPlanVariantBranch,
    MasterCSSPlanVariantToken
} from 'shared/master-css-plan'

export type CompiledUtility = MasterCSSPlanUtility & {
    variables?: Map<string, Variable>
}

type EngineSettings = MasterCSSPlanSettings & {
    rootSize: number
    baseUnit: number
    defaultMode: NonNullable<MasterCSSPlanSettings['defaultMode']>
    modeTrigger: NonNullable<MasterCSSPlanSettings['modeTrigger']>
    modes: string[]
    functions?: MasterCSSPlanFunctions
}

const DEFAULT_SETTINGS: EngineSettings = {
    rootSize: 16,
    baseUnit: 4,
    defaultMode: 'light',
    modeTrigger: 'media',
    modes: ['light', 'dark']
}

function assertMasterCSSPlan(plan: MasterCSSPlan): asserts plan is MasterCSSPlan {
    if (!plan || plan.version !== 1) {
        throw new TypeError('Unsupported MasterCSSPlan version. Expected version 1.')
    }
}

function isNameBoundary(char: string | undefined) {
    return char === undefined || !/[a-zA-Z0-9-]/.test(char)
}

function isWordBoundary(char: string | undefined) {
    return char === undefined || char === '_' || !/[a-zA-Z0-9]/.test(char)
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

function matchesCSSVariableAssignment(className: string) {
    if (className[0] !== '$') return false
    const colonIndex = className.indexOf(':')
    if (colonIndex <= 1) return false
    for (let index = 1; index < colonIndex; index++) {
        if (!/[\w-]/.test(className[index])) return false
    }
    return true
}

function matchesKnownFunction(value: string, names: string[]) {
    return names.some((name) => value.startsWith(name + '('))
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

export default class MasterCSS {
    readonly definedUtilities: CompiledUtility[] = []
    protected readonly variableMatcherUtilities: CompiledUtility[] = []
    protected readonly valueMatcherUtilities: CompiledUtility[] = []
    protected readonly keyMatcherUtilities: CompiledUtility[] = []
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
    readonly preloaded: Required<MasterCSSPreloaded> = {
        variables: {},
        animations: {}
    }

    readonly plan!: MasterCSSPlan

    constructor(plan: MasterCSSPlan, preloaded?: MasterCSSPreloaded) {
        this.loadPlan(plan)
        this.registerPreloaded(preloaded)
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
            modes: this.plan.settings?.modes ? [...this.plan.settings.modes] : [...DEFAULT_SETTINGS.modes],
            ...(this.plan.functions ? { functions: this.plan.functions } : {})
        }
        this.loadVariables()
        this.loadAnimations()
        this.loadAtRuleAliases()
        this.loadVariantAliases()
        this.loadUtilities()
    }

    private applyPreloadedCounts(preloaded: MasterCSSPreloaded) {
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

    private loadAnimations() {
        const { animations } = this.plan
        if (animations) {
            for (const animationName in animations) {
                const eachAnimation: MasterCSSPlanAnimations[string] = {}
                this.animations.set(animationName, eachAnimation)
                const eachKeyframes = animations[animationName]
                for (const eachKeyframeValue in eachKeyframes) {
                    const newValueByPropertyName: any = eachAnimation[eachKeyframeValue] = {}
                    const eachKeyframeDeclarations = eachKeyframes[eachKeyframeValue as 'from' | 'to' | `$(number)%`]
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
                ...(definition.modes ? { modes: { ...definition.modes } } : {}),
                ...(definition.dependencies?.length ? { dependencies: new Set(definition.dependencies) } : {}),
                ...(definition.inline ? { inline: true } : {})
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
        this.loadBucket(this.arbitraryMatcherUtilities, buckets?.arbitrary)
    }

    private loadUtilities() {
        const { utilities } = this.plan

        if (!utilities) return

        for (const utility of utilities) {
            const definedUtility = {
                ...utility,
                matchers: utility.matchers.map((matcher) => ({ ...matcher }))
            } as CompiledUtility

            const variableAliases = [
                ...(utility.variableAliases || []),
                ...(utility.variableAliasSet !== undefined ? this.plan.variableAliasSets?.[utility.variableAliasSet] || [] : []),
                ...(utility.variableAliasRefs || []).flatMap((ref) => this.plan.variableNamespaces?.[ref] || [])
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
            this.definedUtilities.push(definedUtility)
        }
        this.loadUtilityBuckets(this.plan.utilityBuckets)
    }

    resolveVariant(token: MasterCSSPlanVariantToken) {
        return this.variants.get(token)
    }

    parseValue(token: string | number, unit = 'rem') {
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
                for (const variableKey of utility.variables.keys()) {
                    if (value.startsWith(variableKey) && isNameBoundary(value[variableKey.length])) return true
                }
                return false
            }
            case 'value': {
                const value = getKeyedValue(className, matcher.keys)
                if (value === undefined) return false
                if (!matchesValueSegmentPolicy(value, matcher)) return false
                for (const token of utility.values || []) {
                    if (value.startsWith(token) && isWordBoundary(value[token.length])) return true
                }
                switch (utility.kind) {
                    case 'color':
                        return value[0] === '#'
                            || matchesKnownFunction(value, ['color', 'color-contrast', 'color-mix', 'hwb', 'lab', 'lch', 'oklab', 'oklch', 'rgb', 'rgba', 'hsl', 'hsla', 'light-dark'])
                            || (value.startsWith('currentColor') && isNameBoundary(value[12]))
                            || (value.startsWith('transparent') && isNameBoundary(value[11]))
                    case 'number':
                        return /[\d.]/.test(value[0]) || matchesKnownFunction(value, ['max', 'min', 'calc', 'clamp'])
                    case 'image':
                        return matchesKnownFunction(value, ['url', 'linear-gradient', 'radial-gradient', 'repeating-linear-gradient', 'repeating-radial-gradient', 'conic-gradient'])
                    default:
                        return false
                }
            }
            case 'function-prefix':
                return className.startsWith(matcher.name + '(')
            case 'group':
                return className[0] === '{' && className.includes('}')
            case 'css-variable-assignment':
                return matchesCSSVariableAssignment(className)
        }
    }

    private matchesUtility(className: string, utility: CompiledUtility, matcherType?: MasterCSSPlanUtilityMatcher['type']) {
        return utility.matchers.some((matcher) =>
            (!matcherType || matcher.type === matcherType) && this.matchesMatcher(className, utility, matcher)
        )
    }

    match(className: string): CompiledUtility | undefined {
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
    }

    matchAll(className: string): CompiledUtility[] {
        /**
         * 1. variable
         * @example fg:primary bg:blue
         */
        for (const eachUtility of this.variableMatcherUtilities) {
            if (this.matchesUtility(className, eachUtility, 'variable')) return [eachUtility]
        }

        /**
         * 2. value (ambiguous.key * ambiguous.values)
         * @example bg:current box-content font:12
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
        return staticUtilities
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
        const registeredUtility = this.match(className)
        if (registeredUtility) return this.createWithDefinition(className, registeredUtility, fixedClass, mode)
    }

    createAll(className: string, fixedClass?: string, mode?: string): Utility[] {
        const utilities: Utility[] = []
        for (const registeredUtility of this.matchAll(className)) {
            const utility = this.createWithDefinition(className, registeredUtility, fixedClass, mode)
            if (utility && utility.valid) {
                utilities.push(utility)
                for (let branchIndex = 1; branchIndex < utility.branchCount; branchIndex++) {
                    const branchUtility = this.createWithDefinition(className, registeredUtility, fixedClass, mode, branchIndex)
                    if (branchUtility?.valid) utilities.push(branchUtility)
                }
            }
        }
        return utilities
    }

    createWithDefinition(className: string, registeredUtility: CompiledUtility, fixedClass?: string, mode?: string, branchIndex = 0): Utility | undefined {
        const candidate = new Utility(className, this, registeredUtility, fixedClass, mode, branchIndex)
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
        this.arbitraryMatcherUtilities.length = 0
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
