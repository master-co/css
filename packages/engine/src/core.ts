/* eslint-disable @typescript-eslint/no-unsafe-declaration-merging */
import { Utility } from './utility'
import { type PropertiesHyphen } from 'csstype'
import type { Rule } from './rule'
import Layer from './layer'
import ThemeLayer from './theme-layer'
import UtilityLayer from './utility-layer'
import NonLayer from './non-layer'
import type { Variable } from 'shared/css-syntax'
import { AtRule, AtRuleValueNode } from './utils/parse-at'
import type { AtIdentifier } from 'shared/css-config'
import parseAt from './utils/parse-at'
import parseValue from './utils/parse-value'
import parseSelector, { SelectorNode } from './utils/parse-selector'
import { normalizeVariableValue } from './utils/css-variables'
import type { MasterCSSPreloaded } from './preloaded'
import type {
    MasterCSSPlan,
    MasterCSSPlanAnimations,
    MasterCSSPlanFunctions,
    MasterCSSPlanSettings,
    MasterCSSPlanUtility,
    MasterCSSPlanUtilityLayerName,
    MasterCSSPlanUtilityMatcher,
    MasterCSSPlanVariable,
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

export default class MasterCSS {
    readonly definedUtilities: CompiledUtility[] = []
    protected readonly variableMatcherUtilities: CompiledUtility[] = []
    protected readonly valueMatcherUtilities: CompiledUtility[] = []
    protected readonly keyMatcherUtilities: CompiledUtility[] = []
    protected readonly arbitraryMatcherUtilities: CompiledUtility[] = []
    readonly config!: EngineSettings
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
        // @ts-expect-error read-only
        this.plan = plan
        this.resolve()
    }

    private resolve() {
        // @ts-expect-error read-only
        this.config = {
            ...DEFAULT_SETTINGS,
            ...(this.plan.settings || {}),
            modes: this.plan.settings?.modes ? [...this.plan.settings.modes] : [...DEFAULT_SETTINGS.modes],
            ...(this.plan.functions ? { functions: this.plan.functions } : {})
        }
        this.resolveVariables()
        this.resolveAnimations()
        this.resolveAtRules()
        this.resolveVariants()
        this.resolveUtilities()
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

    resolveAnimations() {
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

    resolveUtilities() {
        const { utilities } = this.plan

        if (!utilities) return

        const variablesByNamespace = new Map<string, [string, Variable][]>()
        const getVariableKeyByNamespace = (variableName: string, namespace: string) => {
            const negative = variableName.startsWith('-')
            const positiveName = negative ? variableName.slice(1) : variableName
            if (positiveName !== namespace && !positiveName.startsWith(namespace + '-')) return
            const variableKey = positiveName === namespace
                ? ''
                : positiveName.slice(namespace.length + 1)
            return negative ? '-' + variableKey : variableKey
        }
        const addVariableAliasToNamespace = (namespace: string, variableKey: string, variable: Variable) => {
            const namespaceVariables = variablesByNamespace.get(namespace)
            if (namespaceVariables) {
                namespaceVariables.push([variableKey, variable])
            } else {
                variablesByNamespace.set(namespace, [[variableKey, variable]])
            }
        }
        const addVariableToNamespace = (namespace: string, variable: Variable) => {
            const variableKey = getVariableKeyByNamespace(variable.name, namespace)
            if (variableKey !== undefined) addVariableAliasToNamespace(namespace, variableKey, variable)
        }
        for (const variable of this.variables.values()) {
            const namespaces = new Set<string>()
            if (variable.namespace) namespaces.add(variable.namespace)
            for (const namespace of namespaces) {
                addVariableToNamespace(namespace, variable)
            }
        }

        for (const utility of utilities) {
            const definedUtility = {
                ...utility,
                matchers: utility.matchers.map((matcher) => ({ ...matcher }))
            } as CompiledUtility

            const addVariable = (variableKey: string, variable: Variable) => {
                if (definedUtility.variables?.has(variableKey)) return
                if (definedUtility.variables) {
                    definedUtility.variables.set(variableKey, variable)
                } else {
                    definedUtility.variables = new Map([[variableKey, variable]])
                }
            }
            const addNamespace = (namespace: string) => {
                for (const [variableKey, variable] of variablesByNamespace.get(namespace) || []) {
                    addVariable(variableKey, variable)
                }
            }
            const addMatchedNamespaces = (namespaces: string[]) => {
                const sortedNamespaces = [...new Set(namespaces)]
                    .sort((a, b) => b.length - a.length)
                for (const variable of this.variables.values()) {
                    for (const namespace of sortedNamespaces) {
                        const variableKey = getVariableKeyByNamespace(variable.name, namespace)
                        if (variableKey !== undefined) addVariable(variableKey, variable)
                    }
                }
            }

            if (definedUtility.implicitNamespace !== false) addNamespace(definedUtility.name)
            if (definedUtility.namespaces) addMatchedNamespaces(definedUtility.namespaces)

            this.definedUtilities.push(definedUtility)

            for (const matcher of definedUtility.matchers) {
                switch (matcher.type) {
                    case 'variable':
                        if (definedUtility.variables?.size) this.variableMatcherUtilities.push(definedUtility)
                        break
                    case 'value':
                        if (definedUtility.values?.length || definedUtility.kind) this.valueMatcherUtilities.push(definedUtility)
                        break
                    case 'key':
                        this.keyMatcherUtilities.push(definedUtility)
                        break
                    default:
                        this.arbitraryMatcherUtilities.push(definedUtility)
                        break
                }
            }
        }

    }

    resolveAtRules() {
        for (const variable of this.variables.values()) {
            if (variable.namespace === 'breakpoint' && variable.type === 'number' && variable.value !== undefined && !variable.name.startsWith('-')) {
                const node = this.parseValue(variable.value)
                const atRule = {
                    id: 'media',
                    nodes: [node as unknown as AtRuleValueNode]
                } as AtRule
                this.atRules.set(variable.key, atRule)
                this.breakpointAtRules.set(variable.key, atRule)
            } else if (variable.namespace === 'container' && variable.type === 'number' && variable.value !== undefined && !variable.name.startsWith('-')) {
                const node = this.parseValue(variable.value)
                this.containerAtRules.set(variable.key, {
                    id: 'container',
                    nodes: [node as unknown as AtRuleValueNode]
                })
            }
        }
    }

    resolveVariants() {
        const { variants } = this.plan
        if (!variants) return

        for (const variant of variants) {
            if (!/^(?::{1,2}.+|@.+)$/.test(variant.token)) {
                throw new Error(`Invalid variant token: ${variant.token}`)
            }

            if (variant.token.startsWith('@')) {
                const name = variant.token.slice(1)
                if (/^[\w-]+$/.test(name)) {
                    if (this.modes.includes(name)) {
                        throw new Error(`Variant "${name}" conflicts with mode "${name}"`)
                    }
                    if (this.breakpointAtRules.has(name)) {
                        throw new Error(`Variant "${name}" conflicts with breakpoint variable "--breakpoint-${name}"`)
                    }
                    if (this.containerAtRules.has(name)) {
                        throw new Error(`Variant "${name}" conflicts with container variable "--container-${name}"`)
                    }
                }
            }

            for (const branch of variant.branches) {
                if (branch.selector && !branch.selector.includes('&')) {
                    throw new Error(`Variant "${variant.token}" selector branch must include "&"`)
                }
            }

            this.variants.set(variant.token, variant.branches.map((branch) => ({
                ...branch,
                ...(branch.atRules?.length ? { atRules: [...branch.atRules] } : {})
            })))

            if (variant.token.startsWith(':') && variant.branches.length === 1) {
                const selector = variant.branches[0].selector?.trim()
                if (selector) {
                    const bodylessSelector = selector.includes('&')
                        ? selector.replace(/&/g, '')
                        : selector
                    this.selectors.set(variant.token, parseSelector(bodylessSelector, this, false))
                }
            } else if (variant.token.startsWith('@') && variant.branches.length === 1) {
                const branch = variant.branches[0]
                if (branch.layer) {
                    this.atRules.set(variant.token.slice(1), {
                        id: 'layer',
                        nodes: [{
                            type: 'string',
                            value: branch.layer
                        } as AtRuleValueNode]
                    })
                } else if (branch.atRules?.[0]) {
                    this.atRules.set(variant.token.slice(1), parseAt(branch.atRules[0], this, false))
                }
            }
        }
    }

    resolveVariant(token: MasterCSSPlanVariantToken) {
        return this.variants.get(token)
    }

    resolveVariables() {
        const { variables = [] } = this.plan
        const { modes = [] } = this.config
        this.modes.push(...modes)
        const getVariableName = (definition: MasterCSSPlanVariable) => {
            return definition.namespace
                ? `${definition.namespace}${definition.key ? '-' + definition.key : ''}`
                : definition.key
        }
        const inlineVariableNames = new Set<string>()
        const modeVariableNames = new Map<string, string>()
        for (const definition of variables) {
            if (definition.value === false) continue
            const name = getVariableName(definition)
            if (definition.inline) inlineVariableNames.add(name)
            if (definition.mode) modeVariableNames.set(name, definition.mode)
        }
        for (const name of inlineVariableNames) {
            const mode = modeVariableNames.get(name)
            if (mode) {
                throw new Error(`Inline theme variables cannot be mode-specific: ${name}@${mode}`)
            }
        }
        const createVariable = (definition: MasterCSSPlanVariable): Variable | undefined => {
            const namespace = definition.namespace
            const name = getVariableName(definition)
            if (definition.inline && definition.mode) {
                throw new Error(`Inline theme variables cannot be mode-specific: ${name}@${definition.mode}`)
            }
            if ((definition.namespace === 'breakpoint' || definition.namespace === 'container') && definition.mode) {
                throw new Error(`${definition.namespace[0].toUpperCase()}${definition.namespace.slice(1)} variables cannot be mode-specific: ${definition.namespace}-${definition.key}@${definition.mode}`)
            }
            if (definition.value === false) return
            return {
                name,
                key: definition.key,
                value: Array.isArray(definition.value) ? definition.value.join(',') : definition.value,
                ...(namespace ? { namespace } : {}),
                ...(definition.inline ? { inline: true } : {})
            } as Variable
        }
        const addDependencies = (variable: Variable) => {
            const add = (value: string | number | undefined) => {
                if (value === undefined) return
                for (const dependency of normalizeVariableValue(value).dependencies) {
                    if (dependency !== variable.name) {
                        variable.dependencies?.add(dependency) ?? (variable.dependencies = new Set([dependency]))
                    }
                }
            }
            add(variable.value)
            for (const modeVariable of Object.values(variable.modes || {})) {
                add(modeVariable.value)
            }
        }
        const addVariable = (name: string, variable: Variable, mode?: string) => {
            const type = typeof variable.value === 'number' ? 'number' : 'string'
            const newVariable = { ...variable, type } as Variable
            if (mode) {
                const foundVariable = this.variables.get(name)
                const modeVariable = {
                    type,
                    value: newVariable.value
                } as NonNullable<Variable['modes']>[string]
                if (foundVariable) {
                    if (!foundVariable.modes) foundVariable.modes = {}
                    foundVariable.modes[mode] = modeVariable
                    addDependencies(foundVariable)
                } else {
                    const rootVariable = {
                        name: newVariable.name,
                        key: newVariable.key,
                        type,
                        modes: { [mode]: modeVariable },
                        ...(newVariable.namespace ? { namespace: newVariable.namespace } : {}),
                        ...(newVariable.inline ? { inline: true } : {})
                    } as Variable
                    addDependencies(rootVariable)
                    this.variables.set(name, rootVariable)
                }
            } else {
                const foundVariable = this.variables.get(name)
                if (foundVariable?.modes && !newVariable.modes) {
                    newVariable.modes = foundVariable.modes
                }
                addDependencies(newVariable)
                this.variables.set(name, newVariable)
            }
        }
        const resolveVariable = (variable: Variable, mode?: string) => {
            if (typeof variable.value === 'number') {
                addVariable(variable.name, { ...variable, type: 'number' } as Variable, mode)
                addVariable('-' + variable.name, { ...variable, type: 'number', name: '-' + variable.name, key: '-' + variable.key, value: variable.value * -1 } as Variable, mode)
            } else {
                addVariable(variable.name, { ...variable, type: 'string' } as Variable, mode)
            }
        }

        for (const definition of variables) {
            const variable = createVariable(definition)
            if (variable) {
                resolveVariable(variable, definition.mode)
            }
        }

    }

    parseValue(token: string | number, unit = 'rem') {
        return parseValue(token, unit, this.config.rootSize)
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
                for (const variableKey of utility.variables.keys()) {
                    if (value.startsWith(variableKey) && isNameBoundary(value[variableKey.length])) return true
                }
                return false
            }
            case 'value': {
                const value = getKeyedValue(className, matcher.keys)
                if (value === undefined) return false
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
                (i === 0 || i === 1) && (eachField === this.config.scope)
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
        switch (this.config.modeTrigger) {
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
