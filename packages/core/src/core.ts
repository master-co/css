/* eslint-disable @typescript-eslint/no-unsafe-declaration-merging */
import { SyntaxRule } from './syntax-rule'
import { config as defaultConfig } from './config'
import hexToRgb from './utils/hex-to-rgb'
import { flattenObject } from './utils/flatten-object'
import extendConfig from './utils/extend-config'
import { type PropertiesHyphen } from 'csstype'
import './types/global' // fix: ../css/src/core.ts:1205:16 - error TS7017: Element implicitly has an 'any' type because type 'typeof globalThis' has no index signature.
import SyntaxLayer from './syntax-layer'
import { Rule } from './rule'
import SyntaxRuleType from './syntax-rule-type'
import Layer from './layer'
import NonLayer from './non-layer'
import { ColorVariable, DefinedRule, Variable } from './types/syntax'
import { AnimationDefinitions, Config, SyntaxRuleDefinition, VariableDefinition } from './types/config'
import { Vendors } from './types/common'

export default class MasterCSS {
    static config: Config = defaultConfig
    readonly definedRules: DefinedRule[] = []
    readonly config: Config
    readonly classUsages = new Map<string, number>()
    readonly layerStatementRule = new Rule('layer-statement', [{ text: '@layer base,theme,preset,components,general;' }])
    readonly rules: (Layer | Rule)[] = [this.layerStatementRule]
    readonly animationsNonLayer = new NonLayer(this)
    readonly baseLayer = new SyntaxLayer('base', this)
    readonly themeLayer = new Layer('theme', this)
    readonly presetLayer = new SyntaxLayer('preset', this)
    readonly componentsLayer = new SyntaxLayer('components', this)
    readonly generalLayer = new SyntaxLayer('general', this)

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

    constructor(
        public customConfig?: Config
    ) {
        this.config = customConfig?.override
            ? extendConfig(customConfig)
            : extendConfig(defaultConfig, customConfig)
        this.resolve()
        if (this.constructor === MasterCSS) {
            masterCSSs.push(this)
        }
    }

    resolve() {
        this.components = {}
        this.selectors = {}
        this.variables = {}
        this.at = {}
        this.animations = {}
        this.definedRules.length = 0

        const colorVariableNames: Record<string, undefined> = {
            current: undefined,
            currentColor: undefined,
            transparent: undefined
        }

        const { components, selectors, variables, utilities, at, rules, animations } = this.config

        function escapeString(str: string) {
            return str.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')
        }

        if (selectors) {
            const resolvedSelectors = flattenObject(selectors)
            for (const eachSelectorName in resolvedSelectors) {
                const eachResolvedSelectorText = resolvedSelectors[eachSelectorName]
                const regexp = new RegExp(escapeString(eachSelectorName) + '(?![a-z-])')
                for (const eachNewSelectorText of Array.isArray(eachResolvedSelectorText) ? eachResolvedSelectorText : [eachResolvedSelectorText]) {
                    const vendor = eachNewSelectorText.match(/^:(?::)?-(webkit|moz|ms|o)-/m)?.[1] ?? ''
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
            const unexecutedAliasVariable: Record<string, Record<string, () => void>> = {}
            const resolveVariable = (variableDefinition: VariableDefinition, name: string[], mode?: string) => {
                if (variableDefinition === undefined || variableDefinition === null) return
                const addVariable = (
                    name: string[],
                    variable: any,
                    replacedMode?: string,
                    alpha?: string
                ) => {
                    if (variable === undefined)
                        return
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
                        colorVariableNames[flatName] = undefined
                    }
                    /**
                     * resolve `variables.screen-*` to `at.*`
                     */
                    if (variable.name.startsWith('screen-') && variable.type === 'number') {
                        this.at[variable.name.slice(7)] = variable.value
                    }
                    const currentMode = replacedMode ?? mode
                    if (currentMode !== undefined) {
                        if (Object.prototype.hasOwnProperty.call(this.variables, flatName)) {
                            const foundVariable = this.variables[flatName]
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
                                this.variables[flatName] = newVariable
                            } else {
                                this.variables[flatName] = variable
                            }
                        }
                    } else {
                        this.variables[flatName] = variable
                    }
                }
                if (typeof variableDefinition === 'object') {
                    if (Array.isArray(variableDefinition)) {
                        addVariable(name, { type: 'string', value: variableDefinition.join(',') })
                    } else {
                        const keys = Object.keys(variableDefinition)
                        for (const eachKey of keys) {
                            if (eachKey === '' || eachKey.startsWith('@')) {
                                resolveVariable(variableDefinition[eachKey] as VariableDefinition, name, (eachKey || keys.some(eachKey => eachKey.startsWith('@'))) ? eachKey.slice(1) : undefined)
                            } else {
                                resolveVariable(variableDefinition[eachKey] as VariableDefinition, [...name, eachKey])
                            }
                        }
                    }
                } else if (typeof variableDefinition === 'number') {
                    addVariable(name, { type: 'number', value: variableDefinition })
                    addVariable(['', ...name], { type: 'number', value: variableDefinition * -1 })
                } else if (typeof variableDefinition === 'string') {
                    const aliasResult = /^\$\((.*?)\)(?: ?\/ ?(.+?))?$/.exec(variableDefinition)
                    const flatName = name.join('-')
                    if (aliasResult) {
                        if (!Object.prototype.hasOwnProperty.call(unexecutedAliasVariable, flatName)) {
                            unexecutedAliasVariable[flatName] = {}
                        }
                        unexecutedAliasVariable[flatName][mode as string] = () => {
                            delete unexecutedAliasVariable[flatName][mode as string]

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
                                            { type: aliasVariable.type, value: aliasVariable.value, space: (aliasVariable as ColorVariable).space },
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
                                            const newVariable = { type: variable.type, value: variable.value } as Variable
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
            for (const parnetKey in variables) {
                resolveVariable(variables[parnetKey], [parnetKey])
            }
            // todo: address to the target variable
            for (const name of Object.keys(unexecutedAliasVariable)) {
                for (const mode of Object.keys(unexecutedAliasVariable[name])) {
                    unexecutedAliasVariable[name][mode]?.()
                }
            }
        }

        if (at) {
            Object.assign(this.at, flattenObject(at))
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

        const flattedStyles: Record<string, string> = components ? flattenObject(components) : {}
        const utilityNames = Object.keys(flattedStyles)
        const handleUtilityName = (utilityName: string) => {
            if (Object.prototype.hasOwnProperty.call(this.components, utilityName))
                return

            const currentClass: string[] = this.components[utilityName] = []

            const className = flattedStyles[utilityName]
            if (!className)
                return

            const classNames: string[] = className
                .replace(/(?:\n(?:\s*))+/g, ' ')
                .trim()
                .split(' ')
            for (const eachClassName of classNames) {
                const handle = (className: string) => {
                    if (!currentClass.includes(className)) {
                        currentClass.push(className)
                    }
                }

                if (utilityNames.includes(eachClassName)) {
                    handleUtilityName(eachClassName)

                    for (const parentClassName of this.components[eachClassName]) {
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
            const rulesEntries: [string, SyntaxRuleDefinition][] = []
            if (utilities) {
                for (const utilityName in utilities) {
                    const declarations = utilities[utilityName] as any
                    rulesEntries.push([utilityName, { declarations, type: SyntaxRuleType.Utility }])
                }
            }
            if (rules) {
                rulesEntries.push(...Object.entries(rules) as [string, SyntaxRuleDefinition][])
            }
            const rulesEntriesLength = rulesEntries.length
            const colorNames = Object.keys(colorVariableNames)
            rulesEntries
                .sort((a: any, b: any) => {
                    if (a[1].type !== b[1].type) {
                        return (b[1].type || 0) - (a[1].type || 0)
                    }
                    return b[0].localeCompare(a[0])
                })
                .forEach(([id, eachSyntaxRuleDefinition], index: number) => {
                    const syntax: DefinedRule = {
                        id,
                        keys: [],
                        variables: {},
                        matchers: {},
                        order: rulesEntriesLength - 1 - index,
                        definition: eachSyntaxRuleDefinition
                    }
                    if (!eachSyntaxRuleDefinition.unit) {
                        eachSyntaxRuleDefinition.unit = ''
                    }
                    if (!eachSyntaxRuleDefinition.separators) {
                        eachSyntaxRuleDefinition.separators = [',']
                    }
                    this.definedRules.push(syntax)
                    const { matcher, type, subkey, ambiguousKeys, ambiguousValues, sign } = eachSyntaxRuleDefinition
                    if (type === SyntaxRuleType.Utility) {
                        syntax.id = '.' + id
                        syntax.matchers.arbitrary = new RegExp('^' + escapeString(id) + '(?=!|\\*|>|\\+|~|:|\\[|@|_|\\.|$)', 'm')
                    }

                    // todo: 不可使用 startsWith 判斷，應改為更精準的從 config.variables 取得目標變數群組，但 config.variables 中的值還沒被 resolve 像是 Array
                    const addResolvedVariables = (groupName: string) => {
                        for (const eachVariableName in this.variables) {
                            const eachVariable = this.variables[eachVariableName]
                            if (eachVariable.group === groupName) {
                                syntax.variables[eachVariable.key] = eachVariable
                            }
                        }
                    }

                    // 1. custom `config.rules[id].variables`
                    if (eachSyntaxRuleDefinition.variables) {
                        for (const eachVariableGroup of eachSyntaxRuleDefinition.variables) {
                            addResolvedVariables(eachVariableGroup)
                        }
                    }

                    // 2. custom `config.variables`
                    addResolvedVariables(id)
                    const keys = []
                    let { key } = eachSyntaxRuleDefinition
                    if (type === SyntaxRuleType.NativeShorthand || type === SyntaxRuleType.Native) {
                        if (!key) eachSyntaxRuleDefinition.key = key = id
                        keys.push(id)
                    }
                    if (sign) {
                        syntax.matchers.arbitrary = new RegExp(`^${sign}[^!*>+~:[@_]+\\|`)
                    } else if (!matcher) {
                        const colorsPatten = colorNames.join('|')
                        if (!key && !subkey) {
                            keys.push(id)
                        } else {
                            if (key && !keys.includes(key)) keys.push(key)
                            if (subkey) keys.push(subkey)
                            if (type === SyntaxRuleType.Shorthand) {
                                keys.push(id)
                            }
                        }
                        if (ambiguousKeys?.length) {
                            const ambiguousKeyPattern = ambiguousKeys.length > 1 ? `(?:${ambiguousKeys.join('|')})` : ambiguousKeys[0]
                            const variableKeys = Object.keys(syntax.variables)
                            if (ambiguousValues?.length) {
                                const ambiguousValuePatterns = []
                                for (const eachAmbiguousValue of ambiguousValues) {
                                    if (eachAmbiguousValue instanceof RegExp) {
                                        ambiguousValuePatterns.push(eachAmbiguousValue.source.replace('\\$colors', colorsPatten))
                                    } else {
                                        ambiguousValuePatterns.unshift(`${eachAmbiguousValue}(?:\\b|_)`)
                                    }
                                }
                                syntax.matchers.value = new RegExp(`^${ambiguousKeyPattern}:(?:${ambiguousValuePatterns.join('|')})[^|]*?(?:@|$)`)
                            }
                            if (variableKeys.length) {
                                syntax.matchers.variable = new RegExp(`^${ambiguousKeyPattern}:(?:${variableKeys.join('|')}(?![a-zA-Z0-9-]))[^|]*?(?:@|$)`)
                            }
                        }
                    } else {
                        syntax.matchers.arbitrary = matcher as RegExp
                    }
                    if (keys.length) {
                        syntax.keys = keys
                        syntax.matchers.key = new RegExp(`^${keys.length > 1 ? `(${keys.join('|')})` : keys[0]}:.`)
                    }
                })
        }

        for (const utilityName in this.components) {
            const syntaxRulesByStateToken = this.components[utilityName]
                .map((eachSyntax) => this.create(eachSyntax))
                .filter(eachSyntax => eachSyntax?.text)
                .reduce((obj, eachSyntaxRule) => {
                    if (eachSyntaxRule!.stateToken in obj) {
                        obj[eachSyntaxRule!.stateToken].push(eachSyntaxRule!)
                    } else {
                        obj[eachSyntaxRule!.stateToken] = [eachSyntaxRule!]
                    }
                    return obj
                }, {} as Record<string, SyntaxRule[]>)
            this.components[utilityName] = Object
                .keys(syntaxRulesByStateToken)
                .map(stateToken => {
                    const syntaxRules = syntaxRulesByStateToken[stateToken]
                    return syntaxRules.length === 1
                        ? syntaxRules[0].name
                        : (
                            '{'
                            + syntaxRulesByStateToken[stateToken].map(eachSyntaxRule => eachSyntaxRule.name.slice(0, eachSyntaxRule.name.length - eachSyntaxRule.stateToken.length)).join(';')
                            + '}'
                            + stateToken
                        )
                })
        }
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
        if (Object.prototype.hasOwnProperty.call(this.components, className)) {
            syntaxRules = this.components[className].map((eachSyntax) => this.create(eachSyntax, className, mode)) as SyntaxRule[]
        } else {
            const atIndex = className.indexOf('@')
            if (atIndex !== -1) {
                const name = className.slice(0, atIndex)
                if (Object.prototype.hasOwnProperty.call(this.components, name)) {
                    const atToken = className.slice(atIndex)
                    syntaxRules = this.components[name].map((eachSyntax) => this.create(eachSyntax + atToken, className, mode)) as SyntaxRule[]
                } else {
                    syntaxRules = [this.create(className, undefined, mode)] as SyntaxRule[]
                }
            } else {
                syntaxRules = [this.create(className, undefined, mode)] as SyntaxRule[]
            }
        }
        return syntaxRules.filter(eachSyntax => eachSyntax?.text) as SyntaxRule[]
    }

    generateVendorSelectors(selectorText: string) {
        const vendorSelectors: Record<string, string[]> = {}
        const transformSelector = (selectorText: string, selectorValues: [RegExp, string[]][], selectors: string[], matched: boolean) => {
            for (const [regexp, newSelectorTexts] of selectorValues) {
                if (regexp.test(selectorText)) {
                    for (const eachNewSelectorText of newSelectorTexts) {
                        transformSelector(selectorText.replace(regexp, eachNewSelectorText), selectorValues, selectors, true)
                    }
                    return
                }
            }

            if (matched) {
                selectors.push(selectorText)
            }
        }
        const spacedSelectorToken = (selectorText: string) => {
            // 1. \'123\'
            // 2. [href='http://localhost']
            const transformedSelectorText =
                selectorText.split(/(\\'(?:.*?)[^\\]\\')(?=[*_>~+,)])|(\[[^=]+='(?:.*?)[^\\]'\])/)
                    .map((eachToken, i) => i % 3 ? eachToken : eachToken.replace(/(^|[^_])_(?!_)/g, '$1 '))
                    .join('')
            const selectors: string[] = []

            let currentSelector = ''
            let symbolCount = 0
            for (let i = 0; i < transformedSelectorText.length; i++) {
                const char = transformedSelectorText[i]
                if (char === '\\') {
                    currentSelector += char + transformedSelectorText[++i]
                    continue
                }
                if (!symbolCount && char === ',') {
                    selectors.push(currentSelector)
                    currentSelector = ''
                } else {
                    currentSelector += char

                    if (symbolCount && char === ')') {
                        symbolCount--
                    } else if (char === '(') {
                        symbolCount++
                    }
                }
            }
            if (currentSelector) {
                selectors.push(currentSelector)
            }

            return selectors
        }
        const transformedSelectors: string[] = []
        if ('' in this.selectors) {
            transformSelector(selectorText, this.selectors[''], transformedSelectors, true)
        } else {
            transformedSelectors.push(selectorText)
        }

        const unspacedVendorSelectors: Record<string, string[]> = {}
        for (const [vendor, selectorValues] of Object.entries(this.selectors)) {
            if (!vendor) continue
            const newUnspacedVendorSelectors: string | any[] = []
            for (const eachTransformedSelector of transformedSelectors) {
                transformSelector(eachTransformedSelector, selectorValues, newUnspacedVendorSelectors, false)
            }
            if (newUnspacedVendorSelectors.length) {
                unspacedVendorSelectors[vendor] = newUnspacedVendorSelectors
            }
        }

        const insertVendorSelectors = (vendor: string, selectorTexts: string[]) => {
            const groupedSelectorTexts = selectorTexts.reduce((arr: string[], eachSuffixSelector) => {
                arr.push(...spacedSelectorToken(eachSuffixSelector))
                return arr
            }, [])
            if (vendor in vendorSelectors) {
                vendorSelectors[vendor].push(...groupedSelectorTexts)
            } else {
                vendorSelectors[vendor] = groupedSelectorTexts
            }
        }

        const vendors = Object.keys(unspacedVendorSelectors)
        if (vendors.length) {
            for (const eachVendor of vendors) {
                insertVendorSelectors(eachVendor, unspacedVendorSelectors[eachVendor])
            }
        } else {
            insertVendorSelectors('', transformedSelectors)
        }

        return vendorSelectors
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
        for (let i = 0; i < selectorTextSplits.length; i++) {
            const eachField = selectorTextSplits[i]
            const modeSelector = this.getModeSelector(eachField)
            if (i === 0 && eachField === modeSelector) continue
            if (eachField[0] === '.') {
                const eachFieldName = eachField.slice(1)
                let className = ''
                for (let l = 0; l < eachFieldName.length; l++) {
                    const char = eachFieldName[l]
                    const nextChar = eachFieldName[l + 1]
                    if (char === '\\') {
                        l++
                        if (nextChar !== '\\') {
                            className += nextChar
                            continue
                        }
                    } else if (['.', '#', '[', '!', '*', '>', '+', '~', ':', ','].includes(char)) {
                        break
                    }
                    className += char
                }
                const syntaxRules = this.generate(className)
                if (syntaxRules.length) return syntaxRules
            }
        }
        return []
    }

    /**
     * 根據蒐集到的所有 DOM class 重新 create
     */
    refresh(customConfig?: Config) {
        this.reset()
        if (customConfig) {
            this.customConfig = customConfig
        } else {
            customConfig = this.customConfig
        }
        // @ts-ignore
        this.config = customConfig?.override
            ? extendConfig(customConfig)
            : extendConfig(defaultConfig, customConfig)
        this.resolve()
        /**
         * 拿當前所有的 classNames 按照最新的 colors, config.rules 匹配並生成新的 style
         * 所以 refresh 過後 rules 可能會變多也可能會變少
         */
        this.classUsages.forEach((_, className) => {
            this.add(className)
        })
        return this
    }

    reset() {
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
        this.classUsages.clear()
        masterCSSs.splice(masterCSSs.indexOf(this), 1)
        return this
    }

    add(...classNames: string[]) {
        for (const className of classNames) {
            this.generate(className)
                .forEach((eachSyntaxRule) => eachSyntaxRule.layer.insert(eachSyntaxRule))
        }
        return this
    }

    remove(...classNames: string[]) {
        /**
         * class name 從 DOM tree 中被移除，
         * 匹配並刪除對應的 rule
         */
        for (const className of classNames) {
            if (Object.prototype.hasOwnProperty.call(this.components, className)) {
                for (const eachSyntax of this.components[className]) {
                    this.componentsLayer.delete(className + ' ' + eachSyntax)
                }
            } else {
                const atIndex = className.indexOf('@')
                if (atIndex !== -1) {
                    const name = className.slice(0, atIndex)
                    if (Object.prototype.hasOwnProperty.call(this.components, name)) {
                        const atToken = className.slice(atIndex)
                        for (const eachSyntax of this.components[name]) {
                            this.componentsLayer.delete(eachSyntax + atToken + ' ' + className)
                        }
                    } else {
                        this.generalLayer.delete(className)
                    }
                } else {
                    this.generalLayer.delete(className)
                }
            }
        }
    }

    getModeSelector(modeName: string) {
        const mode = this.config.modes?.[modeName]
        if (mode) {
            switch (mode) {
                case 'class':
                    return '.' + modeName
                case 'host':
                    return ':host(.' + modeName + ')'
            }
        }
    }
}

export const masterCSSs: MasterCSS[] = []

export default interface MasterCSS {
    supportVendors: Set<Vendors>
    style: HTMLStyleElement | null
    components: Record<string, string[]>
    selectors: Record<string, [RegExp, string[]][]>
    variables: Record<string, Variable>
    at: Record<string, string | number>
    animations: Record<string, AnimationDefinitions>
}

(() => {
    globalThis.MasterCSS = MasterCSS
    globalThis.masterCSSs = masterCSSs
})()
