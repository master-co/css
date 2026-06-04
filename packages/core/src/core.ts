/* eslint-disable @typescript-eslint/no-unsafe-declaration-merging */
import { Utility } from './utility'
import { type ExtendedConfig } from './utils/extend-config'
import { type PropertiesHyphen } from 'csstype'
import type { Rule } from './rule'
import UtilityType from 'shared/utility-type'
import Layer from './layer'
import ThemeLayer from './theme-layer'
import UtilityLayer from './utility-layer'
import NonLayer from './non-layer'
import type { DefinedUtility, Variable } from 'shared/css-syntax'
import { AtRule, AtRuleValueNode } from './utils/parse-at'
import type { AnimationDefinitions, Config, UtilityDefinition, UtilityLayerName, VariableDefinition } from 'shared/css-config'
import registerGlobal from './register-global'
import parseAt from './utils/parse-at'
import parseValue from './utils/parse-value'
import parseSelector, { SelectorNode } from './utils/parse-selector'
import { normalizeVariableValue } from './utils/css-variables'
import naturalCompare from './utils/natural-compare'

export default class MasterCSS {
    readonly definedUtilities: DefinedUtility[] = []
    protected readonly variableMatcherUtilities: DefinedUtility[] = []
    protected readonly valueMatcherUtilities: DefinedUtility[] = []
    protected readonly keyMatcherUtilities: DefinedUtility[] = []
    protected readonly arbitraryMatcherUtilities: DefinedUtility[] = []
    readonly config!: ExtendedConfig
    readonly rules: (Layer | Rule)[] = []
    readonly classUtilities = new Map<string, Utility[]>()
    readonly animationsNonLayer = new NonLayer(this)
    readonly baseLayer = new UtilityLayer('base', this)
    readonly themeLayer = new ThemeLayer('theme', this)
    readonly presetLayer = new UtilityLayer('preset', this)
    readonly componentsLayer = new UtilityLayer('components', this)
    readonly utilitiesLayer = new UtilityLayer('utilities', this)
    readonly selectors = new Map<string, SelectorNode[]>()
    readonly variables = new Map<string, Variable>()
    readonly modes: string[] = []
    readonly atRules = new Map<string, AtRule>()
    readonly animations = new Map<string, AnimationDefinitions>()

    constructor(config?: Config) {
        this.resolve(config)
    }

    get text() {
        return this.rules
            .sort((a, b) => {
                const order = ['theme', 'base', 'preset', 'components', 'utilities']
                const indexA = order.indexOf(a.name) === -1 ? Infinity : order.indexOf(a.name)
                const indexB = order.indexOf(b.name) === -1 ? Infinity : order.indexOf(b.name)
                return indexA - indexB
            })
            .map(({ text }) => text).join('')
    }

    getUtilityLayer(layerName: UtilityLayerName = 'utilities') {
        switch (layerName) {
            case 'base':
                return this.baseLayer
            case 'preset':
                return this.presetLayer
            case 'components':
                return this.componentsLayer
            case 'utilities':
                return this.utilitiesLayer
            default:
                throw new Error(`Unsupported utility layer: ${layerName}`)
        }
    }

    getUtilityLayers() {
        return [this.baseLayer, this.presetLayer, this.componentsLayer, this.utilitiesLayer]
    }

    resolve(config: Config = this.config) {
        // @ts-expect-error read-only
        this.config = config || {}
        this.resolveVariables()
        this.resolveAnimations()
        this.resolveSelectors()
        this.resolveAtRules()
        this.resolveUtilities()
    }

    resolveAnimations() {
        const { animations } = this.config
        if (animations) {
            for (const animationName in animations) {
                const eachAnimation: AnimationDefinitions = {}
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
        const { utilities } = this.config

        function escapeString(str: string) {
            return str.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')
        }

        if (!utilities) return

        const utilitiesEntries = utilities.map((definition) => [definition.name, { ...definition }] as [string, UtilityDefinition])

        const utilitiesEntriesLength = utilitiesEntries.length
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

        // Main loop
        utilitiesEntries
            .sort((a, b) => {
                if (a[1].type !== b[1].type) {
                    return (b[1].type || 0) - (a[1].type || 0)
                }
                if (a[1].kind !== b[1].kind) {
                    if (!a[1].kind) return 1
                    if (!b[1].kind) return -1
                    const kindOrder = ['color', 'number', 'image']
                    const aKindIndex = kindOrder.indexOf(a[1].kind)
                    const bKindIndex = kindOrder.indexOf(b[1].kind)
                    if (aKindIndex !== bKindIndex) {
                        return aKindIndex - bKindIndex
                    }
                }
                return naturalCompare(b[0], a[0])
            })
            .forEach(([id, def], index) => {
                const order = utilitiesEntriesLength - 1 - index

                const definedUtility: DefinedUtility = {
                    id,
                    keys: [],
                    matchers: {},
                    order,
                    definition: def,
                }

                def.unit ??= ''
                def.separators ??= [',']

                this.definedUtilities.push(definedUtility)

                let {
                    matcher,
                    type,
                    subkey,
                    aliasGroups,
                    values,
                    kind,
                    key: originalKey,
                    namespaces,
                } = def

                const keys: string[] = []
                let key = originalKey

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

                // 1. Auto variable binding
                addNamespace(id)

                // 2. Rule-defined variable namespaces
                if (namespaces) {
                    addMatchedNamespaces(namespaces)
                }

                if (id.endsWith('()')) {
                    if (!key) def.key = key = id
                    const fnName = id.slice(0, -2)
                    matcher = new RegExp(`^${fnName}\\(`)
                } else if (type === UtilityType.NativeShorthand || type === UtilityType.Native) {
                    if (!key) def.key = key = id
                    keys.push(id)
                }

                if (!matcher && type !== UtilityType.Static) {
                    if (!key && !subkey) {
                        keys.push(id)
                    } else {
                        if (key && !keys.includes(key)) keys.push(key)
                        if (subkey) keys.push(subkey)
                        if (type === UtilityType.Shorthand) keys.push(id)
                    }

                    // Ambiguous keys and values
                    if (aliasGroups?.length) {
                        const keyPattern = aliasGroups.length > 1
                            ? `(?:${aliasGroups.join('|')})`
                            : aliasGroups[0]

                        const variableKeys = Array.from(definedUtility.variables?.keys() || [])
                        const valuePatterns = values
                            ? values.map((v) => `${v}(?:\\b|_)`)
                            : []
                        switch (kind) {
                            case 'color':
                                valuePatterns.push(`(?:#|(?:color|color-contrast|color-mix|hwb|lab|lch|oklab|oklch|rgb|rgba|hsl|hsla|light-dark)\\(.*\\)|(?:currentColor|transparent)(?![a-zA-Z0-9-]))`)
                                break
                            case 'number':
                                valuePatterns.push('(?:[\\d.]|(?:max|min|calc|clamp)\\([^|]*\\))')
                                break
                            case 'image':
                                valuePatterns.push('(?:url|linear-gradient|radial-gradient|repeating-linear-gradient|repeating-radial-gradient|conic-gradient)\\(.*\\)')
                                break
                        }
                        if (valuePatterns?.length) {
                            definedUtility.matchers.value = new RegExp(
                                `^${keyPattern}:(?:${valuePatterns.join('|')})[^|]*?(?:@|$)`
                            )
                        }

                        if (variableKeys.length) {
                            definedUtility.matchers.variable = new RegExp(
                                `^${keyPattern}:(?:${variableKeys.join('|')})(?![a-zA-Z0-9-])[^|]*?(?:@|$)`
                            )
                        }
                    }
                } else if (matcher) {
                    definedUtility.matchers.arbitrary = new RegExp(matcher)
                }

                // Static rule matcher
                if (type === UtilityType.Static) {
                    const utilityName = id.startsWith('.') ? id.slice(1) : id
                    definedUtility.id = '.' + utilityName
                    definedUtility.matchers.arbitrary = new RegExp(
                        '^' + escapeString(utilityName) + '(?=!|\\*|>|\\+|~|:|\\[|@|_|\\.|$)',
                        'm'
                    )
                }

                // Key matcher
                if (keys.length) {
                    definedUtility.keys = keys
                    definedUtility.matchers.key = new RegExp(
                        `^${keys.length > 1 ? `(${keys.join('|')})` : keys[0]}:.`
                    )
                }

                if (definedUtility.matchers.variable) this.variableMatcherUtilities.push(definedUtility)
                if (definedUtility.matchers.value) this.valueMatcherUtilities.push(definedUtility)
                if (definedUtility.matchers.key) this.keyMatcherUtilities.push(definedUtility)
                if (definedUtility.matchers.arbitrary) this.arbitraryMatcherUtilities.push(definedUtility)
            })

    }

    resolveSelectors() {
        const { selectorTokens } = this.config
        if (selectorTokens) {
            for (const token in selectorTokens) {
                const value = selectorTokens[token]
                const nodes = parseSelector(value, this, false)
                this.selectors.set(token, nodes)
            }
        }
    }

    resolveAtRules() {
        for (const variable of this.variables.values()) {
            if (variable.namespace === 'screen' && variable.type === 'number' && variable.value !== undefined && !variable.name.startsWith('-')) {
                const node = this.parseValue(variable.value)
                this.atRules.set(variable.key, {
                    id: 'media',
                    nodes: [node as unknown as AtRuleValueNode]
                })
            }
        }

        const { atTokens } = this.config
        if (atTokens) {
            for (const token in atTokens) {
                const value = atTokens[token]
                if (typeof value === 'number') {
                    const node = this.parseValue(value)
                    this.atRules.set(token, {
                        id: 'media',
                        nodes: [node as unknown as AtRuleValueNode]
                    })
                } else {
                    const atRule = parseAt(value, this, false)
                    this.atRules.set(token, atRule)
                }
            }
        }
    }

    resolveVariables() {
        const { variables = [], modes = [] } = this.config
        this.modes.push(...modes)
        const createVariable = (definition: VariableDefinition): Variable | undefined => {
            if (definition.namespace === 'screen' && definition.mode) {
                throw new Error(`Screen variables cannot be mode-specific: screen-${definition.key}@${definition.mode}`)
            }
            if (definition.value === false) return
            const namespace = definition.namespace
            const name = namespace
                ? `${namespace}${definition.key ? '-' + definition.key : ''}`
                : definition.key
            return {
                name,
                key: definition.key,
                value: Array.isArray(definition.value) ? definition.value.join(',') : definition.value,
                ...(namespace ? { namespace } : {})
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
                        ...(newVariable.namespace ? { namespace: newVariable.namespace } : {})
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
    match(className: string): DefinedUtility | undefined {
        for (const eachUtility of this.variableMatcherUtilities) {
            if (eachUtility.matchers.variable!.test(className)) return eachUtility
        }

        for (const eachUtility of this.valueMatcherUtilities) {
            if (eachUtility.matchers.value!.test(className)) return eachUtility
        }

        for (const eachUtility of this.keyMatcherUtilities) {
            if (eachUtility.matchers.key!.test(className)) return eachUtility
        }

        for (const eachUtility of this.arbitraryMatcherUtilities) {
            if (eachUtility.matchers.arbitrary!.test(className)) return eachUtility
        }
    }

    matchAll(className: string): DefinedUtility[] {
        /**
         * 1. variable
         * @example fg:primary bg:blue
         */
        for (const eachUtility of this.variableMatcherUtilities) {
            if (eachUtility.matchers.variable!.test(className)) return [eachUtility]
        }

        /**
         * 2. value (ambiguous.key * ambiguous.values)
         * @example bg:current box-content font:12
         */
        for (const eachUtility of this.valueMatcherUtilities) {
            if (eachUtility.matchers.value!.test(className)) return [eachUtility]
        }

        /**
         * 3. full key
         * @example text-align:center color:blue-40
         */
        for (const eachUtility of this.keyMatcherUtilities) {
            if (eachUtility.matchers.key!.test(className)) return [eachUtility]
        }

        /**
         * 4. arbitrary
         * @example custom RegExp, utility
         */
        const staticUtilities: DefinedUtility[] = []
        for (const eachUtility of this.arbitraryMatcherUtilities) {
            if (!eachUtility.matchers.arbitrary!.test(className)) continue
            if (eachUtility.definition.type === UtilityType.Static) {
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
            if (utility && utility.valid) utilities.push(utility)
        }
        return utilities
    }

    createWithDefinition(className: string, registeredUtility: DefinedUtility, fixedClass?: string, mode?: string): Utility | undefined {
        const key = (fixedClass ? fixedClass + ' ' : '') + className
        for (const layer of this.getUtilityLayers()) {
            const rule = layer.get(key)
            const utility = rule instanceof Utility && rule.registeredUtility === registeredUtility
                ? rule
                : undefined
            if (utility) return utility
        }
        return new Utility(className, this, registeredUtility, fixedClass, mode)
    }

    /**
     * Create utility from given selector text
     * @param selectorText
     */
    createFromSelectorText(selectorText: string, layerName?: UtilityLayerName) {
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
    refresh(config: Config = this.config) {
        this.reset()
        this.resolve(config)
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
        this.presetLayer.reset()
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

(function (MasterCSS) {
    registerGlobal(MasterCSS)
})(MasterCSS)
