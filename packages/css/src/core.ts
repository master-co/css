/* eslint-disable @typescript-eslint/no-unsafe-declaration-merging */
import { Rule, NativeRule, RuleDefinition, RegisteredRule } from './rule'
import type { Config, AnimationDefinitions } from './config'
import { config as defaultConfig } from './config'
import { CSSDeclarations } from './types/css-declarations'
import { Layer } from './layer'
import { hexToRgb } from './utils/hex-to-rgb'
import { flattenObject } from './utils/flatten-object'
import { extendConfig } from './utils/extend-config'
import './types/global'

type VariableValue =
    { type: 'string', value: string }
    | { type: 'number', value: number }
    | { type: 'color', value: string, space: 'rgb' | 'hsl' }

export type Variable = Omit<VariableValue, 'value' | 'space'> & {
    value?: any,
    space?: any,
    usage?: number,
    themes?: { [theme: string]: VariableValue }
}

export interface MasterCSS {
    readonly style: HTMLStyleElement
    styles: Record<string, string[]>
    stylesBy: Record<string, string[]>
    selectors: Record<string, [RegExp, string[]][]>
    variables: Record<string, Variable>
    mediaQueries: Record<string, string | number>
    variablesNativeRules: Record<string, NativeRule>
    hasKeyframesRule: boolean
    animations: Record<string, AnimationDefinitions & { usage?: number, native?: NativeRule }>
}

export class MasterCSS {
    static config: Config = defaultConfig
    readonly rules: Rule[] = []
    readonly ruleBy: Record<string, Rule> = {}
    readonly classesUsage: Record<string, number> = {}
    readonly config: Config
    readonly RegisteredSemanticRules: RegisteredRule[] = []
    readonly RegisteredRules: RegisteredRule[] = []

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
        this.mediaQueries = {}
        this.animations = {}
        this.RegisteredRules.length = 0
        this.RegisteredSemanticRules.length = 0
        this.variablesNativeRules = {}
        this.hasKeyframesRule = false
        const colorVariableNames: Record<string, undefined> = {
            current: undefined,
            currentColor: undefined,
            transparent: undefined
        }

        const { styles, selectors, variables, semantics, mediaQueries, rules, animations } = this.config

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
            const unexecutedAliasVariable: Record<string, { [theme: string]: () => void }> = {}
            const parseVariable = (variable: any, name: string, theme?: string) => {
                if (!variable)
                    return

                const addVariable = (
                    name: string,
                    variableValue: VariableValue,
                    replacedTheme?: string,
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
                                    : (variableValue.value.slice(0, slashIndex + 2) + (+variableValue.value.slice(slashIndex + 2) * +alpha).toString().slice(1))
                            }
                        }

                        colorVariableNames[name] = undefined
                    }

                    const currentTheme = replacedTheme ?? theme
                    if (currentTheme !== undefined) {
                        if (Object.prototype.hasOwnProperty.call(this.variables, name)) {
                            const variable = this.variables[name]
                            if (currentTheme) {
                                if (!variable.themes) {
                                    variable.themes = {}
                                }
                                variable.themes[currentTheme] = variableValue
                            } else {
                                variable.value = variableValue.value
                                if (variableValue.type === 'color') {
                                    variable.space = variableValue.space
                                }
                            }
                        } else {
                            if (currentTheme) {
                                const newVariable: Variable = {
                                    type: variableValue.type,
                                    themes: { [currentTheme]: variableValue }
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
                        unexecutedAliasVariable[name][theme as string] = () => {
                            delete unexecutedAliasVariable[name][theme as string]

                            const [alias, aliasTheme] = aliasResult[1].split('@')
                            if (alias) {
                                if (Object.prototype.hasOwnProperty.call(unexecutedAliasVariable, alias)) {
                                    for (const theme of Object.keys(unexecutedAliasVariable[alias])) {
                                        unexecutedAliasVariable[alias][theme]?.()
                                    }
                                }

                                const aliasVariable = this.variables[alias]
                                if (aliasVariable) {
                                    if (aliasTheme === undefined && aliasVariable.themes) {
                                        addVariable(
                                            name,
                                            { type: aliasVariable.type, value: aliasVariable.value, space: aliasVariable.space },
                                            '',
                                            aliasResult[2]
                                        )
                                        for (const theme in aliasVariable.themes) {
                                            addVariable(
                                                name,
                                                aliasVariable.themes[theme],
                                                theme,
                                                aliasResult[2]
                                            )
                                        }
                                    } else {
                                        const variable = aliasTheme !== undefined
                                            ? aliasVariable.themes?.[aliasTheme]
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
                for (const theme of Object.keys(unexecutedAliasVariable[name])) {
                    unexecutedAliasVariable[name][theme]?.()
                }
            }
        }

        if (mediaQueries) {
            this.mediaQueries = flattenObject(mediaQueries)
        }

        if (animations) {
            for (const animationName in animations) {
                const newValueByPropertyNameByKeyframeName: any = this.animations[animationName] = {}
                const valueByPropertyNameByKeyframeName = animations[animationName]
                for (const animationName in valueByPropertyNameByKeyframeName) {
                    const newValueByPropertyName: any = newValueByPropertyNameByKeyframeName[animationName] = {}
                    const valueByPropertyName = valueByPropertyNameByKeyframeName[animationName]
                    for (const propertyName in valueByPropertyName) {
                        newValueByPropertyName[propertyName] = valueByPropertyName[propertyName]
                    }
                }
            }
        }

        const flattedStyles: Record<string, string> = styles ? flattenObject(styles) : {}
        const semanticNames = Object.keys(flattedStyles)
        const handleSemanticName = (semanticName: string) => {
            if (Object.prototype.hasOwnProperty.call(this.styles, semanticName))
                return

            const currentClass: string[] = this.styles[semanticName] = []

            const className = flattedStyles[semanticName]
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
                        if (!currentRelation.includes(semanticName)) {
                            currentRelation.push(semanticName)
                        }
                    } else {
                        this.stylesBy[className] = [semanticName]
                    }

                    if (!currentClass.includes(className)) {
                        currentClass.push(className)
                    }
                }

                if (semanticNames.includes(eachClassName)) {
                    handleSemanticName(eachClassName)

                    for (const parentClassName of this.styles[eachClassName]) {
                        handle(parentClassName)
                    }
                } else {
                    handle(eachClassName)
                }
            }
        }
        for (const eachSemanticName of semanticNames) {
            handleSemanticName(eachSemanticName)
        }

        if (semantics) {
            Object.entries(semantics)
                .sort((a: any, b: any) => a[0].localeCompare(b[0]))
                .forEach(([id, declarations]: [string, CSSDeclarations], index: number) => {
                    this.RegisteredSemanticRules.push({
                        id: '.' + id,
                        match: new RegExp('^' + escapeString(id) + '(?=!|\\*|>|\\+|~|:|\\[|@|_|\\.|$)', 'm'),
                        order: index,
                        definition: {
                            declarations,
                            layer: Layer.Semantic
                        }
                    } as RegisteredRule)
                })
        }

        if (rules) {
            const rulesEntries = Object.entries(rules)
                .sort((a: any, b: any) => {
                    if (a[1].layer !== b[1].layer) {
                        return (b[1].layer || 0) - (a[1].layer || 0)
                    }
                    return b[0].localeCompare(a[0])
                }) as [string, RuleDefinition][]
            const rulesEntriesLength = rulesEntries.length
            const colorNames = Object.keys(colorVariableNames)
            rulesEntries
                .forEach(([id, eachRuleDefinition]: [string, RuleDefinition], index: number) => {
                    const eachRegisteredRule: RegisteredRule = {
                        id,
                        variables: {},
                        order: this.RegisteredSemanticRules.length + rulesEntriesLength - 1 - index,
                        definition: eachRuleDefinition
                    }
                    this.RegisteredRules.push(eachRegisteredRule)
                    const match = eachRuleDefinition.match

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

                    if (match) {
                        if (Array.isArray(match)) {
                            const [key, values = []] = match
                            const valueMatches = []
                            if (values.length) {
                                valueMatches.push(`(?:${values.join('|')})(?![a-zA-Z0-9-])`)
                            }
                            if (Object.keys(eachRegisteredRule.variables).length) {
                                valueMatches.push(
                                    `(?:${Object.keys(eachRegisteredRule.variables).join('|')})(?![a-zA-Z0-9-])`,
                                )
                            }
                            if (eachRuleDefinition.colored) {
                                valueMatches.push(
                                    '#',
                                    '(?:color|color-contrast|color-mix|hwb|lab|lch|oklab|oklch|rgb|rgba|hsl|hsla)\\(.*\\)',
                                    `(?:${colorNames.join('|')})(?![a-zA-Z0-9-])`,
                                )
                            }
                            if (eachRuleDefinition.numeric) {
                                valueMatches.push('[\\d\\.]', '(?:max|min|calc|clamp)\\(.*\\)')
                            }
                            if (valueMatches.length)
                                eachRegisteredRule.match = new RegExp(`^${key}:(?:${valueMatches.join('|')})[^|]*?(?:@|$)`)
                        } else {
                            eachRegisteredRule.match = match as RegExp
                        }
                    }
                },
                )
        }
    }

    /**
     * Match check if Master CSS class syntax
     * @param syntax class syntax
     * @returns css text
     */
    match(syntax: string): RegisteredRule | undefined {
        // 1. rules
        for (const eachRegisteredRule of this.RegisteredRules) {
            if (
                eachRegisteredRule.match?.test(syntax) ||
                (
                    eachRegisteredRule.definition.layer === Layer.Native ||
                    eachRegisteredRule.definition.layer === Layer.NativeShorthand ||
                    eachRegisteredRule.definition.layer === Layer.CoreNative ||
                    eachRegisteredRule.definition.layer === Layer.CoreNativeShorthand
                ) && syntax.startsWith(eachRegisteredRule.id + ':')
            ) {
                return eachRegisteredRule
            }
        }
        // 2. semantic rules
        for (const EachRegisteredSemanticRule of this.RegisteredSemanticRules) {
            if (EachRegisteredSemanticRule.match?.test(syntax)) {
                return EachRegisteredSemanticRule
            }
        }
    }

    /**
     * Create rules from class syntax
     * @param syntax class syntax
     * @returns Rule[]
     */
    create(syntax: string): Rule[] {
        const create = (eachSyntax: string) => {
            if (Object.prototype.hasOwnProperty.call(this.ruleBy, eachSyntax))
                return this.ruleBy[eachSyntax]

            const RegistedRule = this.match(eachSyntax)
            if (RegistedRule) {
                return new Rule(eachSyntax, RegistedRule, this)
            }
        }
        return (
            Object.prototype.hasOwnProperty.call(this.styles, syntax)
                ? this.styles[syntax].map((eachSyntax) => create(eachSyntax))
                : [create(syntax)]
        )
            .filter(eachRule => eachRule && eachRule.text) as Rule[]
    }

    /**
     * 根據蒐集到的所有 DOM class 重新 create
     */
    refresh(customConfig: Config = this.customConfig) {
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

    add(syntax: string): boolean {
        const rules = this.create(syntax)
        if (rules.length) {
            this.insert(rules)
            return true
        } else {
            return false
        }
    }

    delete(syntax: string) {
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
                        const removeProperty = (theme: string) => {
                            const nativeRule = this.variablesNativeRules[theme];
                            (nativeRule.cssRule as CSSStyleRule).style.removeProperty('--' + eachVariableName)
                            if (!(nativeRule.cssRule as CSSStyleRule).style.length) {
                                const variablesRule = this.rules[0]
                                const index = variablesRule.natives.indexOf(nativeRule)
                                sheet?.deleteRule(index)
                                variablesRule.natives.splice(index, 1)
                                delete this.variablesNativeRules[theme]
                                if (!variablesRule.natives.length) {
                                    this.rules.splice(0, 1)
                                    this.variablesNativeRules = {}
                                }
                            }
                        }
                        if (variable.value) {
                            removeProperty('')
                        }
                        if (variable.themes) {
                            for (const theme in variable.themes) {
                                removeProperty(theme)
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

        if (Object.prototype.hasOwnProperty.call(this.styles, syntax)) {
            for (const eachClassName of this.styles[syntax]) {
                if (!Object.prototype.hasOwnProperty.call(this.classesUsage, eachClassName)) {
                    deleteRule(eachClassName)
                }
            }

            delete this.ruleBy[syntax]
        } else {
            deleteRule(syntax)
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
    insert(rules: Rule[]) {
        for (const rule of rules) {
            if (this.ruleBy[rule.className])
                continue

            let index: number | undefined
            /**
             * 必須按斷點值遞增，並透過索引插入，
             * 以實現響應式先後套用的規則
             * @example <1  <2  <3  ALL  >=1 >=2 >=3
             * @description
             */
            const endIndex = this.rules.length - 1
            const { media, order, priority, hasWhere, className } = rule

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
            if (media) {
                const mediaStartIndex = this.rules.findIndex(eachRule => eachRule.media)
                if (mediaStartIndex === -1) {
                    index = endIndex + 1
                } else {
                    const { 'max-width': maxWidthFeature, 'min-width': minWidthFeature } = media.features
                    if (maxWidthFeature || minWidthFeature) {
                        const mediaWidthStartIndex = this.rules.findIndex(eachRule => eachRule.media?.features['max-width'] || eachRule.media?.features['min-width'])
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
                                        eachRule => eachRule.media.features['max-width'] && eachRule.media.features['min-width']
                                    )
                                    matchEndIndex = findIndex(
                                        mediaWidthStartIndex,
                                        eachRule => eachRule.priority !== -1
                                    )
                                } else {
                                    matchStartIndex = findIndex(
                                        mediaWidthStartIndex,
                                        undefined,
                                        eachRule => eachRule.media.features['max-width'] && eachRule.media.features['min-width'] && eachRule.priority !== -1
                                    )
                                    matchEndIndex = endIndex
                                }

                                if (matchStartIndex !== -1) {
                                    const range = maxWidthFeature.value - minWidthFeature.value

                                    let i = matchEndIndex
                                    const endI = matchStartIndex
                                    matchStartIndex = undefined
                                    for (; i >= endI; i--) {
                                        const { 'max-width': eachMaxWidthFeature, 'min-width': eachMinWidthFeature } = this.rules[i].media.features
                                        const eachRange = eachMaxWidthFeature.value - eachMinWidthFeature.value
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
                                    const range = maxWidthFeature.value - minWidthFeature.value
                                    for (let i = matchEndIndex; i >= matchStartIndex; i--) {
                                        const { 'max-width': eachMaxWidthFeature, 'min-width': eachMinWidthFeature } = this.rules[i].media.features
                                        const eachRange = eachMaxWidthFeature.value - eachMinWidthFeature.value
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
                                        eachRule => eachRule.media.features['max-width'] && eachRule.media.features['min-width'] || eachRule.priority !== -1,
                                        eachRule => !eachRule.media.features['max-width'] && eachRule.media.features['min-width']
                                    )
                                    matchEndIndex = findIndex(
                                        mediaWidthStartIndex,
                                        eachRule => eachRule.media.features['max-width'] && eachRule.media.features['min-width'] || eachRule.priority !== -1
                                    )
                                } else {
                                    matchStartIndex = findIndex(
                                        mediaWidthStartIndex,
                                        eachRule => eachRule.media.features['max-width'] && eachRule.media.features['min-width'] && eachRule.priority !== -1,
                                        eachRule => !eachRule.media.features['max-width'] && eachRule.media.features['min-width'] && eachRule.priority !== -1
                                    )
                                    matchEndIndex = findIndex(
                                        mediaWidthStartIndex,
                                        eachRule => eachRule.media.features['max-width'] && eachRule.media.features['min-width'] && eachRule.priority !== -1
                                    )
                                }

                                if (matchStartIndex !== -1) {
                                    for (let i = matchEndIndex; i >= matchStartIndex; i--) {
                                        const value = this.rules[i].media.features['min-width'].value
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
                                        eachRule => eachRule.media.features['min-width'] || eachRule.priority !== -1,
                                        eachRule => eachRule.media.features['max-width']
                                    )
                                    matchEndIndex = findIndex(
                                        mediaWidthStartIndex,
                                        eachRule => eachRule.media.features['min-width'] || eachRule.priority !== -1
                                    )
                                } else {
                                    matchStartIndex = findIndex(
                                        mediaWidthStartIndex,
                                        eachRule => eachRule.media.features['min-width'] && eachRule.priority !== -1,
                                        eachRule => eachRule.media.features['max-width'] && eachRule.priority !== -1
                                    )
                                    matchEndIndex = findIndex(
                                        mediaWidthStartIndex,
                                        eachRule => eachRule.media.features['min-width'] && eachRule.priority !== -1
                                    )
                                }

                                if (matchStartIndex !== -1) {
                                    for (let i = matchEndIndex; i >= matchStartIndex; i--) {
                                        const value = this.rules[i].media.features['max-width'].value
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
                                eachRule => eachRule.media?.features['max-width'] || eachRule.media?.features['min-width'] || eachRule.priority !== -1
                            )
                        } else {
                            matchStartIndex = findIndex(
                                mediaStartIndex,
                                eachRule => eachRule.media?.features['max-width'] || eachRule.media?.features['min-width'],
                                eachRule => eachRule.priority !== -1
                            )
                            matchEndIndex = findIndex(
                                mediaStartIndex,
                                eachRule => eachRule.media?.features['max-width'] || eachRule.media?.features['min-width']
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
                        eachRule => eachRule.media || eachRule.priority !== -1
                    )
                } else {
                    matchStartIndex = findIndex(
                        findStartIndex,
                        eachRule => eachRule.media,
                        eachRule => eachRule.priority !== -1
                    )
                    matchEndIndex = findIndex(
                        findStartIndex,
                        eachRule => eachRule.media
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
                    const addProperty = (theme: string, variableValue: VariableValue) => {
                        let nativeRule = this.variablesNativeRules[theme]
                        if (!nativeRule) {
                            let cssRule: CSSStyleRule
                            let mediaConditionText: string | undefined
                            let selectorText: string

                            if (theme) {
                                switch (this.config.themeDriver) {
                                    case 'media':
                                        mediaConditionText = `@media(prefers-color-scheme:${theme})`
                                        selectorText = ':root'
                                        break
                                    case 'host':
                                        selectorText = `:host(.${theme})`
                                        break
                                    default:
                                        selectorText = `.${theme}`
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

                            nativeRule = this.pushVariableNativeRule(theme, cssRule)
                        }

                        const propertyName = '--' + eachVariableName
                        if (!initializing || !(nativeRule.cssRule as CSSStyleRule).style.getPropertyValue(propertyName)) {
                            (nativeRule.cssRule as CSSStyleRule).style.setProperty(propertyName, variableValue.value.toString())
                        }
                    }
                    if (variable.value) {
                        addProperty('', variable as any)
                    }
                    if (variable.themes) {
                        for (const theme in variable.themes) {
                            addProperty(theme, variable.themes[theme])
                        }
                    }

                    variable.usage = 1
                }
            }
        }
    }

    pushVariableNativeRule(theme: string, variableCSSRule: CSSStyleRule) {
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
        this.rules[0].natives.push(this.variablesNativeRules[theme] = nativeRule)
        return nativeRule
    }
}

export const masterCSSs: MasterCSS[] = [];

(() => {
    globalThis.MasterCSS = MasterCSS
    globalThis.masterCSSs = masterCSSs
})()

