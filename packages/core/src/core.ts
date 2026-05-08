/* eslint-disable @typescript-eslint/no-unsafe-declaration-merging */
import { Utility } from './utility'
import hexToRgb from './utils/hex-to-rgb'
import extendConfig, { ExtendedConfig } from './utils/extend-config'
import { type PropertiesHyphen } from 'csstype'
import { Rule } from './rule'
import UtilityType from './utility-type'
import Layer from './layer'
import UtilityLayer from './utility-layer'
import NonLayer from './non-layer'
import { ColorVariable, DefinedUtility, GeneratedUtility, Variable } from './types/syntax'
import { AtRule, AtRuleValueNode } from './utils/parse-at'
import { AnimationDefinitions, Config, UtilityDefinition, UtilityLayerName, VariableDefinition } from './types/config'
import registerGlobal from './register-global'
import parseAt from './utils/parse-at'
import parseValue from './utils/parse-value'
import parseSelector, { SelectorNode } from './utils/parse-selector'

export default class MasterCSS {
    readonly definedUtilities: DefinedUtility[] = []
    readonly config!: ExtendedConfig
    readonly layerStatementRule = new Rule('layer-statement', '@layer base,theme,preset,main,general;')
    readonly rules: (Layer | Rule)[] = [this.layerStatementRule]
    readonly classUtilities = new Map<string, GeneratedUtility[]>()
    readonly animationsNonLayer = new NonLayer(this)
    readonly baseLayer = new UtilityLayer('base', this)
    readonly themeLayer = new Layer('theme', this)
    readonly presetLayer = new UtilityLayer('preset', this)
    readonly mainLayer = new UtilityLayer('main', this)
    readonly generalLayer = new UtilityLayer('general', this)
    readonly selectors = new Map<string, SelectorNode[]>()
    readonly variables = new Map<string, Variable>()
    readonly modes: string[] = []
    readonly atRules = new Map<string, AtRule>()
    readonly animations = new Map<string, AnimationDefinitions>()
    baseConfig?: Config
    customConfig?: Config

    constructor(config?: Config, customConfig?: Config) {
        if (customConfig === undefined) {
            this.customConfig = config
        } else {
            this.baseConfig = config
            this.customConfig = customConfig
        }
        this.resolve()
    }

    get text() {
        return this.rules
            .sort((a, b) => {
                const order = ['layer-statement', 'base', 'theme', 'preset', 'main', 'general']
                const indexA = order.indexOf(a.name) === -1 ? Infinity : order.indexOf(a.name)
                const indexB = order.indexOf(b.name) === -1 ? Infinity : order.indexOf(b.name)
                return indexA - indexB
            })
            .map(({ text }) => text).join('')
    }

    getUtilityLayer(layerName: UtilityLayerName = 'general') {
        switch (layerName) {
            case 'base':
                return this.baseLayer
            case 'preset':
                return this.presetLayer
            case 'main':
                return this.mainLayer
            case 'general':
                return this.generalLayer
            default:
                throw new Error(`Unsupported utility layer: ${layerName}`)
        }
    }

    getUtilityLayers() {
        return [this.baseLayer, this.presetLayer, this.mainLayer, this.generalLayer]
    }

    resolve(customConfig?: Config) {
        if (customConfig) {
            this.customConfig = customConfig
        } else {
            customConfig = this.customConfig
        }
        // @ts-expect-error read-only
        this.config = this.baseConfig
            ? extendConfig(this.baseConfig, customConfig)
            : extendConfig(customConfig)
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

        const utilitiesEntries = utilities.map((definition) => [definition.name, definition] as [string, UtilityDefinition])

        const utilitiesEntriesLength = utilitiesEntries.length

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
                return b[0].localeCompare(a[0], undefined, { numeric: true })
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
                    sign,
                    key: originalKey,
                    namespaces,
                } = def

                const keys: string[] = []
                let key = originalKey

                // Helper: resolve variable groups
                const addNamespace = (namespace: string) => {
                    const dashedNamespace = namespace.replace(/\./g, '-')
                    this.variables.forEach(v => {
                        if (v.namespace === namespace || v.namespace?.startsWith(namespace + '.') || v.group === namespace) {
                            let variableKey = v.name
                            if (variableKey.startsWith('-' + dashedNamespace) || variableKey.startsWith(dashedNamespace)) {
                                variableKey = variableKey.slice(dashedNamespace.length + 1)
                            }
                            if (definedUtility.variables) {
                                definedUtility.variables.set(variableKey, v)
                            } else {
                                definedUtility.variables = new Map([[variableKey, v]])
                            }
                        }
                    })
                }

                // 1. Auto variable binding
                addNamespace(id)

                // 2. Rule-defined variable groups
                if (namespaces) {
                    namespaces.forEach(addNamespace)
                }

                if (id.endsWith('()')) {
                    if (!key) def.key = key = id
                    const fnName = id.slice(0, -2)
                    matcher = new RegExp(`^${fnName}\\(`)
                } else if (type === UtilityType.NativeShorthand || type === UtilityType.Native) {
                    if (!key) def.key = key = id
                    keys.push(id)
                }

                if (sign) {
                    definedUtility.matchers.arbitrary = new RegExp(`^${sign}[^!*>+~:[@_]+\\|`)
                } else if (!matcher && type !== UtilityType.Static) {
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
            if (variable.namespace === 'screen' && variable.type === 'number' && !variable.name.startsWith('-')) {
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
        const aliasVariableModeResolvers = new Map<string, Record<string, () => void>>()
        const createVariable = (definition: VariableDefinition): Variable | undefined => {
            if (definition.namespace === 'screen' && definition.mode) {
                throw new Error(`Screen variables cannot be mode-specific: screen-${definition.key}@${definition.mode}`)
            }
            if (definition.value === false) return
            const namespace = definition.namespace
            const name = namespace
                ? `${namespace.replace(/\./g, '-')}${definition.key ? '-' + definition.key : ''}`
                : definition.key
            return {
                name,
                key: definition.key,
                value: Array.isArray(definition.value) ? definition.value.join(',') : definition.value,
                ...(namespace ? { namespace, group: namespace } : {})
            } as Variable
        }
        const resolveVariable = (variable: Variable, mode?: string) => {
            const addVariable = (name: string, newVariable: Variable, currentMode?: string) => {
                if (currentMode) {
                    const foundVariable = this.variables.get(name)
                    const newModeVariable = {
                        value: newVariable.value,
                    } as any
                    if ('alpha' in newVariable) newModeVariable.alpha = newVariable.alpha
                    if ('space' in newVariable) newModeVariable.space = newVariable.space
                    if (foundVariable) {
                        if (newVariable.type && newVariable.type !== foundVariable.type) {
                            if (process.env.NODE_ENV === 'development') {
                                console.warn(`Cannot set ${foundVariable.type} variable "${foundVariable.name}" with different type "${newVariable.type}"`)
                            }
                            return
                        }
                        if (!foundVariable.modes) foundVariable.modes = {}
                        foundVariable.modes[currentMode] = newModeVariable
                    } else {
                        const newRootVaraible = {
                            name: newVariable.name,
                            key: newVariable.key,
                            type: newVariable.type,
                            modes: { [currentMode]: newModeVariable },
                        } as Variable
                        if (newVariable.namespace) newRootVaraible.namespace = newVariable.namespace
                        if (newVariable.group) newRootVaraible.group = newVariable.group
                        this.variables.set(name, newRootVaraible)
                    }
                } else {
                    const foundVariable = this.variables.get(name)
                    if (foundVariable?.modes && !newVariable.modes) {
                        newVariable.modes = foundVariable.modes
                    }
                    this.variables.set(name, newVariable)
                }
            }
            if (typeof variable.value === 'number') {
                addVariable(variable.name, { ...variable, type: 'number' } as Variable, mode)
                addVariable('-' + variable.name, { ...variable, type: 'number', name: '-' + variable.name, key: '-' + variable.key, value: variable.value * -1 } as Variable, mode)
            } else if (typeof variable.value === 'string') {
                const aliasResult = /^\$\((.*?)\)(?: ?\/ ?(.+?))?$|^\$([a-zA-Z0-9-]+)(?: ?\/ ?(.+?))?$/.exec(variable.value)
                if (aliasResult) {
                    const alias = aliasResult[1] ?? aliasResult[3]
                    const alpha = aliasResult[2] ?? aliasResult[4]
                    let aliasVariableModeResolver = aliasVariableModeResolvers.get(variable.name)
                    if (!aliasVariableModeResolver) {
                        aliasVariableModeResolver = {}
                        aliasVariableModeResolvers.set(variable.name, aliasVariableModeResolver)
                    }
                    const resolver = aliasVariableModeResolver
                    resolver[mode as string] = () => {
                        delete resolver[mode as string]
                        if (!alias) return
                        const currentVariable = this.variables.get(variable.name)
                        const currentModeVariable = mode ? currentVariable?.modes?.[mode] : currentVariable
                        if (currentModeVariable && currentModeVariable.value !== undefined && currentModeVariable.value !== variable.value) return
                        const eachAliasModeVariableResolver = aliasVariableModeResolvers.get(alias)
                        if (eachAliasModeVariableResolver) {
                            for (const mode of Object.keys(eachAliasModeVariableResolver)) {
                                eachAliasModeVariableResolver[mode]?.()
                            }
                        }
                        const aliasVariable = this.variables.get(alias)
                        if (aliasVariable) {
                            let resolvedAlpha: number | undefined
                            if (alpha) {
                                const numberAlpha = Number(alpha) * ((aliasVariable as any).alpha || 1)
                                if (numberAlpha < 1) resolvedAlpha = numberAlpha
                            }
                            const newVariable = {
                                ...variable,
                                type: aliasVariable.type,
                                value: aliasVariable.value,
                            } as Variable
                            if (aliasVariable.type === 'color') {
                                if (resolvedAlpha !== undefined)
                                    (newVariable as ColorVariable).alpha = resolvedAlpha
                                if (aliasVariable.space) {
                                    (newVariable as ColorVariable).space = aliasVariable.space
                                }
                            }
                            addVariable(newVariable.name, newVariable, mode)
                            if (aliasVariable.modes) {
                                for (const eachMode in aliasVariable.modes) {
                                    const aliasModeVariable = aliasVariable.modes[eachMode]
                                    addVariable(newVariable.name, aliasModeVariable as Variable, eachMode)
                                }
                            }
                        }
                        if (process.env.NODE_ENV === 'development') {
                            if (!aliasVariable) {
                                console.warn(`Variable "${alias}" not found for "${variable.name}"`)
                            }
                        }
                    }
                } else {
                    // 1. HEX
                    const hexMatch = /^#([a-f0-9]{3,4}|[a-f0-9]{6}|[a-f0-9]{8})$/i.exec(variable.value)
                    if (hexMatch) {
                        const [r, g, b, a] = hexToRgb(hexMatch[1])
                        const newVariable = {
                            ...variable,
                            type: 'color',
                            value: `${r} ${g} ${b}`,
                            space: 'rgb'
                        } as any
                        if (a !== undefined && a < 1) {
                            newVariable.alpha = a
                        }
                        addVariable(newVariable.name, newVariable, mode)
                        return
                    }

                    // 2. COLOR FUNCTION
                    const funcMatch = /^(color|color-contrast|color-mix|hwb|lab|lch|oklab|oklch|rgb|hsl|light-dark)\((.+)\)$/i.exec(variable.value)
                    if (funcMatch) {
                        let [, space, rawArgs] = funcMatch
                        space = space.toLowerCase()
                        const normalizedArgs = rawArgs
                            .replace(/\s*\/\s*/g, '/')
                            .replace(/\s*,\s*/g, ' ')
                            .replace(/\s+/g, ' ')
                            .trim()

                        let alpha: number | undefined
                        const alphaMatch = /^(.+?)\/([^\s]+)$/.exec(normalizedArgs)
                        const finalArgs = alphaMatch ? alphaMatch[1].trim() : normalizedArgs
                        alpha = alphaMatch ? Number(alphaMatch[2]) : undefined
                        const newVariable: any = {
                            ...variable,
                            type: 'color',
                            value: finalArgs,
                            space
                        }
                        if (alpha !== undefined) {
                            newVariable.alpha = alpha
                        }
                        addVariable(newVariable.name, newVariable, mode)
                        return
                    }

                    // 3. Fallback
                    addVariable(variable.name, { ...variable, type: 'string' } as Variable, mode)
                }
            }
        }

        for (const definition of variables) {
            const variable = createVariable(definition)
            if (variable) {
                resolveVariable(variable, definition.mode)
            }
        }

        // todo: address to the target variable
        aliasVariableModeResolvers.forEach((aliasVariableModeResolver) => {
            for (const mode of Object.keys(aliasVariableModeResolver)) {
                aliasVariableModeResolver[mode]?.()
            }
        })

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
        return this.matchAll(className)[0]
    }

    matchAll(className: string): DefinedUtility[] {
        /**
         * 1. variable
         * @example fg:primary bg:blue
         */
        for (const eachUtility of this.definedUtilities) {
            if (eachUtility.matchers.variable?.test(className)) return [eachUtility]
        }

        /**
         * 2. value (ambiguous.key * ambiguous.values)
         * @example bg:current box-content font:12
         */
        for (const eachUtility of this.definedUtilities) {
            if (eachUtility.matchers.value?.test(className)) return [eachUtility]
        }

        /**
         * 3. full key
         * @example text-align:center color:blue-40
         */
        for (const eachUtility of this.definedUtilities) {
            if (eachUtility.matchers.key?.test(className)) return [eachUtility]
        }

        /**
         * 4. arbitrary
         * @example custom RegExp, utility
         */
        const staticUtilities: DefinedUtility[] = []
        for (const eachUtility of this.definedUtilities) {
            if (!eachUtility.matchers.arbitrary?.test(className)) continue
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
     * @returns GeneratedUtility[]
     */
    generate(className: string, mode?: string): Utility[]
    generate(className: string, mode?: string): GeneratedUtility[] {
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
            const utility = layer.rules.find((rule): rule is Utility =>
                rule instanceof Utility
                && rule.key === key
                && rule.registeredUtility === registeredUtility
            )
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
    refresh(customConfig?: Config) {
        this.reset()
        this.resolve(customConfig)
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
        this.baseLayer.reset()
        this.themeLayer.reset()
        this.presetLayer.reset()
        this.mainLayer.reset()
        this.generalLayer.reset()
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
