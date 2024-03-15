/* eslint-disable @typescript-eslint/no-unsafe-declaration-merging */
import MasterCSS, { type Variable } from './core'
import { START_SYMBOLS } from './constants/start-symbol'
import cssEscape from 'css-shared/utils/css-escape'
import { Layer } from './layer'
import { type PropertiesHyphen } from 'csstype'
import { BASE_UNIT_REGEX } from './constants/base-unit-regex'

export class Rule {
    readonly at: Record<string, AtComponent[]> = {}
    readonly priority: number = -1
    readonly natives: NativeRule[] = []
    readonly order: number = 0
    readonly layer: Layer = 0
    readonly atToken: string = ''
    readonly stateToken: string
    readonly declarations?: PropertiesHyphen

    animationNames?: string[]
    variableNames?: string[]

    constructor(
        public readonly className: string,
        RegisteredRule: RegisteredRule,
        public css: MasterCSS
    ) {
        Object.assign(this, RegisteredRule)
        const { id, definition } = RegisteredRule
        const { analyze, transformValue, declare, transformValueComponents, create, layer, unit, colored } = definition
        this.layer = layer as Layer
        this.colored = !!colored
        if (!definition.unit) definition.unit = ''
        if (!definition.separators) definition.separators = [',']
        const { scope, important, modeDriver } = css.config
        const { selectors, queries, stylesBy, animations } = css
        const classNames = stylesBy[className]

        if (create) create.call(this, className)

        // 1. value / selectorToken
        this.declarations = definition.declarations
        let stateToken: string
        let prefixToken: string | undefined

        if (layer === Layer.Semantic) {
            // TODO: id 使用其他方式傳遞
            stateToken = className.slice(id.length - 1)
        } else {
            let valueToken: string
            if (analyze) {
                [valueToken, prefixToken] = analyze.call(this, className)
            } else {
                const indexOfColon = className.indexOf(':')
                this.prefix = className.slice(0, indexOfColon + 1)
                valueToken = className.slice(indexOfColon + 1)
            }
            this.valueComponents = []
            stateToken = valueToken.slice(this.parseValue(this.valueComponents, 0, valueToken, unit, '', undefined, false, (id === 'animation' || id === 'animation-name') ? Object.keys(this.css.animations) : []))
        }

        // 2. !important
        if (stateToken[0] === '!') {
            this.important = true
            stateToken = stateToken.slice(1)
        }

        this.stateToken = stateToken

        // 3. prefix selector
        const generateVendorSelectors = (selectorText: string, vendorSelectors: Record<string, string[]>) => {
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
            if ('' in selectors) {
                transformSelector(selectorText, selectors[''], transformedSelectors, true)
            } else {
                transformedSelectors.push(selectorText)
            }

            const unspacedVendorSelectors: Record<string, string[]> = {}
            for (const [vendor, selectorValues] of Object.entries(selectors)) {
                if (!vendor)
                    continue

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
        }

        if (prefixToken) {
            this.vendorPrefixSelectors = {}
            generateVendorSelectors(prefixToken, this.vendorPrefixSelectors)
        } else {
            this.vendorPrefixSelectors = { '': [''] }
        }

        // 4. suffix selector
        const stateTokens = stateToken.split('@')
        const suffixSelector = stateTokens[0]
        if (suffixSelector) {
            this.vendorSuffixSelectors = {}

            generateVendorSelectors(suffixSelector, this.vendorSuffixSelectors)

            for (const suffixSelectors of Object.values(this.vendorSuffixSelectors)) {
                for (const eachSuffixSelector of suffixSelectors) {
                    if (this.hasWhere !== false) {
                        this.hasWhere = eachSuffixSelector.includes(':where(')
                    }
                    const SORTED_SELECTORS = [':disabled', ':active', ':focus', ':hover']
                    for (let i = 0; i < SORTED_SELECTORS.length; i++) {
                        if (eachSuffixSelector.includes(SORTED_SELECTORS[i])) {
                            if (this.priority === -1 || this.priority > i) {
                                this.priority = i
                            }
                            break
                        }
                    }
                }
            }
        } else {
            this.vendorSuffixSelectors = { '': [''] }
        }

        // selector combinations
        const suffixSelectorVendorsByPrefixSelectorVendor: Record<string, string[]> = {}
        const isPrefixSelectorWithoutVendor = Object.prototype.hasOwnProperty.call(this.vendorPrefixSelectors, '')
        const isSuffixSelectorWithoutVendor = Object.prototype.hasOwnProperty.call(this.vendorSuffixSelectors, '')
        if (isPrefixSelectorWithoutVendor) {
            suffixSelectorVendorsByPrefixSelectorVendor[''] = isSuffixSelectorWithoutVendor
                ? ['']
                : Object.keys(this.vendorSuffixSelectors)
        } else {
            if (isSuffixSelectorWithoutVendor) {
                for (const vendor in this.vendorPrefixSelectors) {
                    suffixSelectorVendorsByPrefixSelectorVendor[vendor] = ['']
                }
            } else {
                for (const prefixSelectorVendor in this.vendorPrefixSelectors) {
                    const suffixSelectorVendors: string[] = suffixSelectorVendorsByPrefixSelectorVendor[prefixSelectorVendor] = []
                    if (Object.prototype.hasOwnProperty.call(this.vendorSuffixSelectors, prefixSelectorVendor)) {
                        suffixSelectorVendors.push(prefixSelectorVendor)
                    } else {
                        for (const suffixVendor in this.vendorSuffixSelectors) {
                            suffixSelectorVendors.push(suffixVendor)
                        }
                    }
                }
            }
        }

        // 5. atTokens
        for (let i = 1; i < stateTokens.length; i++) {
            const atToken = stateTokens[i]
            if (atToken) {
                this.atToken += '@' + atToken
                if (atToken === 'rtl' || atToken === 'ltr') {
                    this.direction = atToken
                } else {
                    let queryType: string | undefined
                    const atComponents: AtComponent[] = []
                    // x font-face, counter-style, keyframes, font-feature-values, property, layer
                    const queryTypeRegExp = /^(media|supports|container)/
                    const atRuleResult = queryTypeRegExp.exec(atToken)
                    if (atRuleResult) {
                        queryType = atRuleResult[1]
                        atComponents.push({
                            type: 'arbitrary',
                            token: atToken,
                            value: atToken
                                .slice(queryType.length)
                                .replace(/\|/g, ' ')
                        })
                    } else {
                        const analyzeToken = (atComponentToken: string) => {
                            if (
                                atComponentToken === 'all'
                                || atComponentToken === 'print'
                                || atComponentToken === 'screen'
                                || atComponentToken === 'speech'
                            ) {
                                queryType = 'media'
                                atComponents.push({ type: 'media-type', token: atComponentToken, value: atComponentToken })
                            } else if (atComponentToken === '&') {
                                atComponents.push({ type: 'operator', token: atComponentToken, value: 'and' })
                            } else if (atComponentToken.startsWith('')) {
                                const targetQuery = queries[atComponentToken]
                                if (targetQuery && typeof targetQuery === 'string') {
                                    const match = targetQuery.match(queryTypeRegExp)
                                    queryType = match ? match[1] : ''
                                    if (!queryType) throw new Error(`Invalid query '${atComponentToken}': '${targetQuery}'`)
                                    atComponents.push({
                                        type: 'arbitrary',
                                        value: targetQuery.slice(match ? match[1].length + 1 : 0)
                                    })
                                } else {
                                    // todo: container queries
                                    queryType = 'media'
                                    let featureName = ''
                                    let extremumOperator = ''
                                    let correction = 0
                                    if (atComponentToken.startsWith('<=')) {
                                        extremumOperator = '<='
                                        featureName = 'max-width'
                                    } else if (atComponentToken.startsWith('>=') || targetQuery) {
                                        extremumOperator = '>='
                                        featureName = 'min-width'
                                    } else if (atComponentToken.startsWith('>')) {
                                        extremumOperator = '>'
                                        featureName = 'min-width'
                                        correction = .02
                                    } else if (atComponentToken.startsWith('<')) {
                                        extremumOperator = '<'
                                        featureName = 'max-width'
                                        correction = -.02
                                    }
                                    const token
                                        = extremumOperator
                                            ? atComponentToken.replace(extremumOperator, '')
                                            : atComponentToken
                                    const viewport = queries[token]
                                    switch (featureName) {
                                        case 'max-width':
                                        case 'min-width':
                                            // eslint-disable-next-line no-case-declarations
                                            if (typeof viewport === 'number') {
                                                atComponents.push({
                                                    type: 'feature',
                                                    name: featureName,
                                                    valueType: 'number',
                                                    value: viewport + correction,
                                                    unit: 'px'
                                                })
                                            } else {
                                                const valueComponent = this.parseValueComponent(token, 'px')
                                                if (valueComponent.type === 'number') {
                                                    atComponents.push({
                                                        type: 'feature',
                                                        name: featureName,
                                                        valueType: 'number',
                                                        value: valueComponent.value + correction,
                                                        unit: valueComponent.unit
                                                    })
                                                } else {
                                                    atComponents.push({
                                                        type: 'feature',
                                                        name: featureName,
                                                        valueType: 'string',
                                                        value: token
                                                    })
                                                }
                                            }
                                            break
                                    }
                                }
                            }
                        }

                        const isAmpersandIncluded = atToken.includes('&')
                        if (isAmpersandIncluded) {
                            const typeOrFeatureTokens = atToken.split(/(&|,)/)
                            for (const atComponentToken of typeOrFeatureTokens) {
                                analyzeToken(atComponentToken)
                            }
                        } else {
                            analyzeToken(atToken)
                        }
                        if (!atComponents.length) {
                            if (!isAmpersandIncluded) {
                                this.mode = atToken
                                continue
                            } else {
                                // container queries
                            }
                        }
                    }

                    if (queryType) {
                        this.at[queryType] = atComponents
                    }
                }
            }
        }

        // 7. value
        let newValue: string
        if (this.valueComponents) {
            if (transformValueComponents) {
                this.valueComponents = transformValueComponents.call(this, this.valueComponents)
            }
            newValue = this.resolveValue(this.valueComponents, unit, [], false)
            if (transformValue) {
                newValue = transformValue.call(this, newValue)
            }
            if (declare) {
                this.declarations = declare.call(this, newValue, this.valueComponents)
            } else if (id) {
                this.declarations = {
                    [id]: newValue
                }
            }
        }

        const propertiesText: string[] = []
        for (const propertyName in this.declarations) {
            const push = (propertyText: string) => {
                // animations
                if (
                    animations
                    && (propertyText.startsWith('animation') || propertyText.startsWith('animation-name'))
                ) {
                    const animationNames = propertyText
                        .split(':')[1]
                        .split('!important')[0]
                        .split(' ')
                        .filter(eachValue => eachValue in this.css.animations && (!this.animationNames || !this.animationNames.includes(eachValue)))
                    if (animationNames.length) {
                        if (!this.animationNames) {
                            this.animationNames = []
                        }
                        this.animationNames = animationNames
                    }
                }

                propertiesText.push(
                    propertyText + (((this.important || important) && !propertyText.endsWith('!important')) ? '!important' : '')
                )
            }

            const prefix = propertyName + ':'
            const declarations = this.declarations[propertyName as keyof PropertiesHyphen] as any
            if (Array.isArray(declarations)) {
                for (const value of declarations) {
                    push(prefix + String(value))
                }
            } else {
                push(prefix + String(declarations))
            }
        }

        // 創建 Natives
        if (propertiesText.length) {
            for (const prefixSelectorVendor in suffixSelectorVendorsByPrefixSelectorVendor) {
                for (const eachSuffixSelectorVendor of suffixSelectorVendorsByPrefixSelectorVendor[prefixSelectorVendor]) {
                    let prefixText = ''
                    if (this.direction) {
                        prefixText += '[dir=' + this.direction + '] '
                    }

                    const prefixSelectors = this.vendorPrefixSelectors[prefixSelectorVendor]
                    const suffixSelectors = this.vendorSuffixSelectors[eachSuffixSelectorVendor]
                    const prefixTexts = prefixSelectors.map(eachPrefixSelector => eachPrefixSelector + prefixText)
                    const getCssText = (name: string) =>
                        prefixTexts
                            .map(eachPrefixText => ((this.mode && modeDriver !== 'media')
                                ? modeDriver === 'host'
                                    ? `:host(.${this.mode}) `
                                    : `.${this.mode} `
                                : '')
                                + (scope ? scope + ' ' : '')
                                + eachPrefixText)
                            .reduce((arr: string[], eachPrefixText) => {
                                arr.push(
                                    suffixSelectors
                                        .reduce((_arr: string[], eachSuffixSelector) => {
                                            _arr.push(eachPrefixText + '.' + cssEscape(name) + eachSuffixSelector)
                                            return _arr
                                        }, [])
                                        .join(',')
                                )
                                return arr
                            }, [])
                            .join(',')

                    let cssText = getCssText(className)
                        + (classNames
                            ? classNames.reduce((str: string, className: string) => str + ',' + getCssText(className), '')
                            : '')
                        + '{'
                        + propertiesText.join(';')
                        + '}'

                    for (const key of Object.keys(this.at).sort((_a, b) => b === 'supports' ? -1 : 1)) {
                        cssText = '@' + key + (key.includes(' ') ? '' : ' ')
                            + this.at[key]
                                .map((eachAtComponent) => this.resolveAtComponent(eachAtComponent))
                                .join(' ')
                            + '{' + cssText + '}'
                    }

                    if (this.mode && modeDriver === 'media') {
                        cssText = `@media(prefers-color-scheme:${this.mode}){` + cssText + '}'
                    }

                    this.natives.push({ text: cssText })
                }
            }
        }
    }

    resolveAtComponent(atComponent: AtComponent) {
        switch (atComponent.type) {
            case 'arbitrary':
                return atComponent.value
            case 'media-type':
                return atComponent.value
            case 'feature':
                return '(' + atComponent.name + ':' + atComponent.value + (atComponent.unit || '') + ')'
            case 'operator':
                return atComponent.value
        }
    }

    resolveValue = (valueComponents: ValueComponent[], unit: string, bypassVariableNames: string[], bypassParsing: boolean) => {
        const { functions } = this.css.config

        let currentValue = ''
        for (const eachValueComponent of valueComponents) {
            switch (eachValueComponent.type) {
                case 'function':
                    // eslint-disable-next-line no-case-declarations
                    const functionDefinition = functions && functions[eachValueComponent.name]
                    if (functionDefinition?.transform && !eachValueComponent.bypassTransform) {
                        const result = functionDefinition.transform.call(
                            this,
                            this.resolveValue(
                                eachValueComponent.children,
                                functionDefinition.unit ?? unit,
                                bypassVariableNames,
                                bypassParsing || eachValueComponent.name === 'calc'
                            ),
                            bypassVariableNames
                        )
                        currentValue += eachValueComponent.text = typeof result === 'string'
                            ? result
                            : this.resolveValue(result, functionDefinition?.unit ?? unit, bypassVariableNames, bypassParsing)
                    } else {
                        currentValue += eachValueComponent.text = eachValueComponent.name
                            + eachValueComponent.symbol
                            + this.resolveValue(eachValueComponent.children, functionDefinition?.unit ?? unit, bypassVariableNames, bypassParsing)
                            + START_SYMBOLS[eachValueComponent.symbol as keyof typeof START_SYMBOLS]
                    }
                    break
                // todo: 應挪到 parseValue 階段處理才能支援 variables: { x: 'calc(20vw-30px)' } 這種情況，並且解析上可能會比較合理、精簡
                case 'variable':
                    // eslint-disable-next-line no-case-declarations
                    const variable = this.css.variables[eachValueComponent.name]
                    if (variable) {
                        const handleVariable = (
                            normalHandler: (variable: MasterCSS['variables'][0]) => void,
                            varHandler: () => void
                        ) => {
                            if (variable.modes) {
                                if (this.mode) {
                                    const themeVariable = variable.modes[this.mode] ?? variable
                                    if (themeVariable?.value) {
                                        normalHandler(themeVariable as any)
                                    }
                                } else {
                                    if (!this.variableNames) {
                                        this.variableNames = []
                                    }
                                    if (!this.variableNames.includes(eachValueComponent.name)) {
                                        this.variableNames.push(eachValueComponent.name)
                                    }
                                    varHandler()
                                }
                            } else {
                                normalHandler(variable)
                            }
                        }
                        switch (variable.type) {
                            case 'string':
                                handleVariable(
                                    (variable) => {
                                        const valueComponents: ValueComponent[] = []
                                        this.parseValue(valueComponents, 0, variable.value as string, unit, '', undefined, bypassParsing, [...bypassVariableNames, eachValueComponent.name])
                                        currentValue += eachValueComponent.text = this.resolveValue(
                                            valueComponents,
                                            unit,
                                            [...bypassVariableNames, eachValueComponent.name],
                                            bypassParsing
                                        )
                                    },
                                    () => {
                                        currentValue += eachValueComponent.text = `var(--${eachValueComponent.name})`
                                    }
                                )
                                break
                            case 'number':
                                handleVariable(
                                    (variable) => {
                                        if (bypassParsing) {
                                            currentValue += eachValueComponent.text = variable.value
                                        } else {
                                            const valueComponent = this.parseValueComponent(variable.value, unit) as NumericValueComponent
                                            currentValue += eachValueComponent.text = valueComponent.value + (valueComponent.unit ?? '')
                                        }
                                    },
                                    () => {
                                        currentValue += eachValueComponent.text = unit
                                            ? `calc(var(--${eachValueComponent.name}) / 16 * 1rem)`
                                            : `var(--${eachValueComponent.name})`
                                    }
                                )
                                break
                            case 'color':
                                // eslint-disable-next-line no-case-declarations
                                const alpha = eachValueComponent.alpha ? '/' + eachValueComponent.alpha : ''
                                handleVariable(
                                    (variable) => {
                                        currentValue += eachValueComponent.text = `${variable['space']}(${variable.value}${alpha})`
                                    },
                                    () => {
                                        currentValue += eachValueComponent.text = `${variable.space}(var(--${eachValueComponent.name})${alpha})`
                                    }
                                )
                                break
                        }
                    } else {
                        currentValue += eachValueComponent.text = `var(--${eachValueComponent.name}${(eachValueComponent.fallback ? ',' + eachValueComponent.fallback : '')})`
                    }
                    break
                case 'separator':
                    currentValue += eachValueComponent.text ? eachValueComponent.text : (eachValueComponent.text = eachValueComponent.value)
                    break
                case 'number':
                    currentValue += eachValueComponent.text = eachValueComponent.value + (eachValueComponent.unit || '')
                    break
                default:
                    currentValue += eachValueComponent.text = eachValueComponent.value
                    break
            }
        }
        return currentValue
    }

    get text(): string {
        return this.natives.map((eachNative) => eachNative.text).join('')
    }

    parseValue = (
        currentValueComponents: ValueComponent[],
        i: number,
        value: string,
        unit: string,
        endSymbol: string,
        parentFunctionName?: string,
        bypassParsing = false,
        bypassVariableNames: string[] = []
    ) => {
        const root = parentFunctionName === undefined
        const isVarFunction = !root
            && (
                parentFunctionName.endsWith('$')
                || parentFunctionName.endsWith('var')
            )
        const checkIsString = (value: string) => value === '\'' || value === '"'
        const isString = checkIsString(endSymbol)
        const separators = [',']
        if (this.definition.separators?.length) {
            separators.push(...this.definition.separators)
        }

        let currentValue = ''
        const parse = () => {
            if (currentValue) {
                let handled = false
                if (!isVarFunction || currentValueComponents.length) {
                    const handleVariable = (variableName: string, alpha?: string) => {
                        const variable = Object.prototype.hasOwnProperty.call(this.variables, variableName)
                            ? this.variables[variableName]
                            : Object.prototype.hasOwnProperty.call(this.css.variables, variableName)
                                ? this.css.variables[variableName]
                                : undefined
                        if (variable) {
                            const name = variable.name ?? variableName
                            if (!bypassVariableNames.includes(name)) {
                                handled = true
                                const valueComponent: VariableValueComponent = { type: 'variable', name, variable: this.css.variables[name] }
                                if (alpha) valueComponent.alpha = alpha
                                currentValueComponents.push(valueComponent)
                            }
                        }
                    }
                    handleVariable(currentValue)
                    if (!handled && this.colored) {
                        const [colorName, alpha] = currentValue.split('/')
                        handleVariable(colorName, alpha)
                    }
                }

                if (!handled) {
                    if (!isVarFunction) {
                        const result = BASE_UNIT_REGEX.exec(currentValue)
                        if (result) {
                            currentValue = String(+result[1] * (this.css.config.baseUnit ?? 1))
                        }
                    }
                    if (bypassParsing) {
                        currentValueComponents.push({ type: 'string', value: currentValue })
                    } else {
                        currentValueComponents.push(this.parseValueComponent(currentValue, unit))
                    }
                }

                currentValue = ''
            }
        }

        for (; i < value.length; i++) {
            const val = value[i]
            if (val === endSymbol) {
                if (isString) {
                    let count = 0
                    for (let j = currentValue.length - 1; ; j--) {
                        if (currentValue[j] !== '\\')
                            break

                        count++
                    }
                    if (count % 2) {
                        currentValue += val
                        continue
                    } else {
                        parse()
                    }
                } else {
                    parse()
                }

                return i
            } else if (!isString && val in START_SYMBOLS) {
                const functionName = currentValue
                const newValueComponent: ValueComponent[][0] = { type: 'function', name: functionName, symbol: val, children: [] }
                currentValueComponents.push(newValueComponent)
                currentValue = ''

                const functionDefinition = val === '(' ? this.css.config.functions?.[functionName] : undefined
                if (!this.colored && functionDefinition?.colored) {
                    // @ts-ignore
                    this.colored = true
                }

                i = this.parseValue(
                    newValueComponent.children,
                    ++i,
                    value,
                    functionDefinition?.unit ?? unit,
                    START_SYMBOLS[val as keyof typeof START_SYMBOLS],
                    functionName || parentFunctionName || '',
                    bypassParsing || functionName === 'calc'
                )
            } else if ((val === '|' || val === ' ') && endSymbol !== '}' && (!isString || parentFunctionName === 'path')) {
                parse()
                currentValueComponents.push({ type: 'separator', value: ' ' })
            } else {
                if (!isString) {
                    if (val === '.') {
                        if (isNaN(+value[i + 1])) {
                            if (root)
                                break
                        } else if (value[i - 1] === '-') {
                            currentValue += '0'
                        }
                    } else if (separators.includes(val)) {
                        parse()
                        currentValueComponents.push({
                            type: 'separator',
                            value: val,
                            text: (val === ',' ? '' : ' ') + val + (val === ',' ? '' : ' ')
                        })
                        continue
                    } else if (
                        root
                        && (
                            val === '#' && (currentValue || currentValueComponents.length && currentValueComponents[currentValueComponents.length - 1]['type'] !== 'separator')
                            || ['!', '*', '>', '+', '~', ':', '[', '@', '_'].includes(val)
                        )
                    ) {
                        break
                    }
                }
                currentValue += val
            }
        }
        parse()
        return i
    }

    parseValueComponent(token: string | number, unit = this.definition.unit): StringValueComponent | NumericValueComponent {
        const defaultUnit = unit ?? this.definition.unit
        let newUnit = ''
        let value: any
        if (typeof token === 'number') {
            /**
             * 當無單位值且 defaultUnit === 'rem'，
             * 將 pxValue / 16 轉為 remValue
             */
            if (defaultUnit && !newUnit) {
                if (defaultUnit === 'rem' || defaultUnit === 'em') {
                    value = token / (this.css.config.rootSize || 1)
                }
                newUnit = defaultUnit || ''
            } else {
                value = token
            }
            return { value, unit: newUnit, type: 'number' }
        } else if (defaultUnit) {
            // w:1/2 -> width: 50%
            if (/^\d+\/\d+/.test(token)) {
                const [dividend, divisor] = token.split('/')
                return { value: (+dividend / +divisor) * 100, unit: '%', type: 'number' }
            }
            const matches = token.match(/^([+-.]?\d+(\.?\d+)?)(%|cm|mm|q|in|pt|pc|px|em|rem|ex|rex|cap|rcap|ch|rch|ic|ric|lh|rlh|vw|svw|lvw|dvw|vh|svh|lvh|dvh|vi|svi|lvi|dvi|vb|svb|lvb|dvb|vmin|svmin|lvmin|dvmin|vmax|svmax|lvmax|dvmax|cqw|cqh|cqi|cqb|cqmin|cqmax|deg|grad|rad|turn|s|ms|hz|khz|dpi|dpcm|dppx|x|fr|db|st)?$/)
            // ['0.5deg', '0.5', 'deg', index: 0, input: '0.5deg', groups: undefined]
            if (matches) {
                value = +matches[1]
                newUnit = matches[3] || ''
                /**
                 * 當無單位值且 defaultUnit === 'rem'，
                 * 將 pxValue / 16 轉為 remValue
                 */
                if (!newUnit) {
                    if (defaultUnit === 'rem' || defaultUnit === 'em') {
                        value = value / (this.css.config.rootSize || 1)
                    }
                    newUnit = defaultUnit || ''
                }
                return { value, unit: newUnit, type: 'number' }
            }
        }
        return { value: token, type: 'string' }
    }
}

export type AtComponent =
    AtArbitraryComponent |
    AtMediaTypeComponent |
    AtFeatureComponent |
    AtOperatorComponent

export interface AtArbitraryComponent { type: 'arbitrary', token?: string, value: string }
export interface AtMediaTypeComponent { type: 'media-type', token?: string, value: 'all' | 'print' | 'screen' | 'speech' }
export interface AtFeatureComponent { type: 'feature', token?: string, name: string, valueType: 'number' | 'string', value: string | number, unit?: string }
export interface AtOperatorComponent { type: 'operator', token: '&', value: 'and' } // future: 'or'

export type ValueComponent =
    StringValueComponent |
    NumericValueComponent |
    FunctionValueComponent |
    VariableValueComponent |
    SeparatorValueComponent

export interface StringValueComponent { text?: string, token?: string, type: 'string', value: string }
export interface NumericValueComponent { text?: string, token?: string, type: 'number', value: number, unit?: string }
export interface FunctionValueComponent { text?: string, token?: string, type: 'function', name: string, symbol: string, children: ValueComponent[], bypassTransform?: boolean }
export interface VariableValueComponent { text?: string, token?: string, type: 'variable', name: string, alpha?: string, fallback?: string, variable?: Variable }
export interface SeparatorValueComponent { text?: string, type: 'separator', value: string }

export interface Rule extends RegisteredRule {
    colored: boolean
    prefix: string
    token: string
    vendorPrefixSelectors: Record<string, string[]>
    vendorSuffixSelectors: Record<string, string[]>
    important: boolean
    direction: string
    mode: string
    unitToken: string
    hasWhere: boolean
    valueComponents: Array<ValueComponent>
}

export interface RegisteredRule {
    id: string
    match?: RegExp
    variables?: any
    order: number
    definition: RuleDefinition
}

export interface RuleDefinition {
    layer?: Layer
    match?: RegExp | [string, string[]?]
    variables?: string[]
    separators?: string[]
    shorthand?: string
    colored?: boolean
    numeric?: boolean
    unit?: any
    native?: boolean
    declarations?: PropertiesHyphen
    analyze?: (this: Rule, className: string) => [valueToken: string, prefixToken?: string]
    transformValue?(this: Rule, value: string): string
    transformValueComponents?(this: Rule, valueComponents: ValueComponent[]): ValueComponent[]
    declare?(this: Rule, value: string, valueComponents: ValueComponent[]): PropertiesHyphen
    delete?(this: Rule, className: string): void
    create?(this: Rule, className: string): void
    insert?(this: Rule): void
}

export interface NativeRule {
    text: string
    cssRule?: CSSRule
}

export type MediaFeatureComponent = {
    type: string
    tokenType?: string
    operator?: string
    value: number
    unit: string
}

export interface MediaQuery {
    token: string;
    features: {
        [key: string]: MediaFeatureComponent
    }
    type?: string;
}