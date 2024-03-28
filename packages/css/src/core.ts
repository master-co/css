/* eslint-disable @typescript-eslint/no-unsafe-declaration-merging */
import { Rule, type NativeRule, type RuleDefinition, type RegisteredRule, AtFeatureComponent } from './rule'
import type { Config, AnimationDefinitions } from './config'
import { config as defaultConfig } from './config'
import Layer from './layer'
import { hexToRgb } from './utils/hex-to-rgb'
import { flattenObject } from './utils/flatten-object'
import extendConfig from './functions/extend-config'
import { type PropertiesHyphen } from 'csstype'
import './types/global' // fix: ../css/src/core.ts:1205:16 - error TS7017: Element implicitly has an 'any' type because type 'typeof globalThis' has no index signature.

type VariableValue =
    { type: 'string', value: string }
    | { type: 'number', value: number }
    | { type: 'color', value: string, space: 'rgb' | 'hsl' }

export type Variable = Omit<VariableValue, 'value' | 'space'> & {
    value?: any,
    space?: any,
    usage?: number,
    modes?: { [mode: string]: VariableValue }
}

export default class MasterCSS {
    static config: Config = defaultConfig
    readonly rules: Rule[] = []
    readonly ruleBy: Record<string, Rule> = {}
    readonly classesUsage: Record<string, number> = {}
    readonly config: Config
    readonly Rules: RegisteredRule[] = []

    constructor(
        public customConfig: Config = defaultConfig
    ) {
        if (!customConfig?.override) {
            this.config = extendConfig(defaultConfig, customConfig)
        } else {
            this.config = extendConfig(customConfig)
        }
        this.resolve()
        if (this.constructor === MasterCSS) {
            masterCSSs.push(this)
        }
    }

    resolve() {
        this.styles = {}
        this.stylesBy = {}
        this.selectors = {}
        this.variables = {}
        this.queries = {}
        this.animations = {}
        this.Rules.length = 0
        this.variablesNativeRules = {}
        this.hasKeyframesRule = false
        const colorVariableNames: Record<string, undefined> = {
            current: undefined,
            currentColor: undefined,
            transparent: undefined
        }

        const { styles, selectors, variables, utilities, queries, rules, animations } = this.config

        function escapeString(str: string) {
            return str.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')
        }

        if (selectors) {
            const resolvedSelectors = flattenObject(selectors)
            for (const eachSelectorName in resolvedSelectors) {
                const eachResolvedSelectorText = resolvedSelectors[eachSelectorName]
                const regexp = new RegExp(escapeString(eachSelectorName) + '(?![a-z-])')
                for (const eachNewSelectorText of Array.isArray(eachResolvedSelectorText) ? eachResolvedSelectorText : [eachResolvedSelectorText]) {
                    const vendor = eachNewSelectorText.match(/^::-[a-z]+-/m)?.[0] ?? ''
                    let selectorValues = this.selectors[vendor]
                    if (!selectorValues) {
                        selectorValues = this.selectors[vendor] = []
                    }
                    let currentSelectValue = selectorValues.find(([_valueRegexp]) => _valueRegexp === regexp)
                    if (!currentSelectValue) {
                        currentSelectValue = [regexp, []]
                        selectorValues.push(currentSelectValue)
                    }
                    currentSelectValue[1].push(eachNewSelectorText)
                }
            }
        }

        if (variables) {
            const unexecutedAliasVariable: Record<string, { [mode: string]: () => void }> = {}
            const parseVariable = (variable: any, name: string, mode?: string) => {
                if (typeof variable === undefined || variable === null)
                    return

                const addVariable = (
                    name: string,
                    variableValue: VariableValue,
                    replacedMode?: string,
                    alpha?: string
                ) => {
                    if (variableValue === undefined)
                        return

                    if (variableValue.type === 'color') {
                        if (alpha) {
                            const slashIndex = variableValue.value.indexOf('/')
                            variableValue = {
                                ...variableValue,
                                value: slashIndex === -1
                                    ? variableValue.value + ' / ' + (alpha.startsWith('0.') ? alpha.slice(1) : alpha)
                                    : (variableValue.value.slice(0, slashIndex + 2) + String(+variableValue.value.slice(slashIndex + 2) * +alpha).slice(1))
                            }
                        }

                        colorVariableNames[name] = undefined
                    }

                    const currentMode = replacedMode ?? mode
                    if (currentMode !== undefined) {
                        if (Object.prototype.hasOwnProperty.call(this.variables, name)) {
                            const variable = this.variables[name]
                            if (currentMode) {
                                if (!variable.modes) {
                                    variable.modes = {}
                                }
                                variable.modes[currentMode] = variableValue
                            } else {
                                variable.value = variableValue.value
                                if (variableValue.type === 'color') {
                                    variable.space = variableValue.space
                                }
                            }
                        } else {
                            if (currentMode) {
                                const newVariable: Variable = {
                                    type: variableValue.type,
                                    modes: { [currentMode]: variableValue }
                                }
                                if (variableValue.type === 'color') {
                                    newVariable.space = variableValue.space
                                }
                                this.variables[name] = newVariable
                            } else {
                                this.variables[name] = variableValue
                            }
                        }
                    } else {
                        this.variables[name] = variableValue
                    }
                }

                const type = typeof variable
                if (type === 'object') {
                    if (Array.isArray(variable)) {
                        addVariable(name, { type: 'string', value: variable.join(',') })
                    } else {
                        const keys = Object.keys(variable)
                        for (const eachKey of keys) {
                            if (eachKey === '' || eachKey.startsWith('@')) {
                                parseVariable(variable[eachKey], name, (eachKey || keys.some(eachKey => eachKey.startsWith('@'))) ? eachKey.slice(1) : undefined)
                            } else {
                                parseVariable(variable[eachKey], name + '-' + eachKey, undefined)
                            }
                        }
                    }
                } else if (type === 'number') {
                    addVariable(name, { type: 'number', value: variable })
                    addVariable('-' + name, { type: 'number', value: variable * -1 })
                } else if (type === 'string') {
                    const aliasResult = /^\$\((.*?)\)(?: ?\/ ?(.+?))?$/.exec(variable)
                    if (aliasResult) {
                        if (!Object.prototype.hasOwnProperty.call(unexecutedAliasVariable, name)) {
                            unexecutedAliasVariable[name] = {}
                        }
                        unexecutedAliasVariable[name][mode as string] = () => {
                            delete unexecutedAliasVariable[name][mode as string]

                            const [alias, aliasMode] = aliasResult[1].split('@')
                            if (alias) {
                                if (Object.prototype.hasOwnProperty.call(unexecutedAliasVariable, alias)) {
                                    for (const mode of Object.keys(unexecutedAliasVariable[alias])) {
                                        unexecutedAliasVariable[alias][mode]?.()
                                    }
                                }

                                const aliasVariable = this.variables[alias]
                                if (aliasVariable) {
                                    if (aliasMode === undefined && aliasVariable.modes) {
                                        addVariable(
                                            name,
                                            { type: aliasVariable.type, value: aliasVariable.value, space: aliasVariable.space },
                                            '',
                                            aliasResult[2]
                                        )
                                        for (const mode in aliasVariable.modes) {
                                            addVariable(
                                                name,
                                                aliasVariable.modes[mode],
                                                mode,
                                                aliasResult[2]
                                            )
                                        }
                                    } else {
                                        const variable = aliasMode !== undefined
                                            ? aliasVariable.modes?.[aliasMode]
                                            : aliasVariable
                                        if (variable) {
                                            const newVariable = { type: variable.type, value: variable.value } as VariableValue
                                            if (variable.type === 'color') {
                                                (newVariable as any).space = variable.space
                                            }
                                            addVariable(name, newVariable, undefined, aliasResult[2])
                                        }
                                    }
                                }
                            }
                        }
                    } else {
                        const hexColorResult = /^#([A-Fa-f0-9]{3,4}|[A-Fa-f0-9]{6}|[A-Fa-f0-9]{8})$/.exec(variable)
                        if (hexColorResult) {
                            const [r, g, b, a] = hexToRgb(hexColorResult[1])
                            addVariable(name, { type: 'color', value: `${r} ${g} ${b}${a === 1 ? '' : ' / ' + a}`, space: 'rgb' })
                        } else {
                            const rgbFunctionResult = /^rgb\( *([0-9]{1,3})(?: *, *| +)([0-9]{1,3})(?: *, *| +)([0-9]{1,3}) *(?:(?:,|\/) *(.*?) *)?\)$/.exec(variable)
                            if (rgbFunctionResult) {
                                addVariable(name, { type: 'color', value: rgbFunctionResult[1] + ' ' + rgbFunctionResult[2] + ' ' + rgbFunctionResult[3] + (rgbFunctionResult[4] ? ' / ' + (rgbFunctionResult[4].startsWith('0.') ? rgbFunctionResult[4].slice(1) : rgbFunctionResult[4]) : ''), space: 'rgb' })
                            } else {
                                const hslFunctionResult = /^hsl\((.*?)\)$/.exec(variable)
                                if (hslFunctionResult) {
                                    addVariable(name, { type: 'color', value: hslFunctionResult[1], space: 'hsl' })
                                } else {
                                    addVariable(name, { type: 'string', value: variable })
                                }
                            }
                        }
                    }
                }
            }
            for (const parnetKey in variables) {
                parseVariable(variables[parnetKey], parnetKey)
            }
            for (const name of Object.keys(unexecutedAliasVariable)) {
                for (const mode of Object.keys(unexecutedAliasVariable[name])) {
                    unexecutedAliasVariable[name][mode]?.()
                }
            }
        }

        if (queries) {
            this.queries = flattenObject(queries)
        }

        if (animations) {
            for (const animationName in animations) {
                const eachAnimation: any = this.animations[animationName] = {}
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

        const flattedStyles: Record<string, string> = styles ? flattenObject(styles) : {}
        const utilityNames = Object.keys(flattedStyles)
        const handleUtilityName = (utilityName: string) => {
            if (Object.prototype.hasOwnProperty.call(this.styles, utilityName))
                return

            const currentClass: string[] = this.styles[utilityName] = []

            const className = flattedStyles[utilityName]
            if (!className)
                return

            const classNames: string[] = className
                .replace(/(?:\n(?:\s*))+/g, ' ')
                .trim()
                .split(' ')
            for (const eachClassName of classNames) {
                const handle = (className: string) => {
                    if (Object.prototype.hasOwnProperty.call(this.stylesBy, className)) {
                        const currentRelation = this.stylesBy[className]
                        if (!currentRelation.includes(utilityName)) {
                            currentRelation.push(utilityName)
                        }
                    } else {
                        this.stylesBy[className] = [utilityName]
                    }

                    if (!currentClass.includes(className)) {
                        currentClass.push(className)
                    }
                }

                if (utilityNames.includes(eachClassName)) {
                    handleUtilityName(eachClassName)

                    for (const parentClassName of this.styles[eachClassName]) {
                        handle(parentClassName)
                    }
                } else {
                    handle(eachClassName)
                }
            }
        }
        for (const eachUtilityName of utilityNames) {
            handleUtilityName(eachUtilityName)
        }

        if (rules || utilities) {
            const rulesEntries: [string, RuleDefinition][] = []
            if (utilities) {
                for (const utilityName in utilities) {
                    const declarations = utilities[utilityName] as any
                    rulesEntries.push([utilityName, { declarations, layer: Layer.Utility }])
                }
            }
            if (rules) {
                rulesEntries.push(...Object.entries(rules) as [string, RuleDefinition][])
            }
            const rulesEntriesLength = rulesEntries.length
            const colorNames = Object.keys(colorVariableNames)
            rulesEntries
                .sort((a: any, b: any) => {
                    if (a[1].layer !== b[1].layer) {
                        return (b[1].layer || 0) - (a[1].layer || 0)
                    }
                    return b[0].localeCompare(a[0])
                })
                .forEach(([id, eachRuleDefinition], index: number) => {
                    const eachRegisteredRule: RegisteredRule = {
                        id,
                        variables: {},
                        matchers: {},
                        order: rulesEntriesLength - 1 - index,
                        definition: eachRuleDefinition
                    }
                    this.Rules.push(eachRegisteredRule)
                    const { matcher, layer, key, subkey, ambiguousKeys, ambiguousValues } = eachRuleDefinition
                    if (layer === Layer.Utility) {
                        eachRegisteredRule.id = '.' + id
                        eachRegisteredRule.matchers.arbitrary = new RegExp('^' + escapeString(id) + '(?=!|\\*|>|\\+|~|:|\\[|@|_|\\.|$)', 'm')
                    }

                    // todo: 不可使用 startsWith 判斷，應改為更精準的從 config.variables 取得目標變數群組，但 config.variables 中的值還沒被 resolve 像是 Array
                    const addResolvedVariables = (prefix: string) => {
                        for (const eachVariableName in this.variables) {
                            if (eachVariableName.startsWith(prefix + '-') || eachVariableName.startsWith('-' + prefix + '-')) {
                                const simplifiedName = eachVariableName.slice(prefix.length + (prefix.startsWith('-') ? 0 : 1))
                                eachRegisteredRule.variables[simplifiedName] = {
                                    ...this.variables[eachVariableName],
                                    name: eachVariableName,
                                }
                            }
                        }
                    }

                    // 1. custom `config.rules[id].variables`
                    if (eachRuleDefinition.variables) {
                        for (const eachVariableGroup of eachRuleDefinition.variables) {
                            addResolvedVariables(eachVariableGroup)
                        }
                    }

                    // 2. custom `config.variables`
                    addResolvedVariables(id)

                    const colorsPatten = colorNames.join('|')
                    const keyPatterns = []
                    if (layer === Layer.NativeShorthand || layer === Layer.Native) {
                        keyPatterns.push(id)
                    }
                    if (!matcher) {
                        if (!key && !subkey) {
                            keyPatterns.push(id)
                        } else if (key || subkey) {
                            if (key) keyPatterns.push(key)
                            if (subkey) keyPatterns.push(subkey)
                            if (layer === Layer.Shorthand) {
                                keyPatterns.push(id)
                            }
                        }
                        if (ambiguousKeys?.length) {
                            const ambiguousKeyPattern = ambiguousKeys.length > 1 ? `(?:${ambiguousKeys.join('|')})` : ambiguousKeys[0]
                            const variableKeys = Object.keys(eachRegisteredRule.variables)
                            if (ambiguousValues?.length) {
                                const ambiguousValuePatterns = []
                                for (const eachAmbiguousValue of ambiguousValues) {
                                    if (eachAmbiguousValue instanceof RegExp) {
                                        ambiguousValuePatterns.push(eachAmbiguousValue.source.replace('\\$colors', colorsPatten))
                                    } else {
                                        ambiguousValuePatterns.unshift(`${eachAmbiguousValue}\\b`)
                                    }
                                }
                                eachRegisteredRule.matchers.value = new RegExp(`^${ambiguousKeyPattern}:(?:${ambiguousValuePatterns.join('|')})[^|]*?(?:@|$)`)
                            }
                            if (variableKeys.length) {
                                eachRegisteredRule.matchers.variable = new RegExp(`^${ambiguousKeyPattern}:(?:${variableKeys.join('|')}(?![a-zA-Z0-9-]))[^|]*?(?:@|$)`)
                            }
                        }
                        // if (id === 'background-clip') {
                        //     console.log(eachRegisteredRule)
                        // }
                    } else {
                        eachRegisteredRule.matchers.arbitrary = matcher as RegExp
                    }
                    eachRegisteredRule.key = key || id
                    if (keyPatterns.length) {
                        eachRegisteredRule.matchers.key = new RegExp(`^${keyPatterns.length > 1 ? `(${keyPatterns.join('|')})` : keyPatterns[0]}:`)
                    }
                })
        }
    }

    /**
     * Match check if Master CSS syntax
     * @param className
     * @returns css text
     */
    match(className: string): RegisteredRule | undefined {
        /**
         * 1. variable
         * @example fg:primary bg:blue
         */
        for (const eachRegisteredRule of this.Rules) {
            if (eachRegisteredRule.matchers.variable?.test(className)) return eachRegisteredRule
        }
        /**
         * 2. value (ambiguous.key * ambiguous.values)
         * @example bg:current box:content font:12
         */
        for (const eachRegisteredRule of this.Rules) {
            if (eachRegisteredRule.matchers.value?.test(className)) return eachRegisteredRule
        }
        /**
         * 3. full key
         * @example text-align:center color:blue-40
         */
        for (const eachRegisteredRule of this.Rules) {
            if (eachRegisteredRule.matchers.key?.test(className)) return eachRegisteredRule
        }
        /**
         * 4. arbitrary
         * @example custom RegExp, utility
         */
        for (const eachRegisteredRule of this.Rules) {
            if (eachRegisteredRule.matchers.arbitrary?.test(className)) return eachRegisteredRule
        }
    }

    /**
     * Generate rules from class name
     * @param className
     * @returns Rule[]
     */
    generate(className: string): Rule[] {
        return (
            Object.prototype.hasOwnProperty.call(this.styles, className)
                ? this.styles[className].map((eachSyntax) => this.create(eachSyntax))
                : [this.create(className)]
        )
            .filter(eachRule => eachRule && eachRule.text) as Rule[]
    }

    /**
     * Create rule from given syntax
     * @param syntax
     * @returns Rule
     */
    create(syntax: string) {
        if (Object.prototype.hasOwnProperty.call(this.ruleBy, syntax))
            return this.ruleBy[syntax]
        const RegistedRule = this.match(syntax)
        if (RegistedRule) {
            return new Rule(syntax, RegistedRule, this)
        }
    }

    /**
     * 根據蒐集到的所有 DOM class 重新 create
     */
    refresh(customConfig?: Config) {
        if (customConfig) {
            this.customConfig = customConfig
        } else {
            customConfig = this.customConfig
        }
        if (!customConfig?.override) {
            // @ts-ignore
            this.config = extendConfig(defaultConfig, customConfig)
        } else {
            // @ts-ignore
            this.config = extendConfig(customConfig)
        }
        this.resolve()
        this.rules.length = 0
        // @ts-ignore
        this.ruleBy = {}
        /**
         * 拿當前所有的 classNames 按照最新的 colors, config.rules 匹配並生成新的 style
         * 所以 refresh 過後 rules 可能會變多也可能會變少
         */
        for (const name in this.classesUsage) {
            this.add(name)
        }
        return this
    }

    reset() {
        // @ts-ignore
        this.ruleBy = {}
        // @ts-ignore
        this.classesUsage = {}
        this.rules.length = 0
        this.hasKeyframesRule = false
        this.variablesNativeRules = {}
        for (const keyframeName in this.animations) {
            const animation = this.animations[keyframeName]
            animation.usage = 0
            animation.native = undefined
        }
        for (const variableName in this.variables) {
            const variable = this.variables[variableName]
            variable.usage = 0
        }
        return this
    }

    destroy() {
        this.reset()
        masterCSSs.splice(masterCSSs.indexOf(this), 1)
        return this
    }

    add(...classNames: string[]) {
        for (const className of classNames) {
            const rules = this.generate(className)
            if (rules.length) {
                for (const rule of rules) {
                    this.insert(rule)
                }
            }
        }
        return this
    }

    delete(...classNames: string[]) {
        /**
         * class name 從 DOM tree 中被移除，
         * 匹配並刪除對應的 rule
         */
        const sheet = this.style?.sheet
        const deleteRule = (name: string) => {
            const rule = this.ruleBy[name]
            if (
                !rule
                || Object.prototype.hasOwnProperty.call(this.stylesBy, name) && this.stylesBy[name].some(eachClassName => Object.prototype.hasOwnProperty.call(this.classesUsage, eachClassName))
            )
                return

            if (sheet && rule.natives.length) {
                const firstNative = rule.natives[0]
                for (let index = 0; index < sheet.cssRules.length; index++) {
                    const eachCSSRule = sheet.cssRules[index]
                    if (eachCSSRule === firstNative.cssRule) {
                        for (let i = 0; i < rule.natives.length; i++) {
                            sheet.deleteRule(index)
                        }
                        break
                    }
                }
            }

            this.rules.splice(this.rules.indexOf(rule), 1)
            delete this.ruleBy[name]

            // variables
            if (rule.variableNames) {
                for (const eachVariableName of rule.variableNames) {
                    const variable = this.variables[eachVariableName]
                    if (!variable.usage) variable.usage = 0
                    if (!--variable.usage) {
                        const removeProperty = (mode: string) => {
                            const nativeRule = this.variablesNativeRules[mode];
                            (nativeRule.cssRule as CSSStyleRule).style.removeProperty('--' + eachVariableName)
                            if (!(nativeRule.cssRule as CSSStyleRule).style.length) {
                                const variablesRule = this.rules[0]
                                const index = variablesRule.natives.indexOf(nativeRule)
                                sheet?.deleteRule(index)
                                variablesRule.natives.splice(index, 1)
                                delete this.variablesNativeRules[mode]
                                if (!variablesRule.natives.length) {
                                    this.rules.splice(0, 1)
                                    this.variablesNativeRules = {}
                                }
                            }
                        }
                        if (variable.value) {
                            removeProperty('')
                        }
                        if (variable.modes) {
                            for (const mode in variable.modes) {
                                removeProperty(mode)
                            }
                        }
                    }
                }
            }

            // animations
            if (rule.animationNames) {
                const keyframeRulesIndex = Object.keys(this.variablesNativeRules).length ? 1 : 0
                const keyframeRule = this.rules[keyframeRulesIndex]
                for (const eachKeyframeName of rule.animationNames) {
                    const keyframe = this.animations[eachKeyframeName]
                    if (!keyframe.usage) keyframe.usage = 0
                    if (!--keyframe.usage && keyframe.native) {
                        const nativeIndex = keyframeRule.natives.indexOf(keyframe.native)
                        this.style.sheet?.deleteRule(Object.keys(this.variablesNativeRules).length + nativeIndex)
                        keyframeRule.natives.splice(nativeIndex, 1)
                        keyframe.native = undefined
                    }
                }

                if (!keyframeRule.natives.length) {
                    this.rules.splice(keyframeRulesIndex, 1)
                    this.hasKeyframesRule = false
                }
            }

            rule.definition.delete?.call(rule, name)
        }

        for (const className of classNames) {
            if (Object.prototype.hasOwnProperty.call(this.styles, className)) {
                for (const eachClassName of this.styles[className]) {
                    if (!Object.prototype.hasOwnProperty.call(this.classesUsage, eachClassName)) {
                        deleteRule(eachClassName)
                    }
                }

                delete this.ruleBy[className]
            } else {
                deleteRule(className)
            }
        }
    }

    /**
    * 加工插入規則
    * 1. where
    * 2. normal
    * 3. where selectors
    * 4. normal selectors
    * 5. media where
    * 6. media normal
    * 7. media where selectors
    * 8. media selectors
    * 9. media width where
    * 10. media width
    * 11. media width where selectors
    * 12. media width selectors
    */
    insert(rule: Rule) {
        if (this.ruleBy[rule.className])
            return

        let index: number | undefined
        /**
         * 必須按斷點值遞增，並透過索引插入，
         * 以實現響應式先後套用的規則
         * @example <1  <2  <3  ALL  >=1 >=2 >=3
         * @description
         */
        const endIndex = this.rules.length - 1
        const { at, atToken, order, priority, hasWhere, className } = rule

        const findIndex = (startIndex: number, stopCheck?: (rule: Rule) => any, matchCheck?: (rule: Rule) => any) => {
            let i = startIndex
            for (; i <= endIndex; i++) {
                const eachRule = this.rules[i]
                if (stopCheck?.(eachRule))
                    return matchCheck
                        ? -1
                        : i - 1
                if (matchCheck?.(eachRule))
                    return i
            }

            return matchCheck
                ? -1
                : i - 1
        }

        let matchStartIndex: number | undefined
        let matchEndIndex: number | undefined
        if (atToken) {
            const mediaStartIndex = this.rules.findIndex(eachRule => eachRule.at?.media)
            if (mediaStartIndex === -1) {
                index = endIndex + 1
            } else {
                const maxWidthFeature = at.media?.find(({ name }: any) => name === 'max-width') as AtFeatureComponent
                const minWidthFeature = at.media?.find(({ name }: any) => name === 'min-width') as AtFeatureComponent
                if (maxWidthFeature || minWidthFeature) {
                    const mediaWidthStartIndex = this.rules.findIndex(eachRule => eachRule.at?.media?.find(({ name }: any) => name === 'max-width' || name === 'min-width'))
                    if (mediaWidthStartIndex === -1) {
                        index = endIndex + 1
                    } else {
                        if (maxWidthFeature && minWidthFeature) {
                            /**
                             * 範圍越小 ( 越限定 越侷限 ) 越優先，
                             * 按照範圍 max-width - min-width 遞減排序
                             * find 第一個所遇到同樣 feature 且範圍值比自己大的 rule，
                             * 並插入在該 rule 之後，讓自己優先被套用
                             */
                            if (priority === -1) {
                                matchStartIndex = findIndex(
                                    mediaWidthStartIndex,
                                    eachRule => eachRule.priority !== -1,
                                    eachRule => eachRule.at.media?.find(({ name }: any) => name === 'max-width') && eachRule.at.media?.find(({ name }: any) => name === 'min-width')
                                )
                                matchEndIndex = findIndex(
                                    mediaWidthStartIndex,
                                    eachRule => eachRule.priority !== -1
                                )
                            } else {
                                matchStartIndex = findIndex(
                                    mediaWidthStartIndex,
                                    undefined,
                                    eachRule => eachRule.at.media?.find(({ name }: any) => name === 'max-width') && eachRule.at.media?.find(({ name }: any) => name === 'min-width') && eachRule.priority !== -1
                                )
                                matchEndIndex = endIndex
                            }

                            if (matchStartIndex !== -1) {
                                const range = (maxWidthFeature.value) as number - (minWidthFeature.value as number)

                                let i = matchEndIndex
                                const endI = matchStartIndex
                                matchStartIndex = undefined
                                for (; i >= endI; i--) {
                                    const eachRule = this.rules[i]
                                    const eachMaxWidthFeature = eachRule.at.media?.find(({ name }: any) => name === 'max-width') as AtFeatureComponent
                                    const eachMinWidthFeature = eachRule.at.media?.find(({ name }: any) => name === 'min-width') as AtFeatureComponent
                                    const eachRange = (eachMaxWidthFeature.value as number) - (eachMinWidthFeature.value as number)
                                    if (eachRange < range) {
                                        matchEndIndex = i - 1
                                    } else if (eachRange === range) {
                                        matchStartIndex = i
                                    } else {
                                        break
                                    }
                                }
                            }

                            if (matchStartIndex !== -1 && matchStartIndex !== undefined) {
                                const range = (maxWidthFeature.value) as number - (minWidthFeature.value as number)
                                for (let i = matchEndIndex; i >= matchStartIndex; i--) {
                                    const eachRule = this.rules[i]
                                    const eachMaxWidthFeature = eachRule.at.media?.find(({ name }: any) => name === 'max-width') as AtFeatureComponent
                                    const eachMinWidthFeature = eachRule.at.media?.find(({ name }: any) => name === 'min-width') as AtFeatureComponent
                                    const eachRange = (eachMaxWidthFeature.value as number) - (eachMinWidthFeature.value as number)
                                    if (eachRange < range) {
                                        matchEndIndex = i - 1
                                    } else if (eachRange > range) {
                                        matchStartIndex = i + 1
                                        break
                                    }
                                }
                            }
                        } else if (minWidthFeature) {
                            /**
                             * find 第一個所遇到同樣 feature 且值比自己大的 rule，
                             * 並插入在該 rule 之後，讓自己優先被套用
                             */
                            if (priority === -1) {
                                matchStartIndex = findIndex(
                                    mediaWidthStartIndex,
                                    eachRule => eachRule.at.media?.find(({ name }: any) => name === 'max-width') && eachRule.at.media?.find(({ name }: any) => name === 'min-width') || eachRule.priority !== -1,
                                    eachRule => !eachRule.at.media?.find(({ name }: any) => name === 'max-width') && eachRule.at.media?.find(({ name }: any) => name === 'min-width')
                                )
                                matchEndIndex = findIndex(
                                    mediaWidthStartIndex,
                                    eachRule => eachRule.at.media?.find(({ name }: any) => name === 'max-width') && eachRule.at.media?.find(({ name }: any) => name === 'min-width') || eachRule.priority !== -1
                                )
                            } else {
                                matchStartIndex = findIndex(
                                    mediaWidthStartIndex,
                                    eachRule => eachRule.at.media?.find(({ name }: any) => name === 'max-width') && eachRule.at.media?.find(({ name }: any) => name === 'min-width') && eachRule.priority !== -1,
                                    eachRule => !eachRule.at.media?.find(({ name }: any) => name === 'max-width') && eachRule.at.media?.find(({ name }: any) => name === 'min-width') && eachRule.priority !== -1
                                )
                                matchEndIndex = findIndex(
                                    mediaWidthStartIndex,
                                    eachRule => eachRule.at.media?.find(({ name }: any) => name === 'max-width') && eachRule.at.media?.find(({ name }: any) => name === 'min-width') && eachRule.priority !== -1
                                )
                            }

                            if (matchStartIndex !== -1) {
                                for (let i = matchEndIndex; i >= matchStartIndex; i--) {
                                    const value = (this.rules[i].at.media?.find(({ name }: any) => name === 'min-width') as AtFeatureComponent).value
                                    if (value > minWidthFeature.value) {
                                        matchEndIndex = i - 1
                                    } else if (value < minWidthFeature.value) {
                                        matchStartIndex = i + 1
                                        break
                                    }
                                }
                            }
                        } else {
                            /**
                             * find 第一個所遇到同樣 feature 且值比自己大的 rule，
                             * 並插入在該 rule 之後，讓自己優先被套用
                             */
                            if (priority === -1) {
                                matchStartIndex = findIndex(
                                    mediaWidthStartIndex,
                                    eachRule => eachRule.at.media?.find(({ name }: any) => name === 'min-width') || eachRule.priority !== -1,
                                    eachRule => eachRule.at.media?.find(({ name }: any) => name === 'max-width')
                                )
                                matchEndIndex = findIndex(
                                    mediaWidthStartIndex,
                                    eachRule => eachRule.at.media?.find(({ name }: any) => name === 'min-width') || eachRule.priority !== -1
                                )
                            } else {
                                matchStartIndex = findIndex(
                                    mediaWidthStartIndex,
                                    eachRule => eachRule.at.media?.find(({ name }: any) => name === 'min-width') && eachRule.priority !== -1,
                                    eachRule => eachRule.at.media?.find(({ name }: any) => name === 'max-width') && eachRule.priority !== -1
                                )
                                matchEndIndex = findIndex(
                                    mediaWidthStartIndex,
                                    eachRule => eachRule.at.media?.find(({ name }: any) => name === 'min-width') && eachRule.priority !== -1
                                )
                            }

                            if (matchStartIndex !== -1) {
                                for (let i = matchEndIndex; i >= matchStartIndex; i--) {
                                    const value = (this.rules[i].at.media?.find(({ name }: any) => name === 'max-width') as AtFeatureComponent).value
                                    if (value < maxWidthFeature.value) {
                                        matchEndIndex = i - 1
                                    } else if (value > maxWidthFeature.value) {
                                        matchStartIndex = i + 1
                                        break
                                    }
                                }
                            }
                        }
                    }
                } else {
                    if (priority === -1) {
                        matchStartIndex = mediaStartIndex
                        matchEndIndex = findIndex(
                            mediaStartIndex,
                            eachRule => eachRule.at.media?.find(({ name }: any) => name === 'max-width' || name === 'min-width') || eachRule.priority !== -1
                        )
                    } else {
                        matchStartIndex = findIndex(
                            mediaStartIndex,
                            eachRule => eachRule.at.media?.find(({ name }: any) => name === 'max-width' || name === 'min-width'),
                            eachRule => eachRule.priority !== -1
                        )
                        matchEndIndex = findIndex(
                            mediaStartIndex,
                            eachRule => eachRule.at.media?.find(({ name }: any) => name === 'max-width' || name === 'min-width')
                        )
                    }
                }
            }
        } else {
            const findStartIndex = Object.keys(this.variablesNativeRules).length
                ? this.hasKeyframesRule
                    ? 2
                    : 1
                : this.hasKeyframesRule
                    ? 1
                    : 0

            if (priority === -1) {
                matchStartIndex = findStartIndex
                matchEndIndex = findIndex(
                    findStartIndex,
                    eachRule => eachRule.atToken || eachRule.priority !== -1
                )
            } else {
                matchStartIndex = findIndex(
                    findStartIndex,
                    eachRule => eachRule.atToken,
                    eachRule => eachRule.priority !== -1
                )
                matchEndIndex = findIndex(
                    findStartIndex,
                    eachRule => eachRule.atToken
                )
            }
        }

        if (index === undefined && matchEndIndex !== undefined && matchStartIndex !== undefined) {
            if (matchStartIndex === -1) {
                index = matchEndIndex + 1
            } else {
                if (priority === -1) {
                    for (let i = matchStartIndex; i <= matchEndIndex; i++) {
                        const currentRule = this.rules[i]
                        if (!hasWhere && currentRule.hasWhere)
                            continue

                        if (
                            hasWhere && !currentRule.hasWhere
                            || currentRule.order >= order
                        ) {
                            index = i
                            break
                        }
                    }
                } else {
                    for (let i = matchStartIndex; i <= matchEndIndex; i++) {
                        const currentRule = this.rules[i]
                        if (!hasWhere && currentRule.hasWhere)
                            continue

                        if (hasWhere && !currentRule.hasWhere) {
                            index = i
                            break
                        }

                        if (currentRule.priority < priority) {
                            index = i
                            break
                        } else if (currentRule.priority === priority) {
                            if (currentRule.order >= order) {
                                index = i
                                break
                            }
                        } else {
                            index = i + 1
                        }
                    }
                }

                if (index === undefined) {
                    index = matchEndIndex + 1
                }
            }
        }

        this.rules.splice(index as number, 0, rule)
        this.ruleBy[className] = rule

        // 只在瀏覽器端運行
        if (this.style) {
            const sheet = this.style.sheet

            let cssRuleIndex = 0
            const getCssRuleIndex = (index: number): void => {
                const previousRule = this.rules[index]
                if (previousRule) {
                    if (!previousRule.natives.length)
                        return getCssRuleIndex(index - 1)

                    const lastNative = previousRule.natives[previousRule.natives.length - 1]
                    const lastNativeCssRule = lastNative.cssRule?.parentRule ?? lastNative.cssRule
                    if (sheet)
                        for (let i = 0; i < sheet.cssRules.length; i++) {
                            if (sheet.cssRules[i] === lastNativeCssRule) {
                                cssRuleIndex = i + 1
                                break
                            }
                        }
                }
            }
            getCssRuleIndex(index as number - 1)

            for (let i = 0; i < rule.natives.length;) {
                try {
                    const native = rule.natives[i]
                    sheet?.insertRule(native.text, cssRuleIndex)
                    native.cssRule = sheet?.cssRules[cssRuleIndex++]
                    i++
                } catch (error) {
                    console.error(error)
                    rule.natives.splice(i, 1)
                }
            }
        }

        // variables
        this.handleRuleWithVariableNames(rule)

        // animations
        this.handleRuleWithAnimationNames(rule)

        rule.definition.insert?.call(rule)

    }

    get text() {
        return this.rules.map((eachRule) => eachRule.text).join('')
    }

    handleRuleWithAnimationNames(rule: Rule, initializing = false) {
        if (rule.animationNames) {
            const sheet = this.style?.sheet
            for (const eachKeyframeName of rule.animationNames) {
                const animation = this.animations[eachKeyframeName]
                if (animation.usage) {
                    animation.usage++
                } else {
                    const nativeRule: NativeRule = {
                        text: `@keyframes ${eachKeyframeName}{`
                            + Object
                                .entries(animation)
                                .filter(([key]) => key !== 'usage' && key !== 'native')
                                .map(([key, variables]) => `${key}{${Object.entries(variables).map(([name, value]) => name + ':' + value).join(';')}}`)
                                .join('')
                            + '}'
                    }

                    const keyframeRulesIndex = Object.keys(this.variablesNativeRules).length ? 1 : 0
                    let keyframeRule: Rule
                    if (this.hasKeyframesRule) {
                        (keyframeRule = this.rules[keyframeRulesIndex]).natives.push(nativeRule)
                    } else {
                        this.rules.splice(
                            keyframeRulesIndex,
                            0,
                            keyframeRule = {
                                natives: [nativeRule],
                                get text() {
                                    return this.natives.map((eachNative) => eachNative.text).join('')
                                }
                            } as Rule
                        )
                        this.hasKeyframesRule = true
                    }

                    if (sheet) {
                        let cssRule: CSSRule | undefined
                        if (initializing) {
                            for (let i = 0; i < sheet.cssRules.length; i++) {
                                const eachCSSRule = sheet.cssRules[i]
                                if (
                                    eachCSSRule.constructor.name === 'CSSKeyframesRule'
                                    && (eachCSSRule as CSSKeyframesRule).name === eachKeyframeName
                                ) {
                                    cssRule = eachCSSRule
                                    break
                                }
                            }
                        }

                        if (cssRule) {
                            nativeRule.cssRule = cssRule
                        } else {
                            const cssRuleIndex = Object.keys(this.variablesNativeRules).length + keyframeRule.natives.length - 1
                            sheet.insertRule(nativeRule.text, cssRuleIndex)
                            nativeRule.cssRule = sheet.cssRules[cssRuleIndex]
                        }
                    }

                    animation.usage = 1
                    animation.native = nativeRule
                }
            }
        }
    }

    handleRuleWithVariableNames(rule: Rule, initializing = false) {
        if (rule.variableNames) {
            const sheet = this.style?.sheet
            for (const eachVariableName of rule.variableNames) {
                const variable = this.variables[eachVariableName]
                if (variable.usage) {
                    variable.usage++
                } else {
                    const addProperty = (mode: string, variableValue: VariableValue) => {
                        let nativeRule = this.variablesNativeRules[mode]
                        if (!nativeRule) {
                            let cssRule: CSSStyleRule
                            let mediaConditionText: string | undefined
                            let selectorText: string

                            if (mode) {
                                switch (this.config.modeDriver) {
                                    case 'media':
                                        mediaConditionText = `@media(prefers-color-scheme:${mode})`
                                        selectorText = ':root'
                                        break
                                    case 'host':
                                        selectorText = `:host(.${mode})`
                                        break
                                    default:
                                        selectorText = `.${mode}`
                                        break
                                }
                            } else {
                                selectorText = ':root'
                            }

                            if (sheet) {
                                const newCSSRuleIndex = Object.keys(this.variablesNativeRules).length
                                    ? this.rules[0].natives.length
                                    : 0
                                sheet.insertRule(
                                    (mediaConditionText ? mediaConditionText + '{' : '')
                                    + selectorText
                                    + '{}'
                                    + (mediaConditionText ? mediaConditionText + '}' : ''),
                                    newCSSRuleIndex
                                )
                                cssRule = (mediaConditionText
                                    ? (sheet.cssRules[newCSSRuleIndex] as CSSMediaRule).cssRules[0]
                                    : sheet.cssRules[newCSSRuleIndex]) as CSSStyleRule
                            } else {
                                const styleMap = new Map()
                                const style: CSSStyleDeclaration = Object.defineProperties(
                                    {} as CSSStyleDeclaration,
                                    {
                                        getPropertyValue: {
                                            value: (property: string) => styleMap.get(property)
                                        },
                                        removeProperty: {
                                            value: (property: string) => {
                                                styleMap.delete(property)
                                                for (let i = 0; i < style.length; i++) {
                                                    if (style[i] === property) {
                                                        delete style[i]
                                                    }
                                                }
                                            }
                                        },
                                        setProperty: {
                                            value: (property: string, value: string) => {
                                                style[style.length] = property
                                                styleMap.set(property, value)
                                            }
                                        },
                                        length: {
                                            get() {
                                                return Object.keys(style).length
                                            }
                                        }
                                    }
                                )
                                cssRule = {
                                    selectorText,
                                    style,
                                    styleMap
                                } as any as CSSStyleRule
                                if (mediaConditionText) {
                                    // @ts-ignore
                                    cssRule.parentRule = { conditionText: mediaConditionText }
                                }
                            }

                            nativeRule = this.pushVariableNativeRule(mode, cssRule)
                        }

                        const propertyName = '--' + eachVariableName
                        if (!initializing || !(nativeRule.cssRule as CSSStyleRule).style.getPropertyValue(propertyName)) {
                            (nativeRule.cssRule as CSSStyleRule).style.setProperty(propertyName, String(variableValue.value))
                        }
                    }
                    if (variable.value) {
                        addProperty('', variable as any)
                    }
                    if (variable.modes) {
                        for (const mode in variable.modes) {
                            addProperty(mode, variable.modes[mode])
                        }
                    }

                    variable.usage = 1
                }
            }
        }
    }

    pushVariableNativeRule(mode: string, variableCSSRule: CSSStyleRule) {
        if (!Object.keys(this.variablesNativeRules).length) {
            this.variablesNativeRules = {}
            const newRule = {
                natives: [],
                get text() {
                    return this.natives.map((eachNative: any) => eachNative.text).join('')
                }
            }
            this.rules.splice(0, 0, newRule as any)
        }

        let prefix = ''
        let suffix = '}'
        if (variableCSSRule.parentRule) {
            prefix += (variableCSSRule.parentRule as CSSMediaRule).conditionText.replace(/ /g, '') + '{'
            suffix += '}'
        }
        prefix += variableCSSRule.selectorText + '{'

        const nativeRule: NativeRule = {
            cssRule: variableCSSRule,
            get text() {
                const properties: string[] = []
                for (let i = 0; i < variableCSSRule.style.length; i++) {
                    const property = variableCSSRule.style[i]
                    properties.push(property + ':' + (variableCSSRule as CSSStyleRule).style.getPropertyValue(property))
                }
                return prefix + properties.join(';') + suffix
            }
        }
        this.rules[0].natives.push(this.variablesNativeRules[mode] = nativeRule)
        return nativeRule
    }
}

export const masterCSSs: MasterCSS[] = []

export default interface MasterCSS {
    readonly style: HTMLStyleElement
    styles: Record<string, string[]>
    stylesBy: Record<string, string[]>
    selectors: Record<string, [RegExp, string[]][]>
    variables: Record<string, Variable>
    queries: Record<string, string | number>
    variablesNativeRules: Record<string, NativeRule>
    hasKeyframesRule: boolean
    animations: Record<string, AnimationDefinitions & { usage?: number, native?: NativeRule }>
}

(() => {
    globalThis.MasterCSS = MasterCSS
    globalThis.masterCSSs = masterCSSs
})()
