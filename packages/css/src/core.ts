import { extend } from '@techor/extend'
import { Rule, NativeRule, RuleDefinition } from './rule'
import type { Config, AnimationDefinitions } from './config'
import { config as defaultConfig } from './config'
import { SELECTOR_SYMBOLS } from './constants/selector-symbols'
import { CSSDeclarations } from './types/css-declarations'
import { Layer } from './layer'
import { hexToRgb } from './utils/hex-to-rgb'

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
    readonly host: Element
    readonly root: Document | ShadowRoot
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
    static refresh = (customConfig: Config) => {
        for (const eachInstance of globalThis.masterCSSs) {
            eachInstance.refresh(customConfig)
        }
    }
    readonly rules: Rule[] = []
    readonly ruleBy: Record<string, Rule> = {}
    readonly classesUsage = {}
    readonly observing = false
    readonly config: Config
    private readonly semanticRuleOptions: RuleDefinition[] = []
    private readonly ruleOptions: RuleDefinition[] = []

    observer: MutationObserver

    constructor(
        public customConfig: Config = defaultConfig
    ) {
        if (!customConfig?.override) {
            this.config = this.getExtendedConfig(defaultConfig, customConfig)
        } else {
            this.config = this.getExtendedConfig(customConfig)
        }
        this.resolve()
        globalThis.masterCSSs.push(this)
    }

    resolve() {
        this.styles = {}
        this.stylesBy = {}
        this.selectors = {}
        this.variables = {}
        this.mediaQueries = {}
        this.animations = {}
        this.ruleOptions.length = 0
        this.semanticRuleOptions.length = 0
        this.variablesNativeRules = undefined
        this.hasKeyframesRule = false
        const colorVariableNames: Record<string, undefined> = {
            current: undefined,
            currentColor: undefined,
            transparent: undefined
        }

        const { styles, selectors, variables, semantics, mediaQueries, rules, animations } = this.config

        function escapeString(str) {
            return str.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')
        }
        function getFlatData(obj: Record<string, any>, hasObjectValue: boolean, parentKey = '', newData: Record<string, any> = {}) {
            const getCurrenyKey = (key) => key ? (parentKey ? parentKey + '-' : '') + key : parentKey
            const entries = Object.entries(obj)
            const objectEntries = []
            const nonObjectEntries = []
            for (const eachEntry of entries) {
                const value = eachEntry[1];
                ((typeof value === 'object' && !Array.isArray(value)) ? objectEntries : nonObjectEntries).push(eachEntry)
            }

            for (const [key, value] of objectEntries) {
                getFlatData(value, hasObjectValue, getCurrenyKey(key), newData)
            }

            if (hasObjectValue && parentKey) {
                if (nonObjectEntries.length) {
                    newData[parentKey] = nonObjectEntries.reduce((newValue, [key, value]) => {
                        newValue[key] = value
                        return newValue
                    }, {})
                }
            } else {
                for (const [key, value] of nonObjectEntries) {
                    newData[getCurrenyKey(key)] = value
                }
            }

            return newData
        }
        if (selectors) {
            for (const [replacedSelectorText, newSelectorText] of Object.entries(getFlatData(selectors, false))) {
                const regexp = new RegExp(escapeString(replacedSelectorText) + '(?![a-z-])')
                for (const eachNewSelectorText of Array.isArray(newSelectorText) ? newSelectorText : [newSelectorText]) {
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
            for (const parnetKey in variables) {
                const transformVariableDeeply = (variable: any, name: string, theme: string = undefined) => {
                    if (!variable)
                        return

                    const addVariable = (
                        name: string,
                        variableValue: VariableValue,
                        replacedTheme: string = undefined,
                        alpha: string = undefined
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
                                    variable.space = variableValue['space']
                                }
                            } else {
                                if (currentTheme) {
                                    this.variables[name] = {
                                        type: variableValue.type,
                                        space: variableValue['space'],
                                        themes: { [currentTheme]: variableValue }
                                    }
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
                                    transformVariableDeeply(variable[eachKey], name, (eachKey || keys.some(eachKey => eachKey.startsWith('@'))) ? eachKey.slice(1) : undefined)
                                } else {
                                    transformVariableDeeply(variable[eachKey], name + '-' + eachKey)
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
                            unexecutedAliasVariable[name][theme] = () => {
                                delete unexecutedAliasVariable[name][theme]

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
                                                addVariable(
                                                    name,
                                                    { type: variable.type, value: variable.value, space: variable['space'] },
                                                    undefined,
                                                    aliasResult[2]
                                                )
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
                transformVariableDeeply(variables[parnetKey], parnetKey)
            }
            for (const name of Object.keys(unexecutedAliasVariable)) {
                for (const theme of Object.keys(unexecutedAliasVariable[name])) {
                    unexecutedAliasVariable[name][theme]?.()
                }
            }
        }
        if (mediaQueries) {
            this.mediaQueries = getFlatData(mediaQueries, false)
        }
        if (animations) {
            for (const animationName in animations) {
                const newValueByPropertyNameByKeyframeName = this.animations[animationName] = {}
                const valueByPropertyNameByKeyframeName = animations[animationName]
                for (const animationName in valueByPropertyNameByKeyframeName) {
                    const newValueByPropertyName = newValueByPropertyNameByKeyframeName[animationName] = {}
                    const valueByPropertyName = valueByPropertyNameByKeyframeName[animationName]
                    for (const propertyName in valueByPropertyName) {
                        newValueByPropertyName[propertyName] = valueByPropertyName[propertyName]
                    }
                }
            }
        }

        const flattedStyles: Record<string, string> = styles ? getFlatData(styles, false) : {}
        const semanticNames = Object.keys(flattedStyles)
        const handleSemanticName = (semanticName: string) => {
            if (Object.prototype.hasOwnProperty.call(this.styles, semanticName))
                return

            const currentClass = this.styles[semanticName] = []

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
                    this.semanticRuleOptions.push({
                        id: '.' + id,
                        resolvedMatch: new RegExp('^' + escapeString(id) + '(?=!|\\*|>|\\+|~|:|\\[|@|_|\\.|$)', 'm'),
                        order: index,
                        declarations,
                        layer: Layer.Semantic
                    })
                })
        }

        if (rules) {
            const rulesEntries = Object.entries(rules).sort((a: any, b: any) => {
                if (a[1].layer !== b[1].layer) {
                    return (b[1].layer || 0) - (a[1].layer || 0)
                }
                return b[0].localeCompare(a[0])
            })
        const rulesEntriesLength = rulesEntries.length
        const colorNames = Object.keys(colorVariableNames)
        rulesEntries
            .forEach(([id, eachRuleOptions]: [string, RuleDefinition], index: number) => {
                this.ruleOptions.push(eachRuleOptions)
                eachRuleOptions.order = this.semanticRuleOptions.length + rulesEntriesLength - 1 - index
                const match = eachRuleOptions.match
                eachRuleOptions.id = id
                eachRuleOptions.resolvedVariables = {}
                const addResolvedVariables = (prefix: string) => {
                    Object.assign(
                        eachRuleOptions.resolvedVariables,
                        Object.keys(this.variables)
                            .filter((eachVariableName) =>
                                eachVariableName.startsWith(prefix + '-') ||
                                eachVariableName.startsWith('-' + prefix + '-'),
                            )
                            .reduce((newResolvedVariables, eachVariableName) => {
                                newResolvedVariables[
                                    eachVariableName.slice(
                                        prefix.length + (prefix.startsWith('-') ? 0 : 1),
                                    )
                                ] = {
                                    ...this.variables[eachVariableName],
                                    name: eachVariableName,
                                }
                                return newResolvedVariables
                            }, {}),
                    )
                }
                // 1. custom `config.rules[id].variables`
                if (eachRuleOptions.variables) {
                    for (const eachVariableGroup of eachRuleOptions.variables) {
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
                        if (Object.keys(eachRuleOptions.resolvedVariables).length) {
                            valueMatches.push(
                                `(?:${Object.keys(eachRuleOptions.resolvedVariables).join('|')})(?![a-zA-Z0-9-])`,
                            )
                        }
                        if (eachRuleOptions.colored) {
                            valueMatches.push(
                                '#',
                                '(?:color|color-contrast|color-mix|hwb|lab|lch|oklab|oklch|rgb|rgba|hsl|hsla)\\(.*\\)',
                                `(?:${colorNames.join('|')})(?![a-zA-Z0-9-])`,
                            )
                        }
                        if (eachRuleOptions.numeric) {
                            valueMatches.push('[\\d\\.]', '(?:max|min|calc|clamp)\\(.*\\)')
                        }
                        if (valueMatches.length)
                            eachRuleOptions.resolvedMatch = new RegExp(`^${key}:(?:${valueMatches.join('|')})[^|]*?(?:@|$)`)
                    } else {
                        eachRuleOptions.resolvedMatch = match as RegExp
                    }
                }
            },
            )
        }
    }

    /**
     * Observe the DOM for changes and update the running stylesheet. (browser only)
     * @param targetRoot root element to observe. default: document
     * @param options mutation observer options
     * @returns this
     */
    observe(targetRoot: Document | ShadowRoot | null | undefined, options: MutationObserverInit = { subtree: true, childList: true }) {
        if (!targetRoot) targetRoot = document
        // prevent repeated observation of the same root element
        if (this.root === targetRoot) {
            return this
        }

        // @ts-ignore
        this.root = targetRoot
        const isDocumentRoot = targetRoot === document

        if (isDocumentRoot) {
            globalThis.masterCSS = this
        }

        // @ts-ignore
        this.host = isDocumentRoot ? document.documentElement : (this.root as ShadowRoot).host

        const container = isDocumentRoot ? document.head : targetRoot
        const styleSheets: StyleSheetList = isDocumentRoot ? document.styleSheets : targetRoot.styleSheets
        // @ts-ignore
        for (const sheet of styleSheets) {
            const { ownerNode } = sheet
            if (ownerNode && (ownerNode as HTMLStyleElement).id === 'master') {
                // @ts-ignore
                this.style = ownerNode
                break
            }
        }

        if (this.style) {
            let index = 0
            for (; index < this.style.sheet.cssRules.length; index++) {
                const eachCSSRule = this.style.sheet.cssRules[index]
                switch (eachCSSRule.constructor.name) {
                    case 'CSSKeyframesRule':
                        continue
                    case 'CSSMeidaRule':
                        if (this.config.themeDriver === 'media') {
                            const result = /\(prefers-color-scheme: (.*?)\)/.exec((eachCSSRule as CSSMediaRule).conditionText)
                            if (result) {
                                const firstCSSRule = (eachCSSRule as CSSMediaRule).cssRules[0]
                                if (
                                    firstCSSRule?.constructor.name === 'CSSStyleRule'
                                    && (firstCSSRule as CSSStyleRule).selectorText === ':root'
                                ) {
                                    this.pushVariableNativeRule(result[1], firstCSSRule as CSSStyleRule)
                                    continue
                                }
                            }
                        }
                        break
                    case 'CSSStyleRule':
                        // eslint-disable-next-line no-case-declarations
                        const selectorText = (eachCSSRule as CSSStyleRule).selectorText
                        if ((eachCSSRule as CSSStyleRule).style.length) {
                            let isVariablesRule = true
                            for (let i = 0; i < (eachCSSRule as CSSStyleRule).style.length; i++) {
                                if (!(eachCSSRule as CSSStyleRule).style[i]?.startsWith('--')) {
                                    isVariablesRule = false
                                    break
                                }
                            }
                            if (isVariablesRule) {
                                if (selectorText === ':root') {
                                    this.pushVariableNativeRule('', eachCSSRule as CSSStyleRule)
                                    continue
                                } else {
                                    if (this.config.themeDriver === 'host') {
                                        const result = /:host(.*?)/.exec(selectorText)
                                        if (result) {
                                            this.pushVariableNativeRule(result[1], eachCSSRule as CSSStyleRule)
                                            continue
                                        }
                                    } else if (!selectorText.startsWith('.\\$')) {
                                        this.pushVariableNativeRule(selectorText.slice(1), eachCSSRule as CSSStyleRule)
                                        continue
                                    }
                                }
                            }
                        }
                        break
                }
            }

            for (;index < this.style.sheet.cssRules.length; index++) {
                const getRule = (cssRule: any): Rule => {
                    if (cssRule.selectorText) {
                        const selectorTexts = cssRule.selectorText.split(', ')
                        const escapedClassNames = selectorTexts[0].split(' ')

                        for (let i = 0; i < escapedClassNames.length; i++) {
                            const eachSelectorText = escapedClassNames[i]
                            if (eachSelectorText[0] === '.') {
                                const escapedClassName = eachSelectorText.slice(1)

                                let className = ''
                                for (let j = 0; j < escapedClassName.length; j++) {
                                    const char = escapedClassName[j]
                                    const nextChar = escapedClassName[j + 1]

                                    if (char === '\\') {
                                        j++

                                        if (nextChar !== '\\') {
                                            className += nextChar

                                            continue
                                        }
                                    } else if (SELECTOR_SYMBOLS.includes(char)) {
                                        break
                                    }

                                    className += char
                                }

                                if (
                                    !(Object.prototype.hasOwnProperty.call(this.ruleBy, className))
                                    && !(Object.prototype.hasOwnProperty.call(this.styles, className))
                                ) {
                                    const currentRule = this.create(className)[0]
                                    if (currentRule)
                                        return currentRule
                                }
                            }
                        }
                    } else if (cssRule.cssRules) {
                        for (let index = 0; index < cssRule.cssRules.length; index++) {
                            const currentRule = getRule(cssRule.cssRules[index])
                            if (currentRule)
                                return currentRule
                        }
                    }
                }
                const rule = getRule(this.style.sheet.cssRules[index])
                if (rule) {
                    this.rules.push(rule)
                    this.ruleBy[rule.className] = rule

                    for (let i = 0; i < rule.natives.length; i++) {
                        rule.natives[i].cssRule = this.style.sheet.cssRules[index + i]
                    }

                    index += rule.natives.length - 1

                    // variables
                    this.handleRuleWithVariableNames(rule, true)

                    // animations
                    this.handleRuleWithAnimationNames(rule, true)

                    rule.definition.insert?.call(rule)
                }
            }
        } else {
            // @ts-ignore
            this.style = document.createElement('style')
            this.style.id = 'master'
            container.append(this.style)
        }

        const handleClassList = (classList: DOMTokenList) => {
            classList.forEach((className) => {
                if (Object.prototype.hasOwnProperty.call(this.classesUsage, className)) {
                    this.classesUsage[className]++
                } else {
                    this.classesUsage[className] = 1

                    this.insert(className)
                }
            })
        }

        handleClassList(this.host.classList)

        if (options.subtree) {
            /**
             * 待所有 DOM 結構完成解析後，開始繪製 Rule 樣式
             */
            this.host
                .querySelectorAll('[class]')
                .forEach((element) => handleClassList(element.classList))
        }

        this.observer = new MutationObserver((mutationRecords) => {
            // console.time('css engine');
            const correctionOfClassName = {}
            const attributeMutationRecords: MutationRecord[] = []
            const updatedElements: Element[] = []
            const unchangedElements: Element[] = []

            /**
            * 取得所有深層後代的 class names
            */
            const handleClassNameDeeply = (element: Element, remove: boolean) => {
                if (remove) {
                    element.classList.forEach(removeClassName)
                } else {
                    element.classList.forEach(addClassName)
                }

                const children = element.children
                for (let i = 0; i < children.length; i++) {
                    const eachChildren = children[i]
                    if (eachChildren.classList) {
                        updatedElements.push(eachChildren)

                        handleClassNameDeeply(eachChildren, remove)
                    }
                }
            }

            const addClassName = (className: string) => {
                if (Object.prototype.hasOwnProperty.call(correctionOfClassName, className)) {
                    correctionOfClassName[className]++
                } else {
                    correctionOfClassName[className] = 1
                }
            }

            const removeClassName = (className: string) => {
                if (Object.prototype.hasOwnProperty.call(correctionOfClassName, className)) {
                    correctionOfClassName[className]--
                } else if (Object.prototype.hasOwnProperty.call(this.classesUsage, className)) {
                    correctionOfClassName[className] = -1
                }
            }

            const handleNodes = (nodes: HTMLCollection, remove: boolean) => {
                for (let i = 0; i < nodes.length; i++) {
                    const eachNode = nodes[i]
                    if (eachNode.classList && !updatedElements.includes(eachNode) && !unchangedElements.includes(eachNode)) {
                        if (eachNode.isConnected !== remove) {
                            updatedElements.push(eachNode)
                            handleClassNameDeeply(eachNode, remove)
                        } else {
                            unchangedElements.push(eachNode)
                        }
                    }
                }
            }

            for (let i = 0; i < mutationRecords.length; i++) {
                const mutationRecord = mutationRecords[i]
                const { addedNodes, removedNodes, type, target } = mutationRecord
                if (type === 'attributes') {
                    /**
                     * 防止同樣的 MutationRecord 重複執行
                     * According to this history,
                     * MutationObserver was designed to work that way.
                     * Any call to setAttribute triggers a mutation,
                     * regardless of whether the value is being changed or set to the current value
                     */
                    if (
                        attributeMutationRecords
                            .find((eachAttributeMutationRecord) => eachAttributeMutationRecord.target === target)
                    ) {
                        continue
                    } else {
                        /**
                         * 第一個匹配到的 oldValue 一定是該批變動前的原始狀態值
                         */
                        attributeMutationRecords.push(mutationRecord)
                    }
                } else {
                    // 先判斷節點新增或移除
                    handleNodes(addedNodes as any, false)

                    // 忽略處理新元素的已刪除子節點
                    if (!target.isConnected || !updatedElements.includes(target as any)) {
                        handleNodes(removedNodes as any, true)
                    }
                }
            }

            if (!attributeMutationRecords.length && !Object.keys(correctionOfClassName).length) {
                // console.timeEnd('css engine');
                return
            }

            for (const { oldValue, target } of attributeMutationRecords) {
                /**
                 * 如果被操作的元素中包含了屬性變更的目標，
                 * 則將該目標從 existedAttributeMutationTargets 中移除，
                 * 以防止執行接下來的屬性變更處理
                 *
                 * 該批 mutationRecords 中，某個 target 同時有 attribute 及 childList 的變更，
                 * 則以 childList 節點插入及移除的 target.className 為主
                 */
                const updated = updatedElements.includes(target as Element)
                const classNames = (target as Element).classList
                const oldClassNames = oldValue ? oldValue.split(' ') : []
                if (updated) {
                    if (target.isConnected) {
                        continue
                    } else {
                        for (const oldClassName of oldClassNames) {
                            if (!classNames.contains(oldClassName)) {
                                removeClassName(oldClassName)
                            }
                        }
                    }
                } else if (target.isConnected) {
                    classNames.forEach((className) => {
                        if (!oldClassNames.includes(className)) {
                            addClassName(className)
                        }
                    })
                    for (const oldClassName of oldClassNames) {
                        if (!classNames.contains(oldClassName)) {
                            removeClassName(oldClassName)
                        }
                    }
                }
            }

            for (const className in correctionOfClassName) {
                const correction = correctionOfClassName[className]
                const count = (this.classesUsage[className] || 0) + correction
                if (count === 0) {
                    // remove
                    delete this.classesUsage[className]
                    /**
                     * class name 從 DOM tree 中被移除，
                     * 匹配並刪除對應的 rule
                     */
                    this.delete(className)
                } else {
                    if (!(Object.prototype.hasOwnProperty.call(this.classesUsage, className))) {
                        // add
                        /**
                         * 新 class name 被 connected 至 DOM tree，
                         * 匹配並創建對應的 Rule
                         */
                        this.insert(className)
                    }

                    this.classesUsage[className] = count
                }
            }

            // console.timeEnd('css engine');
        })
        this.observer.observe(targetRoot, {
            ...options,
            attributes: true,
            attributeOldValue: true,
            attributeFilter: ['class'],
        });

        (this.host as HTMLElement).style.display = null
        // @ts-ignore
        this.observing = true
        return this
    }

    disconnect(): void {
        if (this.observer) {
            this.observer.disconnect()
            this.observer = null
        }
        // @ts-ignore
        this.observing = false
        // @ts-ignore
        this.ruleBy = {}
        // @ts-ignore
        this.classesUsage = {}
        this.rules.length = 0
        this.hasKeyframesRule = false
        this.variablesNativeRules = undefined
        for (const keyframeName in this.animations) {
            const animation = this.animations[keyframeName]
            animation.usage = undefined
            animation.native = undefined
        }
        for (const variableName in this.variables) {
            const variable = this.variables[variableName]
            variable.usage = undefined
        }
        const sheet = this.style?.sheet
        if (sheet?.cssRules) {
            for (let i = sheet.cssRules.length - 1; i >= 0; i--) {
                sheet.deleteRule(i)
            }
        }
        this.style?.remove()
        // @ts-ignore
        this.style = null
        // @ts-ignore
        this.root = null
    }

    /**
     * Match check if Master CSS class syntax
     * @param syntax class syntax
     * @returns css text
     */
    match(syntax: string): RuleDefinition {
        // 1. rules
        for (const eachRuleOptions of this.ruleOptions) {
            if (
                eachRuleOptions.resolvedMatch && eachRuleOptions.resolvedMatch.test(syntax) ||
                (
                    eachRuleOptions.layer === Layer.Native ||
                    eachRuleOptions.layer === Layer.NativeShorthand ||
                    eachRuleOptions.layer === Layer.CoreNative ||
                    eachRuleOptions.layer === Layer.CoreNativeShorthand
                ) && syntax.startsWith(eachRuleOptions.id + ':')
            ) {
                return eachRuleOptions
            }
        }
        // 2. semantic rules
        for (const eachSemanticRuleOptions of this.semanticRuleOptions) {
            if (eachSemanticRuleOptions.resolvedMatch.test(syntax)) {
                return eachSemanticRuleOptions
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

            const ruleConfig = this.match(eachSyntax)
            if (ruleConfig) {
                return new Rule(
                    eachSyntax,
                    ruleConfig,
                    this
                )
            }
        }
        return (
            // `in` cannot be used
            Object.prototype.hasOwnProperty.call(this.styles, syntax)
                ? this.styles[syntax].map((eachSyntax) => create(eachSyntax))
                : [create(syntax)]
        )
            .filter(eachRule => eachRule && eachRule.text)
    }

    /**
     * 根據蒐集到的所有 DOM class 重新 create
     */
    refresh(customConfig: Config = this.customConfig) {
        if (!customConfig?.override) {
            // @ts-ignore
            this.config = this.getExtendedConfig(defaultConfig, customConfig)
        } else {
            // @ts-ignore
            this.config = this.getExtendedConfig(customConfig)
        }
        this.resolve()
        if (!this.style) {
            return
        }
        const newStyle = document.createElement('style')
        newStyle.id = 'master'
        this.style.replaceWith(newStyle)
        // @ts-ignore
        this.style = newStyle
        this.rules.length = 0
        // @ts-ignore
        this.ruleBy = {}

        /**
         * 拿當前所有的 classNames 按照最新的 colors, config.rules 匹配並生成新的 style
         * 所以 refresh 過後 rules 可能會變多也可能會變少
         */
        for (const name in this.classesUsage) {
            this.insert(name)
        }
    }

    destroy() {
        this.disconnect()
        globalThis.masterCSSs.splice(globalThis.masterCSSs.indexOf(this), 1)
    }

    /**
     * 透過類名來刪除對應的 rules
     */
    delete(className: string) {
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
                                    this.variablesNativeRules = undefined
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
                const keyframeRulesIndex = this.variablesNativeRules ? 1 : 0
                const keyframeRule = this.rules[keyframeRulesIndex]
                for (const eachKeyframeName of rule.animationNames) {
                    const keyframe = this.animations[eachKeyframeName]
                    if (!--keyframe.usage) {
                        const nativeIndex = keyframeRule.natives.indexOf(keyframe.native)
                        this.style.sheet.deleteRule((this.variablesNativeRules ? Object.keys(this.variablesNativeRules).length : 0) + nativeIndex)
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

    /**
    * 依類名插入規則
     */
    insert(syntax: string): boolean {
        const rules = this.create(syntax)
        if (rules.length) {
            this.render(rules)
            return true
        } else {
            return false
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
    render(rules: Rule[]) {
        for (const rule of rules) {
            if (this.ruleBy[rule.className])
                continue

            let index: number
            /**
             * 必須按斷點值遞增，並透過索引插入，
             * 以實現響應式先後套用的規則
             * @example <1  <2  <3  ALL  >=1 >=2 >=3
             * @description
             */
            const endIndex = this.rules.length - 1
            const { media, order, priority, hasWhere, className } = rule

            const findIndex = (startIndex: number, stopCheck: (rule: Rule) => any, matchCheck?: (rule: Rule) => any) => {
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

            let matchStartIndex: number
            let matchEndIndex: number
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

                                if (matchStartIndex !== -1) {
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
                const findStartIndex = this.variablesNativeRules
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

            if (index === undefined) {
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

            this.rules.splice(index, 0, rule)
            this.ruleBy[className] = rule

            // 只在瀏覽器端運行
            if (this.style) {
                const sheet = this.style.sheet

                let cssRuleIndex = 0
                const getCssRuleIndex = (index: number) => {
                    const previousRule = this.rules[index]
                    if (previousRule) {
                        if (!previousRule.natives.length)
                            return getCssRuleIndex(index - 1)

                        const lastNative = previousRule.natives[previousRule.natives.length - 1]
                        const lastNativeCssRule = lastNative.cssRule.parentRule ?? lastNative.cssRule
                        for (let i = 0; i < sheet.cssRules.length; i++) {
                            if (sheet.cssRules[i] === lastNativeCssRule) {
                                cssRuleIndex = i + 1
                                break
                            }
                        }
                    }
                }
                getCssRuleIndex(index - 1)

                for (let i = 0; i < rule.natives.length;) {
                    try {
                        const native = rule.natives[i]
                        sheet.insertRule(native.text, cssRuleIndex)
                        native.cssRule = sheet.cssRules[cssRuleIndex++]
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

    private getExtendedConfig(...configs: Config[]) {
        const formatConfig = (config: Config) => {
            const clonedConfig: Config = extend({}, config)

            const formatDeeply = (obj: Record<string, any>) => {
                for (const key in obj) {
                    const value = obj[key]
                    if (typeof value === 'object' && !Array.isArray(value)) {
                        formatDeeply(value)
                    } else if (key && !key.startsWith('@')) {
                        obj[key] = { '': value }
                    }
                }
            }
            if (clonedConfig.styles) {
                formatDeeply(clonedConfig.styles)
            } else {
                clonedConfig.styles = {}
            }
            if (clonedConfig.mediaQueries) {
                formatDeeply(clonedConfig.mediaQueries)
            } else {
                clonedConfig.mediaQueries = {}
            }
            if (clonedConfig.variables) {
                formatDeeply(clonedConfig.variables)
            } else {
                clonedConfig.variables = {}
            }

            return clonedConfig
        }

        const formattedConfigs: Config[] = []
        for (const eachConfig of configs) {
            (function getConfigsDeeply(config: Config) {
                if (config.extends?.length) {
                    for (const eachExtend of config.extends) {
                        getConfigsDeeply('config' in eachExtend ? eachExtend.config : eachExtend)
                    }
                }
                formattedConfigs.push(formatConfig(config))
            })(eachConfig)
        }

        let extendedConfig = formattedConfigs[0]
        for (let i = 1; i < formattedConfigs.length; i++) {
            const currentFormattedConfig = formattedConfigs[i]
            extendedConfig = extend(extendedConfig, currentFormattedConfig)
            if (Object.prototype.hasOwnProperty.call(currentFormattedConfig, 'animations')) {
                Object.assign(extendedConfig.animations, currentFormattedConfig.animations)
            }
        }

        return extendedConfig
    }

    private handleRuleWithAnimationNames(rule: Rule, initializing = false) {
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

                    const keyframeRulesIndex = this.variablesNativeRules ? 1 : 0
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
                        let cssRule: CSSRule
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
                            const cssRuleIndex = (this.variablesNativeRules ? Object.keys(this.variablesNativeRules).length : 0) + keyframeRule.natives.length - 1
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

    private handleRuleWithVariableNames(rule: Rule, initializing = false) {
        if (rule.variableNames) {
            const sheet = this.style?.sheet
            for (const eachVariableName of rule.variableNames) {
                const variable = this.variables[eachVariableName]
                if (variable.usage) {
                    variable.usage++
                } else {
                    const addProperty = (theme: string, variableValue: VariableValue) => {
                        let nativeRule = this.variablesNativeRules?.[theme]
                        if (!nativeRule) {
                            let cssRule: CSSStyleRule
                            let mediaConditionText: string
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
                                const newCSSRuleIndex = this.variablesNativeRules
                                    ? this.rules[0].natives.length
                                    : 0
                                sheet.insertRule(
                                    (mediaConditionText ? mediaConditionText + '{' : '')
                                        + selectorText
                                        + '{}'
                                        +  (mediaConditionText ? mediaConditionText + '}' : ''),
                                    newCSSRuleIndex
                                )
                                cssRule = (mediaConditionText
                                    ? (sheet.cssRules[newCSSRuleIndex] as CSSMediaRule).cssRules[0]
                                    : sheet.cssRules[newCSSRuleIndex]) as CSSStyleRule
                            } else {
                                const styleMap = new Map()
                                const style = Object.defineProperties(
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

    private pushVariableNativeRule(theme: string, variableCSSRule: CSSStyleRule) {
        if (!this.variablesNativeRules) {
            this.variablesNativeRules = {}
            this.rules.splice(
                0,
                0,
                {
                    natives: [],
                    get text() {
                        return this.natives.map((eachNative) => eachNative.text).join('')
                    }
                } as Rule
            )
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

declare global {
    interface Window {
        MasterCSS: typeof MasterCSS
        masterCSSConfig: Config
        masterCSSs: MasterCSS[]
        masterCSS: MasterCSS
    }

    // eslint-disable-next-line @typescript-eslint/no-namespace
    namespace NodeJS {
        interface Global {
            MasterCSS: typeof MasterCSS;
            masterCSSs: MasterCSS[]
        }
    }
}

(() => {
    globalThis.MasterCSS = MasterCSS
    if (!globalThis.masterCSSs) globalThis.masterCSSs = []
})()