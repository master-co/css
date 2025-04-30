/* eslint-disable @typescript-eslint/no-unsafe-declaration-merging */
import { SyntaxRule } from './syntax-rule'
import { config as defaultConfig } from './config'
import hexToRgb from './utils/hex-to-rgb'
import { flattenObject } from './utils/flatten-object'
import extendConfig from './utils/extend-config'
import { type PropertiesHyphen } from 'csstype'
import { Rule } from './rule'
import SyntaxRuleType from './syntax-rule-type'
import Layer from './layer'
import SyntaxLayer from './syntax-layer'
import NonLayer from './non-layer'
import { ColorVariable, DefinedRule, Variable } from './types/syntax'
import { AtRule, AtRuleValueNode } from './utils/parse-at'
import { AnimationDefinitions, Config, SyntaxRuleDefinition, VariableDefinition } from './types/config'
import registerGlobal from './register-global'
import parseAt from './utils/parse-at'
import parseValue from './utils/parse-value'
import parseSelector, { SelectorNode } from './utils/parse-selector'

export default class MasterCSS {
    static config: Config = defaultConfig
    readonly definedRules: DefinedRule[] = []
    readonly config!: Config
    readonly layerStatementRule = new Rule('layer-statement', '@layer base,theme,preset,components,general;')
    readonly rules: (Layer | Rule)[] = [this.layerStatementRule]
    readonly classRules = new Map<string, SyntaxRule[]>()
    readonly animationsNonLayer = new NonLayer(this)
    readonly baseLayer = new SyntaxLayer('base', this)
    readonly themeLayer = new Layer('theme', this)
    readonly presetLayer = new SyntaxLayer('preset', this)
    readonly componentsLayer = new SyntaxLayer('components', this)
    readonly generalLayer = new SyntaxLayer('general', this)
    readonly components = new Map<string, string[]>()
    readonly selectors = new Map<string, SelectorNode[]>()
    readonly variables = new Map<string, Variable>()
    readonly modes: string[] = []
    readonly atRules = new Map<string, AtRule>()
    readonly animations = new Map<string, AnimationDefinitions>()

    constructor(
        public customConfig?: Config
    ) {
        this.resolve(customConfig)
    }

    get text() {
        return this.rules
            .sort((a, b) => {
                const order = ['layer-statement', 'base', 'theme', 'preset', 'components', 'general']
                const indexA = order.indexOf(a.name) === -1 ? Infinity : order.indexOf(a.name)
                const indexB = order.indexOf(b.name) === -1 ? Infinity : order.indexOf(b.name)
                return indexA - indexB
            })
            .map(({ text }) => text).join('')
    }

    resolve(customConfig?: Config) {
        if (customConfig) {
            this.customConfig = customConfig
        } else {
            customConfig = this.customConfig
        }
        // @ts-expect-error read-only
        this.config = customConfig?.override
            ? extendConfig(customConfig)
            : extendConfig(defaultConfig, customConfig)
        this.resolveVariables()
        this.resolveAnimations()
        this.resolveSelectors()
        this.resolveAtRules()
        this.resolveRules()
        this.resolveComponents()
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

    resolveRules() {
        const { rules, utilities } = this.config

        function escapeString(str: string) {
            return str.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')
        }

        if (!rules && !utilities) return

        const rulesEntries: [string, SyntaxRuleDefinition][] = []

        // Collect utility rules
        if (utilities) {
            for (const utilityName in utilities) {
                const declarations = utilities[utilityName] as any
                rulesEntries.push([
                    utilityName,
                    { declarations, type: SyntaxRuleType.Utility },
                ])
            }
        }

        // Collect normal rules
        if (rules) {
            rulesEntries.push(...Object.entries(rules) as [string, SyntaxRuleDefinition][])
        }

        const rulesEntriesLength = rulesEntries.length

        // Prepare color variables
        const colorNames = new Set(['current', 'currentColor', 'transparent'])
        this.variables.forEach(v => {
            if (v.type === 'color') colorNames.add(v.name)
        })
        const colorPattern = [...colorNames].join('|')

        // Main loop
        rulesEntries
            .sort((a, b) => {
                if (a[1].type !== b[1].type) {
                    return (b[1].type || 0) - (a[1].type || 0)
                }
                return b[0].localeCompare(a[0], undefined, { numeric: true })
            })
            .forEach(([id, def], index) => {
                const order = rulesEntriesLength - 1 - index

                const syntax: DefinedRule = {
                    id,
                    keys: [],
                    variables: {},
                    matchers: {},
                    order,
                    definition: def,
                }

                def.unit ??= ''
                def.separators ??= [',']

                this.definedRules.push(syntax)

                let {
                    matcher,
                    type,
                    subkey,
                    aliasGroups,
                    values,
                    sign,
                    key: originalKey,
                    variables: ruleVariableGroups,
                } = def

                const keys: string[] = []
                let key = originalKey

                // Helper: resolve variable groups
                const addResolvedVariables = (groupName: string) => {
                    this.variables.forEach(v => {
                        if (v.group === groupName) {
                            syntax.variables[v.key] = v
                        }
                    })
                }

                // Rule-defined variable groups
                if (ruleVariableGroups) {
                    ruleVariableGroups.forEach(addResolvedVariables)
                }

                // Auto variable binding
                addResolvedVariables(id)

                if (id.endsWith('()')) {
                    if (!key) def.key = key = id
                    const fnName = id.slice(0, -2)
                    matcher = new RegExp(`^${fnName}\\(`)
                } else if (type === SyntaxRuleType.NativeShorthand || type === SyntaxRuleType.Native) {
                    if (!key) def.key = key = id
                    keys.push(id)
                }

                if (sign) {
                    syntax.matchers.arbitrary = new RegExp(`^${sign}[^!*>+~:[@_]+\\|`)
                } else if (!matcher) {
                    if (!key && !subkey) {
                        keys.push(id)
                    } else {
                        if (key && !keys.includes(key)) keys.push(key)
                        if (subkey) keys.push(subkey)
                        if (type === SyntaxRuleType.Shorthand) keys.push(id)
                    }

                    // Ambiguous keys and values
                    if (aliasGroups?.length) {
                        const keyPattern = aliasGroups.length > 1
                            ? `(?:${aliasGroups.join('|')})`
                            : aliasGroups[0]

                        const variableKeys = Object.keys(syntax.variables)
                        if (values?.length) {
                            const valuePatterns = values.map(val =>
                                val instanceof RegExp
                                    ? val.source.replace('\\$colors', colorPattern)
                                    : `${val}(?:\\b|_)`
                            )
                            syntax.matchers.value = new RegExp(
                                `^${keyPattern}:(?:${valuePatterns.join('|')})[^|]*?(?:@|$)`
                            )
                        }

                        if (variableKeys.length) {
                            syntax.matchers.variable = new RegExp(
                                `^${keyPattern}:(?:${variableKeys.join('|')}(?![a-zA-Z0-9-]))[^|]*?(?:@|$)`
                            )
                        }
                    }
                } else {
                    syntax.matchers.arbitrary = new RegExp(matcher)
                }

                // Utility rule matcher
                if (type === SyntaxRuleType.Utility) {
                    syntax.id = '.' + id
                    syntax.matchers.arbitrary = new RegExp(
                        '^' + escapeString(id) + '(?=!|\\*|>|\\+|~|:|\\[|@|_|\\.|$)',
                        'm'
                    )
                }

                // Key matcher
                if (keys.length) {
                    syntax.keys = keys
                    syntax.matchers.key = new RegExp(
                        `^${keys.length > 1 ? `(${keys.join('|')})` : keys[0]}:.`
                    )
                }
            })
    }

    resolveComponents() {
        const { components } = this.config
        const flatComps = components ? flattenObject(components) : {}
        const flatNames = Object.keys(flatComps)
        const resolve = (name: string, currentClasses: string[] = []) => {
            const compClasses = this.components.get(name)
            if (compClasses) {
                currentClasses.push(...compClasses)
                return
            }
            const className = flatComps[name]
            if (!className) return
            const classes = className.replace(/(?:\n\s*)+/g, ' ').trim().split(' ')
            for (const cls of classes) {
                if (flatNames.includes(cls)) {
                    resolve(cls, currentClasses)
                } else {
                    currentClasses.push(cls)
                }
            }
            this.components.set(name, [...currentClasses])
        }

        // First pass: expand class names recursively
        for (const name of flatNames) {
            resolve(name)
        }
    }

    resolveSelectors() {
        const { selectors } = this.config
        if (selectors) {
            const flatSelectors = flattenObject(selectors)
            for (const token in flatSelectors) {
                const value = flatSelectors[token]
                const nodes = parseSelector(value, this, false)
                this.selectors.set(token, nodes)
            }
        }
    }

    resolveAtRules() {
        const { at, screens } = this.config

        if (screens) {
            for (const key in screens) {
                const value = screens[key]
                const node = this.parseValue(value)
                this.atRules.set(key, {
                    id: 'media',
                    nodes: [node as unknown as AtRuleValueNode]
                })
            }
        }

        if (at) {
            const flatAt = flattenObject(at)
            for (const token in flatAt) {
                const value = flatAt[token]
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
        const { variables, screens, modes } = this.config
        const aliasVariableModeResolvers = new Map<string, Record<string, () => void>>()
        const resolveVariable = (variableDefinition: VariableDefinition, name: string[], mode?: string) => {
            if (variableDefinition === undefined || variableDefinition === null) return
            const addVariable = (
                name: string[],
                variable: any,
                replacedMode?: string,
                alpha?: string
            ) => {
                if (variable === undefined) return
                const flatName = name.join('-')
                const groups = name.slice(0, -1).filter(Boolean)
                const key = (name[0] === '' ? '-' : '') + name[name.length - 1]
                variable.key = key
                variable.name = flatName
                if (groups.length)
                    variable.group = groups.join('.')
                if (variable.type === 'color') {
                    if (alpha) {
                        const slashIndex = variable.value.indexOf('/')
                        variable = {
                            ...variable,
                            value: slashIndex === -1
                                ? variable.value + ' / ' + (alpha.startsWith('0.') ? alpha.slice(1) : alpha)
                                : (variable.value.slice(0, slashIndex + 2) + String(+variable.value.slice(slashIndex + 2) * +alpha).slice(1))
                        }
                    }
                }
                const currentMode = replacedMode ?? mode
                if (currentMode !== undefined) {
                    const foundVariable = this.variables.get(flatName)
                    if (foundVariable) {
                        if (currentMode) {
                            if (!foundVariable.modes) {
                                foundVariable.modes = {}
                            }
                            foundVariable.modes[currentMode] = variable
                        } else {
                            foundVariable.value = variable.value
                            if (variable.type === 'color') {
                                (foundVariable as ColorVariable).space = variable.space
                            }
                        }
                    } else {
                        if (currentMode) {
                            const newVariable: any = {
                                key: variable.key,
                                name: variable.name,
                                group: variable.group,
                                type: variable.type,
                                modes: { [currentMode]: variable }
                            }
                            if (variable.type === 'color') {
                                newVariable.space = variable.space
                            }
                            this.variables.set(flatName, newVariable)
                        } else {
                            this.variables.set(flatName, variable)
                        }
                    }
                } else {
                    this.variables.set(flatName, variable)
                }
            }
            if (typeof variableDefinition === 'object') {
                if (Array.isArray(variableDefinition)) {
                    addVariable(name, { type: 'string', value: variableDefinition.join(',') })
                } else {
                    const keys = Object.keys(variableDefinition)
                    for (const eachKey of keys) {
                        if (eachKey === '') {
                            resolveVariable(variableDefinition[eachKey] as VariableDefinition, name, mode)
                        } else {
                            resolveVariable(variableDefinition[eachKey] as VariableDefinition, [...name, eachKey], mode)
                        }
                    }
                }
            } else if (typeof variableDefinition === 'number') {
                addVariable(name, { type: 'number', value: variableDefinition })
                addVariable(['', ...name], { type: 'number', value: variableDefinition * -1 })
            } else if (typeof variableDefinition === 'string') {
                const aliasResult = /^\$\((.*?)\)(?: ?\/ ?(.+?))?$|^\$([a-zA-Z0-9-]+)(?: ?\/ ?(.+?))?$/.exec(variableDefinition)
                const flatName = name.join('-')
                if (aliasResult) {
                    const alias = aliasResult[1] ?? aliasResult[3]
                    const modeSuffix = aliasResult[2] ?? aliasResult[4]

                    let aliasVariableModeResolver = aliasVariableModeResolvers.get(flatName)
                    if (!aliasVariableModeResolver) {
                        aliasVariableModeResolvers.set(flatName, aliasVariableModeResolver = {})
                    }

                    aliasVariableModeResolver[mode as string] = () => {
                        delete aliasVariableModeResolver[mode as string]

                        if (!alias) return

                        const [baseAlias, aliasMode] = alias.split('@')

                        const eachAliasModeVariableResolver = aliasVariableModeResolvers.get(baseAlias)
                        if (eachAliasModeVariableResolver) {
                            for (const mode of Object.keys(eachAliasModeVariableResolver)) {
                                eachAliasModeVariableResolver[mode]?.()
                            }
                        }

                        const aliasVariable = this.variables.get(baseAlias)
                        if (aliasVariable) {
                            if (aliasMode === undefined && aliasVariable.modes) {
                                addVariable(name, {
                                    type: aliasVariable.type,
                                    value: aliasVariable.value,
                                    space: (aliasVariable as ColorVariable).space
                                }, '', modeSuffix)

                                for (const mode in aliasVariable.modes) {
                                    addVariable(name, aliasVariable.modes[mode], mode, modeSuffix)
                                }
                            } else {
                                const variable = aliasMode !== undefined
                                    ? aliasVariable.modes?.[aliasMode]
                                    : aliasVariable

                                if (variable) {
                                    const newVariable = {
                                        type: variable.type,
                                        value: variable.value,
                                        ...(variable.type === 'color' ? { space: variable.space } : {})
                                    } as Variable

                                    addVariable(name, newVariable, undefined, modeSuffix)
                                }
                            }
                        }
                    }
                } else {
                    const hexColorResult = /^#([A-Fa-f0-9]{3,4}|[A-Fa-f0-9]{6}|[A-Fa-f0-9]{8})$/.exec(variableDefinition)
                    if (hexColorResult) {
                        const [r, g, b, a] = hexToRgb(hexColorResult[1])
                        addVariable(name, { type: 'color', value: `${r} ${g} ${b}${a === 1 ? '' : ' / ' + a}`, space: 'rgb' })
                    } else {
                        const rgbFunctionResult = /^rgb\( *([0-9]{1,3})(?: *, *| +)([0-9]{1,3})(?: *, *| +)([0-9]{1,3}) *(?:(?:,|\/) *(.*?) *)?\)$/.exec(variableDefinition)
                        if (rgbFunctionResult) {
                            addVariable(name, { type: 'color', value: rgbFunctionResult[1] + ' ' + rgbFunctionResult[2] + ' ' + rgbFunctionResult[3] + (rgbFunctionResult[4] ? ' / ' + (rgbFunctionResult[4].startsWith('0.') ? rgbFunctionResult[4].slice(1) : rgbFunctionResult[4]) : ''), space: 'rgb' })
                        } else {
                            const hslFunctionResult = /^hsl\((.*?)\)$/.exec(variableDefinition)
                            if (hslFunctionResult) {
                                addVariable(name, { type: 'color', value: hslFunctionResult[1], space: 'hsl' })
                            } else {
                                addVariable(name, { type: 'string', value: variableDefinition })
                            }
                        }
                    }
                }
            }
        }

        if (variables) {
            for (const parnetKey in variables) {
                resolveVariable(variables[parnetKey], [parnetKey])
            }
        }

        if (modes) {
            for (const mode in modes) {
                const modeVariables = modes[mode]
                if (!modeVariables) continue
                for (const key in modeVariables) {
                    resolveVariable(modeVariables[key], [key], mode)
                }
            }
        }

        // todo: address to the target variable
        aliasVariableModeResolvers.forEach((aliasVariableModeResolver) => {
            for (const mode of Object.keys(aliasVariableModeResolver)) {
                aliasVariableModeResolver[mode]?.()
            }
        })

        if (screens) {
            resolveVariable(screens, ['screen'])
        }
    }

    parseValue(token: string | number, unit = 'rem') {
        return parseValue(token, unit, this.config.rootSize)
    }

    /**
     * Match check if Master CSS syntax
     * @param className
     * @returns css text
     */
    match(className: string): DefinedRule | undefined {
        /**
         * 1. variable
         * @example fg:primary bg:blue
         */
        for (const eachSyntax of this.definedRules) {
            if (eachSyntax.matchers.variable?.test(className)) return eachSyntax
        }

        /**
         * 2. value (ambiguous.key * ambiguous.values)
         * @example bg:current box:content font:12
         */
        for (const eachSyntax of this.definedRules) {
            if (eachSyntax.matchers.value?.test(className)) return eachSyntax
        }
        /**
         * 3. full key
         * @example text-align:center color:blue-40
         */
        for (const eachSyntax of this.definedRules) {
            if (eachSyntax.matchers.key?.test(className)) return eachSyntax
        }
        /**
         * 4. arbitrary
         * @example custom RegExp, utility
         */
        for (const eachSyntax of this.definedRules) {
            if (eachSyntax.matchers.arbitrary?.test(className)) return eachSyntax
        }
    }

    /**
     * Generate syntax rules from class name
     * @param className
     * @returns SyntaxRule[]
     */
    generate(className: string, mode?: string): SyntaxRule[] {
        let syntaxRules: SyntaxRule[] = []
        const compClasses = this.components.get(className)
        if (compClasses) {
            compClasses.forEach((cls) => {
                const syntaxRule = this.create(cls, className, mode)
                if (syntaxRule && syntaxRule.valid) {
                    syntaxRules.push(syntaxRule)
                } else {
                    console.error(`Invalid class "${cls}" found in ${className} component.`)
                }
            })
        } else {
            const atIndex = className.indexOf('@')
            if (atIndex !== -1) {
                const name = className.slice(0, atIndex)
                const compClasses = this.components.get(name)
                if (compClasses) {
                    const atToken = className.slice(atIndex)
                    compClasses.forEach((eachSyntax) => {
                        const syntaxRule = this.create(eachSyntax + atToken, className, mode)
                        if (syntaxRule && syntaxRule.valid) {
                            syntaxRules.push(syntaxRule)
                        }
                    })
                }
            }
            const syntaxRule = this.create(className, undefined, mode)
            if (syntaxRule && syntaxRule.valid) {
                syntaxRules.push(syntaxRule)
            }
        }
        return syntaxRules
    }

    /**
     * Create syntax rule from given class name
     * @param className
     * @returns SyntaxRule
     */
    create(className: string, fixedClass?: string, mode?: string): SyntaxRule | undefined {
        const syntaxRule = this.generalLayer.rules.find(({ key }) => key === ((fixedClass ? fixedClass + ' ' : '') + className))
        if (syntaxRule) return syntaxRule
        const registeredRule = this.match(className)
        if (registeredRule) return new SyntaxRule(className, this, registeredRule, fixedClass, mode)
    }

    /**
     * Create syntax rule from given selector text
     * @param selectorText
     */
    createFromSelectorText(selectorText: string) {
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
                const syntaxRules = this.generate(className)
                if (syntaxRules.length) return syntaxRules
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
        this.components = new Map()
        // @ts-ignore
        this.classRules = new Map()
        this.definedRules.length = 0
        this.baseLayer.reset()
        this.themeLayer.reset()
        this.presetLayer.reset()
        this.componentsLayer.reset()
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
            const rules = this.classRules.get(className)
            if (rules) continue
            const newRules = this.generate(className)
            if (newRules.length) {
                newRules.forEach((eachSyntaxRule) => eachSyntaxRule.layer.insert(eachSyntaxRule))
                this.classRules.set(className, newRules)
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
            const rules = this.classRules.get(className)
            if (rules) {
                rules.forEach((rule) => rule.layer.delete(rule.key))
                this.classRules.delete(className)
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