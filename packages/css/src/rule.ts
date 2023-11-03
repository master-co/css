import type { MasterCSS } from './core'
import { START_SYMBOLS } from './constants/start-symbol'
import cssEscape from 'css-shared/utils/css-escape'
import { CSSDeclarations } from './types/css-declarations'
import { CoreLayer, Layer } from './layer'

const atRuleRegExp = /^(media|supports|page|font-face|keyframes|counter-style|font-feature-values|property|layer)(?=\||{|\(|$)/

export class Rule {

    readonly at: Record<string, string> = {}
    readonly priority: number = -1
    readonly natives: NativeRule[] = []
    readonly order: number = 0
    readonly stateToken: string
    readonly declarations: CSSDeclarations
    readonly colored: boolean = false

    animationNames: string[]
    variableNames: string[]

    constructor(
        public readonly className: string,
        public readonly options: RuleOptions = {},
        public css: MasterCSS
    ) {
        const { layer, unit, colored: configColored, resolvedPropName, analyze, transform, declare, create, order, id } = options
        this.order = order
        if (!options.unit) options.unit = ''
        if (!options.separators) options.separators = [',']
        const { scope, important, themeDriver } = css.config
        const { selectors, mediaQueries, stylesBy, animations } = css
        const classNames = stylesBy[className]

        if (create) create.call(this, className)

        // 1. value / selectorToken
        this.declarations = options.declarations
        let stateToken: string
        let prefixToken: string
        this.colored = configColored

        if (layer === CoreLayer.Semantic) {
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
            stateToken = valueToken.slice(this.parseValue(this.valueComponents, 0, valueToken, unit))
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

                const newUnspacedVendorSelectors = []
                for (const eachTransformedSelector of transformedSelectors) {
                    transformSelector(eachTransformedSelector, selectorValues, newUnspacedVendorSelectors, false)
                }

                if (newUnspacedVendorSelectors.length) {
                    unspacedVendorSelectors[vendor] = newUnspacedVendorSelectors
                }
            }

            const insertVendorSelectors = (vendor: string, selectorTexts: string[]) => {
                const groupedSelectorTexts = selectorTexts.reduce((arr, eachSuffixSelector) => {
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
                    const suffixSelectorVendors = suffixSelectorVendorsByPrefixSelectorVendor[prefixSelectorVendor] = []
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
                if (
                    atToken === 'rtl'
                    || atToken === 'ltr'
                ) {
                    this.direction = atToken
                } else {
                    let type: string
                    let queryText: string

                    const atRuleResult = atRuleRegExp.exec(atToken)
                    if (atRuleResult) {
                        type = atRuleResult[1]
                        queryText = atToken.slice(type.length)
                    } else {
                        this.media = {
                            token: atToken,
                            features: {}
                        }
                        const queryTexts = []

                        const analyzeToken = (typeOrFeatureToken: string) => {
                            if (
                                typeOrFeatureToken === 'all'
                                || typeOrFeatureToken === 'print'
                                || typeOrFeatureToken === 'screen'
                                || typeOrFeatureToken === 'speech'
                            ) {
                                this.media.type = typeOrFeatureToken
                            } else if (typeOrFeatureToken === '🖨') {
                                this.media.type = 'print'
                            } else {
                                if (typeOrFeatureToken === 'landscape' || typeOrFeatureToken === 'portrait') {
                                    queryTexts.push('(orientation:' + typeOrFeatureToken + ')')
                                } else if (typeOrFeatureToken === 'motion' || typeOrFeatureToken === 'reduced-motion') {
                                    queryTexts.push('(prefers-reduced-motion:'
                                        + (typeOrFeatureToken === 'motion' ? 'no-preference' : 'reduce')
                                        + ')')
                                } else {
                                    const targetMediaQuery = mediaQueries[typeOrFeatureToken]
                                    if (targetMediaQuery && typeof targetMediaQuery === 'string') {
                                        queryTexts.push(targetMediaQuery)
                                    } else {
                                        let featureName = ''
                                        let extremumOperator = ''
                                        let correction = 0
                                        if (typeOrFeatureToken.startsWith('<=')) {
                                            extremumOperator = '<='
                                            featureName = 'max-width'
                                        } else if (typeOrFeatureToken.startsWith('>=') || targetMediaQuery) {
                                            extremumOperator = '>='
                                            featureName = 'min-width'
                                        } else if (typeOrFeatureToken.startsWith('>')) {
                                            extremumOperator = '>'
                                            featureName = 'min-width'
                                            correction = .02
                                        } else if (typeOrFeatureToken.startsWith('<')) {
                                            extremumOperator = '<'
                                            featureName = 'max-width'
                                            correction = -.02
                                        }
                                        const token
                                            = extremumOperator
                                                ? typeOrFeatureToken.replace(extremumOperator, '')
                                                : typeOrFeatureToken
                                        const viewport = mediaQueries[token]
                                        switch (featureName) {
                                            case 'max-width':
                                            case 'min-width':
                                                // eslint-disable-next-line no-case-declarations
                                                let featureComponent: MediaFeatureComponent = {} as any
                                                if (typeof viewport === 'number') {
                                                    featureComponent = {
                                                        type: 'number',
                                                        value: viewport + correction,
                                                        unit: 'px'
                                                    }
                                                } else {
                                                    featureComponent = this.parseValueComponent(token, 'px') as MediaFeatureComponent
                                                    if (featureComponent.type === 'number' && featureComponent.unit === 'px') {
                                                        featureComponent.value += correction
                                                    }
                                                }
                                                this.media.features[featureName] = featureComponent
                                                if (featureComponent.type === 'number') {
                                                    queryTexts.push('(' + featureName + ':' + (featureComponent.value + featureComponent.unit) + ')')
                                                } else {
                                                    queryTexts.push('(' + featureName + ':' + featureComponent.value + ')')
                                                }
                                                break
                                        }
                                    }
                                }
                            }
                        }

                        const isAmpersandIncluded = atToken.includes('&')
                        if (isAmpersandIncluded) {
                            const typeOrFeatureTokens = atToken.split('&')
                            for (const typeOrFeatureToken of typeOrFeatureTokens) {
                                analyzeToken(typeOrFeatureToken)
                            }
                        } else {
                            analyzeToken(atToken)
                        }

                        if (this.media.type) {
                            queryText = this.media.type
                        }
                        if (queryTexts.length) {
                            queryText = queryTexts.join(' and ')
                        }
                        if (!queryText) {
                            if (!isAmpersandIncluded) {
                                this.theme = atToken
                                continue
                            }
                        } else {
                            type = 'media'
                        }
                    }

                    if (queryText) {
                        this.at[type] = (type in this.at
                            ? this.at[type] + ' and '
                            : '')
                            + queryText.replace(/\|/g, ' ')
                    }
                }
            }
        }

        // 7. value
        let newValue: string
        if (this.valueComponents) {
            newValue = this.transformValueComponents(this.valueComponents, unit, [])
            // 8. transform and convert
            if (transform) {
                newValue = transform.call(this, newValue, this.css.config)
            }

            if (declare) {
                let value: string
                let unit: string
                this.declarations = declare.call(this, unit ? value : newValue, unit || '')
            } else if (resolvedPropName) {
                this.declarations = {
                    [resolvedPropName as string]: newValue
                }
            }
        }

        const propertiesText = []
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
                        this.animationNames.push(...animationNames)
                    }
                }

                propertiesText.push(
                    propertyText + (((this.important || important) && !propertyText.endsWith('!important')) ? '!important' : '')
                )
            }

            const prefix = propertyName + ':'
            const declation = this.declarations[propertyName]
            if (typeof declation === 'object') {
                for (const value of declation) {
                    push(prefix + value.toString())
                }
            } else {
                push(prefix + declation.toString())
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
                            .map(eachPrefixText => ((this.theme && themeDriver !== 'media')
                                ? themeDriver === 'host'
                                    ? `:host(.${this.theme}) `
                                    : `.${this.theme} `
                                : '')
                                + (scope ? scope + ' ' : '')
                                + eachPrefixText)
                            .reduce((arr, eachPrefixText) => {
                                arr.push(
                                    suffixSelectors
                                        .reduce((_arr, eachSuffixSelector) => {
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
                            ? classNames.reduce((str, className) => str + ',' + getCssText(className), '')
                            : '')
                        + '{'
                        + propertiesText.join(';')
                        + '}'

                    for (const key of Object.keys(this.at).sort((a, b) => b === 'supports' ? -1 : 1)) {
                        cssText = '@' + key + (key.includes(' ') ? '' : ' ') + this.at[key] + '{' + cssText + '}'
                    }

                    if (this.theme && themeDriver === 'media') {
                        cssText = `@media(prefers-color-scheme:${this.theme}){` + cssText + '}'
                    }


                    this.natives.push({ text: cssText })
                }
            }
        }
    }

    transformValueComponents = (valueComponents: ValueComponent[], unit: string, bypassVariableNames: string[]) => {
        const { functions } = this.css.config

        let currentValue = ''
        for (const eachValueComponent of valueComponents) {
            switch (eachValueComponent.type) {
                case 'function':
                    // eslint-disable-next-line no-case-declarations
                    const functionConfig = functions && functions[eachValueComponent.name]
                    if (functionConfig?.transform) {
                        const result = functionConfig.transform.call(
                            this,
                            this.transformValueComponents(
                                eachValueComponent.childrens,
                                functionConfig.unit ?? unit,
                                bypassVariableNames
                            ),
                            bypassVariableNames
                        )
                        currentValue += typeof result === 'string'
                            ? result
                            : this.transformValueComponents(result, functionConfig?.unit ?? unit, bypassVariableNames)
                    } else {
                        currentValue += eachValueComponent.name
                            + eachValueComponent.symbol
                            + this.transformValueComponents(eachValueComponent.childrens, functionConfig?.unit ?? unit, bypassVariableNames)
                            + START_SYMBOLS[eachValueComponent.symbol]
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
                            if (variable.themes) {
                                if (this.theme) {
                                    const themeVariable = variable.themes[this.theme] ?? variable
                                    if (themeVariable?.value) {
                                        normalHandler(themeVariable)
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
                                        this.parseValue(valueComponents, 0, variable.value as string, unit, undefined, undefined, [...bypassVariableNames, eachValueComponent.name])
                                        currentValue += this.transformValueComponents(
                                            valueComponents,
                                            unit,
                                            [...bypassVariableNames, eachValueComponent.name]
                                        )
                                    },
                                    () => {
                                        currentValue += `var(--${eachValueComponent.name})`
                                    }
                                )
                                break
                            case 'number':
                                handleVariable(
                                    (variable) => {
                                        const valueComponent = this.parseValueComponent(variable.value, unit) as NumericValueComponent
                                        currentValue += valueComponent.value + (valueComponent.unit ?? '')
                                    },
                                    () => {
                                        currentValue += unit
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
                                        currentValue += `${variable['space']}(${variable.value}${alpha})`
                                    },
                                    () => {
                                        currentValue += `${variable.space}(var(--${eachValueComponent.name})${alpha})`
                                    }
                                )
                                break
                        }
                    } else {
                        currentValue += 'var(--' + eachValueComponent.name + ')'
                    }
                    break
                case 'separator':
                    currentValue += (eachValueComponent.prefix || '') + eachValueComponent.value + (eachValueComponent.suffix || '')
                    break
                case 'number':
                    currentValue += eachValueComponent.value + eachValueComponent.unit
                    break
                default:
                    currentValue += eachValueComponent.value
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
        endSymbol?: string,
        parentFunctionName = undefined,
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
        if (this.options.separators.length) {
            separators.push(...this.options.separators)
        }

        let currentValue = ''
        const parse = () => {
            if (currentValue) {
                let handled = false
                if (!isVarFunction) {
                    const handleVariable = (variableName: string, alpha?: string) => {
                        const variable = Object.prototype.hasOwnProperty.call(this.options.resolvedVariables, variableName)
                            ? this.options.resolvedVariables[variableName]
                            : Object.prototype.hasOwnProperty.call(this.css.variables, variableName)
                                ? this.css.variables[variableName]
                                : undefined
                        if (variable) {
                            const name = variable.name ?? variableName
                            if (!bypassVariableNames.includes(name)) {
                                handled = true

                                currentValueComponents.push({ type: 'variable', name: name, alpha })
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
                    currentValueComponents.push(this.parseValueComponent(currentValue, unit))
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
                const newValueComponent: ValueComponent[][0] = { type: 'function', name: functionName, symbol: val, childrens: [] }
                currentValueComponents.push(newValueComponent)
                currentValue = ''

                const functionConfig = val === '(' && this.css.config.functions?.[functionName]
                if (!this.colored && functionConfig?.colored) {
                    // @ts-ignore
                    this.colored = true
                }

                i = this.parseValue(
                    newValueComponent.childrens,
                    ++i,
                    value,
                    functionConfig?.unit ?? unit,
                    START_SYMBOLS[val],
                    functionName || parentFunctionName || ''
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
                            prefix: val === ',' ? '' : ' ',
                            suffix: val === ',' ? '' : ' '
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

    resolveValue(value, unit) {
        return Number.isNaN(+value)
            ? value
            : ((value as any) / (unit === 'rem' || unit === 'em' ? this.css.config.rootSize : 1))
            + unit
    }

    parseValueComponent(token: string | number, unit = this.options.unit): StringValueComponent | NumericValueComponent {
        const defaultUnit = unit ?? this.options.unit
        let newUnit = ''
        let value: any
        if (typeof token === 'number') {
            /**
             * 當無單位值且 defaultUnit === 'rem'，
             * 將 pxValue / 16 轉為 remValue
             */
            if (defaultUnit && !newUnit) {
                if (defaultUnit === 'rem' || defaultUnit === 'em') {
                    value = token / this.css.config.rootSize
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
                        value = value / this.css.config.rootSize
                    }
                    newUnit = defaultUnit || ''
                }
                return { value, unit: newUnit, type: 'number' }
            }
        }
        return { value: token, type: 'string' }
    }
}

export type ValueComponent =
    StringValueComponent |
    NumericValueComponent |
    FunctionValueComponent |
    VariableValueComponent |
    SeparatorValueComponent

export interface StringValueComponent { token?: string, type: 'string', value: string }
export interface NumericValueComponent { token?: string, type: 'number', value: number, unit?: string }
export interface FunctionValueComponent { token?: string, type: 'function', name: string, symbol: string, childrens: ValueComponent[] }
export interface VariableValueComponent { token?: string, type: 'variable', name: string, alpha?: string }
export interface SeparatorValueComponent { type: 'separator', value: string, prefix?: string, suffix?: string }

export interface Rule {
    prefix?: string
    token?: string
    vendorPrefixSelectors?: Record<string, string[]>
    vendorSuffixSelectors?: Record<string, string[]>
    important?: boolean
    media?: MediaQuery
    direction?: string
    theme?: string
    unitToken?: string
    hasWhere?: boolean
    valueComponents?: Array<ValueComponent>
    constructor: {
        match?(
            name: string,
            matches: RegExp,
            colors: Record<string, Record<string, string>>,
            colorNames: string[]
        ): RuleMeta
    }
}

export interface RuleOptions {
    id?: string
    match?: RegExp | [string, string[]?]
    resolvedMatch?: RegExp
    resolvedVariables?: any
    variableGroups?: string[]
    order?: number
    separators?: string[]
    shorthand?: string
    colored?: boolean
    numeric?: boolean
    unit?: any
    native?: boolean
    declarations?: CSSDeclarations
    resolvedPropName?: string
    layer?: Layer | CoreLayer,
    analyze?: (this: Rule, className: string) => [valueToken: string, prefixToken?: string]
    transform?(this: Rule, value: string): string
    transformValueComponents?(this: Rule, valueComponents: ValueComponent[]): ValueComponent[]
    declare?(this: Rule, value: string, unit: string): CSSDeclarations
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
    features?: {
        [key: string]: MediaFeatureComponent
    }
    type?: string;
}

export interface RuleMeta {
    value?: [string, string | Record<string, string>]
    config?: RuleOptions
}