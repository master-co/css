import type { Values } from './config'
import type { MasterCSS } from './core'
import { START_SYMBOLS } from './constants/start-symbol'
import cssEscape from 'shared/utils/css-escape'
import { transformColorWithOpacity } from './functions/transform-color-with-opacity'
import { CSSDeclarations } from './types/css-declarations'
import { RuleConfig } from './config/rules'

const atRuleRegExp = /^(media|supports|page|font-face|keyframes|counter-style|font-feature-values|property|layer)(?=\||{|\(|$)/

export class Rule {

    readonly at: Record<string, string> = {}
    readonly priority: number = -1
    readonly natives: RuleNative[] = []
    readonly order: number = 0

    animationNames: string[]

    constructor(
        public readonly className: string,
        public readonly config: RuleConfig = {},
        public css: MasterCSS
    ) {
        const { unit, colored, _propName, _semantic, analyze, transform, native, declare, _declarations, create, order, match, id } = this.config
        this.order = order
        if (!this.config.unit) this.config.unit = ''
        if (!this.config.separators) this.config.separators = [',']
        const { scope, important, functions, themeDriver } = css.config
        const { themeNames, colorNames, colorThemesMap, selectors, viewports, mediaQueries, classesBy, globalValues, animations } = css
        const classNames = classesBy[className]

        if (create) create.call(this, className)

        // 1. value / selectorToken
        let declarations: CSSDeclarations
        let hasMultipleThemes: boolean
        let prefixToken: string
        let suffixToken: string
        let valueSplits: (string | { value: string, unit?: string })[]

        if (_semantic) {
            suffixToken = className.slice(id.length - 1)
            declarations = _declarations
        } else {
            let valueToken: string
            if (analyze) {
                [valueToken, prefixToken] = analyze.call(this, className)
            } else {
                const indexOfColon = className.indexOf(':')
                this.prefix = className.slice(0, indexOfColon + 1)
                valueToken = className.slice(indexOfColon + 1)
            }
            valueSplits = []

            // eslint-disable-next-line @typescript-eslint/no-this-alias
            const instance = this
            const values = this.values
            const separators = [',']
            if (this.config.separators.length) {
                separators.push(...this.config.separators)
            }
            let currentValueToken = ''
            let i = 0;

            (function analyze(
                valueToken: string,
                unit: string,
                endSymbol?: string,
                parentFunctionName = undefined,
                usedValues: string[] = [],
                usedGlobalValues: string[] = [],
                bypassAnalyzeUnitValue?: boolean
            ) {
                const root = parentFunctionName === undefined
                let lastPushIndex: number

                const checkIsString = (value: string) => value === '\'' || value === '"'
                const reloadLastPushIndex = () => lastPushIndex = currentValueToken.length
                const transformAndPushValueToken = () => {
                    if (currentValueToken) {
                        const originalCurrentValueToken = currentValueToken
                        const value = root
                            ? originalCurrentValueToken
                            : currentValueToken.slice(lastPushIndex)
                        currentValueToken = ''
                        functionName = ''

                        if (values && value in values && !usedValues.includes(value)) {
                            const originalIndex = i
                            i = 0
                            analyze(values[value].toString(), unit, undefined, parentFunctionName, [...usedValues, value], usedGlobalValues, bypassAnalyzeUnitValue)
                            i = originalIndex

                            if (!root) {
                                currentValueToken = currentValueToken.slice(0, lastPushIndex) + currentValueToken
                            }
                        } else if (globalValues && value in globalValues && !usedGlobalValues.includes(value)) {
                            const originalIndex = i
                            i = 0
                            analyze(globalValues[value].toString(), unit, undefined, parentFunctionName, usedValues, [...usedGlobalValues, value], bypassAnalyzeUnitValue)
                            i = originalIndex

                            if (!root) {
                                currentValueToken = currentValueToken.slice(0, lastPushIndex) + currentValueToken
                            }
                        } else if (root) {
                            const uv = !bypassAnalyzeUnitValue && instance.analyzeUnitValue(value, unit)
                            valueSplits.push({ value: uv?.value ?? value, unit: uv?.unit })
                        } else {
                            const uv = !bypassAnalyzeUnitValue && instance.analyzeUnitValue(value, unit)
                            currentValueToken = uv
                                ? originalCurrentValueToken.slice(0, lastPushIndex) + uv.value + uv.unit
                                : originalCurrentValueToken
                        }

                        reloadLastPushIndex()
                    }
                }

                const isString = checkIsString(endSymbol)
                reloadLastPushIndex()
                let functionName = ''

                for (; i < valueToken.length; i++) {
                    const val = valueToken[i]
                    if (val === endSymbol) {
                        if (isString) {
                            currentValueToken += val

                            let count = 0
                            for (let j = currentValueToken.length - 2; ; j--) {
                                if (currentValueToken[j] !== '\\') {
                                    break
                                }
                                count++
                            }
                            if (count % 2) {
                                continue
                            }
                        } else {
                            transformAndPushValueToken()

                            currentValueToken += val
                        }

                        return
                    } else if (!isString && val in START_SYMBOLS) {
                        const functionConfig = val === '(' && functionName && functions?.[functionName]
                        if (functionConfig?.name) {
                            currentValueToken = currentValueToken.slice(0, currentValueToken.length - functionName.length) + functionConfig.name
                            functionName = functionConfig.name
                        }

                        currentValueToken += val
                        i++

                        const nextEndSymbol = START_SYMBOLS[val]
                        analyze(valueToken,
                            functionConfig?.unit ?? unit,
                            nextEndSymbol,
                            functionName || parentFunctionName || '',
                            usedValues,
                            usedGlobalValues,
                            bypassAnalyzeUnitValue || !!functionConfig?.transform)

                        if (functionConfig?.transform) {
                            currentValueToken = currentValueToken.slice(0, lastPushIndex + functionName.length + 1)
                                + functionConfig.transform.call(instance, currentValueToken.slice(lastPushIndex + functionName.length + 1, -1))
                                + currentValueToken.slice(-1)
                        }

                        if (root) {
                            if (checkIsString(nextEndSymbol)) {
                                valueSplits.push(currentValueToken)
                                currentValueToken = ''
                            } else {
                                transformAndPushValueToken()
                            }
                        }

                        functionName = ''
                    } else if ((val === '|' || val === ' ') && endSymbol !== '}' && (!isString || parentFunctionName === 'path')) {
                        transformAndPushValueToken()

                        if (!root) {
                            currentValueToken += ' '
                            lastPushIndex++
                        }
                    } else {
                        if (!isString) {
                            if (val === '.') {
                                if (isNaN(+valueToken[i + 1])) {
                                    break
                                } else if (valueToken[i - 1] === '-') {
                                    currentValueToken += '0'
                                }
                            } else if (separators.includes(val)) {
                                transformAndPushValueToken()

                                if (root) {
                                    valueSplits.push(val)
                                } else {
                                    currentValueToken += val
                                    lastPushIndex++
                                }
                                continue
                            } else if (
                                root
                                && (val === '#'
                                    && (currentValueToken || valueSplits.length && (valueToken[i - 1] !== '|' && valueSplits[i - 1] !== ' '))
                                    || ['!', '*', '>', '+', '~', ':', '[', '@', '_'].includes(val))
                            ) {
                                break
                            }

                            functionName += val
                        }

                        currentValueToken += val
                    }
                }

                if (parentFunctionName === undefined) {
                    transformAndPushValueToken()
                }
            })(valueToken, unit)

            suffixToken = valueToken.slice(i)
        }

        // 2. !important
        if (suffixToken[0] === '!') {
            this.important = true
            suffixToken = suffixToken.slice(1)
        }

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
        const suffixTokens = suffixToken.split('@')
        const suffixSelector = suffixTokens[0]
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
        for (let i = 1; i < suffixTokens.length; i++) {
            const atToken = suffixTokens[i]
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
                                } else if (mediaQueries && typeOrFeatureToken in mediaQueries) {
                                    queryTexts.push(mediaQueries[typeOrFeatureToken])
                                } else {
                                    const feature: MediaFeatureRule = {
                                        token: typeOrFeatureToken
                                    }
                                    let featureName = ''
                                    let extremumOperator = ''
                                    let correction = 0
                                    if (typeOrFeatureToken.startsWith('<=')) {
                                        extremumOperator = '<='
                                        featureName = 'max-width'
                                    } else if (typeOrFeatureToken.startsWith('>=') || viewports[typeOrFeatureToken]) {
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
                                    const conditionUnitValueToken
                                        = extremumOperator
                                            ? typeOrFeatureToken.replace(extremumOperator, '')
                                            : typeOrFeatureToken
                                    const viewport = viewports[conditionUnitValueToken]
                                    switch (featureName) {
                                        case 'max-width':
                                        case 'min-width':
                                            if (viewport) {
                                                Object.assign(feature, this.analyzeUnitValue(viewport.toString(), 'px'))
                                            } else {
                                                Object.assign(feature, this.analyzeUnitValue(conditionUnitValueToken, 'px'))
                                            }
                                            if (feature.unit === 'px') {
                                                feature.value += correction
                                            }
                                            this.media.features[featureName] = feature
                                            queryTexts.push('(' + featureName + ':' + (feature.value + feature.unit) + ')')
                                            break
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
        const insertNewNative = (theme: string, bypassWhenUnmatchColor: boolean) => {
            let newValue: string

            const generateCssText = (
                propertiesText: string,
                theme: string,
                prefixSelectors: string[],
                suffixSelectors: string[]
            ) => {
                let prefixText = ''
                if (this.direction) {
                    prefixText += '[dir=' + this.direction + '] '
                }

                const prefixTexts = prefixSelectors.map(eachPrefixSelector => eachPrefixSelector + prefixText)
                const getCssText = (theme: string, name: string) =>
                    prefixTexts
                        .map(eachPrefixText => ((theme && themeDriver !== 'media')
                            ? themeDriver === 'host'
                                ? `:host(.${theme}) `
                                : `.${theme} `
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

                let cssText = getCssText(theme, className)
                    + (classNames
                        ? classNames.reduce((str, className) => str + ',' + getCssText(this.theme ?? ((colored || hasMultipleThemes) ? theme : ''), className), '')
                        : '')
                    + '{'
                    + propertiesText
                    + '}'

                for (const key of Object.keys(this.at).sort((a, b) => b === 'supports' ? -1 : 1)) {
                    cssText = '@' + key + (key.includes(' ') ? '' : ' ') + this.at[key] + '{' + cssText + '}'
                }

                if (theme && themeDriver === 'media') {
                    cssText = `@media(prefers-color-scheme:${theme}){` + cssText + '}'
                }
                return cssText
            }

            const newValueSplits: string[] = []

            if (valueSplits) {
                const themes = [this.theme ?? theme, '']
                let anyColorMatched: boolean = undefined
                let anyColorMismatched = false
                for (const eachValueToken of valueSplits) {
                    if (typeof eachValueToken === 'string') {
                        newValueSplits.push(eachValueToken)
                    } else {
                        let token = eachValueToken.value
                        if (eachValueToken.unit) {
                            token += eachValueToken.unit
                        } else if (colored && colorThemesMap && colorNames) {
                            let anyMatched = false

                            token = token.replace(
                                new RegExp(`(^|,| |\\()((?:${colorNames.join('|')})(?:-(?:[0-9A-Za-z-]+))?)(?:\\/(\\.?[0-9]+%?))?(?=(\\)|\\}|,| |$))`, 'gm'),
                                (origin, prefix, colorName, opacityStr) => {
                                    const themeColorMap = colorThemesMap[colorName]
                                    if (themeColorMap) {
                                        let color: string
                                        let appliedTheme: string
                                        for (const eachTheme of themes) {
                                            if ((color = themeColorMap[eachTheme])) {
                                                appliedTheme = eachTheme
                                                break
                                            }
                                        }

                                        if (color) {
                                            anyMatched = !bypassWhenUnmatchColor || appliedTheme === theme
                                            if (!anyColorMatched) {
                                                anyColorMatched = anyMatched
                                            }

                                            return prefix + (opacityStr
                                                ? transformColorWithOpacity(color, opacityStr)
                                                : color)
                                        } else {
                                            anyColorMismatched = true
                                        }
                                    }

                                    return origin
                                })
                        }
                        newValueSplits.push(token)
                    }
                }

                if (bypassWhenUnmatchColor && (anyColorMismatched || (anyColorMatched === undefined ? theme : !anyColorMatched)))
                    return

                newValue = newValueSplits.reduce((previousVal, currentVal, i) => previousVal + currentVal + ((currentVal === ',' || valueSplits[i + 1] === ',' || i === valueSplits.length - 1) ? '' : ' '), '')

                // 8. transform and convert
                if (transform) {
                    newValue = transform.call(this, newValue, this.css.config)
                }

                if (declare) {
                    let value: string
                    let unit: string
                    if (valueSplits.length === 1) {
                        const firstValueSplit = valueSplits[0]
                        if (typeof firstValueSplit === 'object') {
                            value = firstValueSplit.value
                            unit = firstValueSplit.unit
                        }
                    }
                    declarations = declare.call(this, unit ? value : newValue, unit || '')
                } else {
                    declarations = {
                        [_propName as string]: newValue
                    }
                }
            }

            const propertiesTextByTheme: Record<string, string[]> = {}
            for (const eachPropName in declarations) {
                const push = (theme: string, propertyText: string) => {
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

                    const newPropertyText = propertyText
                        + (((this.important || important) && !propertyText.endsWith('!important')) ? '!important' : '')

                    if (theme in propertiesTextByTheme) {
                        propertiesTextByTheme[theme].push(newPropertyText)
                    } else {
                        propertiesTextByTheme[theme] = [newPropertyText]
                    }
                }

                const prefix = eachPropName + ':'
                const declation = declarations[eachPropName]
                if (typeof declation === 'object') {
                    if (Array.isArray(declation)) {
                        for (const value of declation) {
                            push(theme, prefix + value.toString())
                        }
                    } else {
                        hasMultipleThemes = true

                        for (const theme in declation) {
                            push(theme, prefix + declation[theme])
                        }
                    }
                } else {
                    push(theme, prefix + declation.toString())
                }
            }

            // 創建 Natives
            for (const prefixSelectorVendor in suffixSelectorVendorsByPrefixSelectorVendor) {
                for (const eachSuffixSelectorVendor of suffixSelectorVendorsByPrefixSelectorVendor[prefixSelectorVendor]) {
                    for (const theme in propertiesTextByTheme) {
                        this.natives.push({
                            text: generateCssText(
                                propertiesTextByTheme[theme].join(';'),
                                theme,
                                this.vendorPrefixSelectors[prefixSelectorVendor],
                                this.vendorSuffixSelectors[eachSuffixSelectorVendor]
                            ),
                            theme
                        })
                    }
                }
            }
        }

        if (this.theme) {
            insertNewNative(this.theme, false)
        } else if (colored) {
            for (const eachThemeName of themeNames) {
                insertNewNative(eachThemeName, true)
            }
        } else {
            insertNewNative('', false)
        }
    }

    get values(): Record<string, string | number> {
        return this.css.values[this.config.id]
    }

    get text(): string {
        return this.natives.map((eachNative) => eachNative.text).join('')
    }

    resolveValue(value, unit) {
        return Number.isNaN(+value)
            ? value
            : ((value as any) / (unit === 'rem' || unit === 'em' ? this.css.config.rootSize : 1))
            + unit
    }

    analyzeUnitValue(token: string, unit?: string): { value: string, unit: string } {
        const defaultUnit = unit ?? this.config.unit
        if (defaultUnit) {
            let newUnit = ''

            const matches = token.match(/^([+-.]?\d+(\.?\d+)?)(.*)?/)
            // ['0.5deg', '0.5', 'deg', index: 0, input: '0.5deg', groups: undefined]
            if (matches) {
                if (token.includes('/')) {
                    // w:1/2 -> width: 50%
                    const [dividend, divisor] = token.split('/')
                    return { value: (+dividend / +divisor) * 100 + '%', unit: newUnit }
                } else {
                    let value: any = +matches[1]
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
                    return { value, unit: newUnit }
                }
            }
        }
    }
}

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
    constructor: {
        match?(
            name: string,
            matches: RegExp,
            colorThemesMap: Record<string, Record<string, string>>,
            colorNames: string[]
        ): RuleMeta
    }
}

export interface RuleNative {
    text: string
    theme: string
    cssRule?: CSSRule
}

export interface MediaFeatureRule {
    token: string;
    tokenType?: string;
    operator?: string;
    value?: number;
    unit?: string;
}

export interface MediaQuery {
    token: string;
    features?: {
        [key: string]: MediaFeatureRule
    }
    type?: string;
}

export interface RuleMeta {
    value?: [string, string | Record<string, string>]
    config?: RuleConfig
}