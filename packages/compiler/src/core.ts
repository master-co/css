import {
    createCSSDirectiveSourceReference,
    createCSSDirectiveAtRuleReference,
    CSSDirectiveError,
    type CSSDirectiveAnimationDefinitions,
    type CSSDirectiveConfig,
    type CSSDirectiveDeclarations,
    type CSSDirectiveLayerName,
    type CSSDirectiveResult,
    type CSSDirectiveSourceReference,
    type CSSDirectiveStyleDefinition,
    type CSSDirectiveVariableValue
} from 'shared/css-directives'
import type {
    CustomAtRules,
    Declaration,
    DeclarationBlock,
    KeyframeSelector,
    Rule,
    Selector,
    Token,
    TokenOrValue
} from 'lightningcss'
import { decodeCSS, encodeCSS, getCSSTransform, setCSSTransform, type CSSTransform } from './css-transform'
import {
    collectCSSDirectiveRanges,
    collectMasterCSSClassListTokenRanges,
    createSourceLocationResolver,
    findCSSStatementEnd,
    type CSSDirectiveRuleRange
} from '@master/css-lexer'
import {
    collectStandaloneCSSDirectiveExtractionPolicy,
    createCSSDirectiveExtractionPolicy,
    findStandaloneCSSDirectiveStatements,
    findStandaloneMasterDirectiveStatements,
    mergeCSSDirectiveExtractionPolicy,
    removeStandaloneCSSDirectives,
    removeStandaloneMasterDirectives,
    type StandaloneCSSDirectiveStatement,
    type StandaloneMasterDirectiveStatement
} from './lexer/standalone-master'
import unquote from './utils/unquote'

export {
    collectStandaloneCSSDirectiveExtractionPolicy,
    createCSSDirectiveExtractionPolicy,
    findStandaloneCSSDirectiveStatements,
    findStandaloneMasterDirectiveStatements,
    mergeCSSDirectiveExtractionPolicy,
    removeStandaloneCSSDirectives,
    removeStandaloneMasterDirectives,
    setCSSTransform
}
export type { CSSTransform, StandaloneCSSDirectiveStatement, StandaloneMasterDirectiveStatement }

export interface CompileCSSOptions {
    config?: unknown
    classes?: string[]
    from?: string
    preserveNativeCSS?: boolean
    onWarning?: (warning: string) => void
}

export interface CompileCSSFileOptions extends CompileCSSOptions {
    root?: string
}

export type CompileCSSResult = CSSDirectiveResult

export interface ResolvedCSSImportGraph {
    source: string
    dependencies: string[]
}

type ParsedStyleDefinition = CSSDirectiveStyleDefinition

export interface ParsedDirectives extends Pick<CompileCSSResult, 'config' | 'extractionPolicy' | 'classNames' | 'nativeClassNames' | 'warnings'> {
    styleDefinitions?: ParsedStyleDefinition[]
    styleOrder?: number
    source?: string
    filename?: string
    composeRanges?: CSSDirectiveRuleRange[]
    composeRangeIndex?: number
    sourceLocationResolver?: ReturnType<typeof createSourceLocationResolver>
}

const MASTER_CUSTOM_AT_RULES = {
    master: {
        prelude: '*',
        body: 'style-block'
    },
    settings: {
        prelude: '*',
        body: 'style-block'
    },
    theme: {
        prelude: '*',
        body: 'style-block'
    },
    'custom-at': {
        prelude: '*',
        body: null
    },
    'custom-selector': {
        prelude: '*',
        body: null
    },
    at: {
        prelude: '*',
        body: 'style-block'
    },
    mode: {
        prelude: '*',
        body: 'style-block'
    },
    compose: {
        prelude: '<string>',
        body: null
    }
} satisfies CustomAtRules

type SettingsSection = 'root'

const UTILITY_LAYER_NAMES = new Set<CSSDirectiveLayerName>(['base', 'preset', 'components', 'utilities'])
const TOP_LEVEL_DEFINITION_LAYER_NAMES = new Set<CSSDirectiveLayerName>(['preset', 'components', 'utilities'])

function createSourceReference(parsed: ParsedDirectives, range: { start: number, end: number }): CSSDirectiveSourceReference {
    return createCSSDirectiveSourceReference(parsed.filename, {
        start: range.start,
        end: range.end
    }, parsed.source)
}

function trimSourceRangeEnd(source: string, start: number, end: number) {
    while (end > start && /\s/.test(source[end - 1] || '')) end--
    return end
}

function createSelectorSourceReference(parsed: ParsedDirectives, rule: any): CSSDirectiveSourceReference | undefined {
    const source = parsed.source
    const loc = rule.value?.loc
    const resolveLocation = parsed.sourceLocationResolver
    if (!source || !loc || !resolveLocation) return
    const start = resolveLocation({
        line: loc.line,
        column: loc.column
    })
    if (start === -1) return
    const statementEnd = findCSSStatementEnd(source, start)
    if (statementEnd.reason !== 'block') return
    return createSourceReference(parsed, {
        start,
        end: trimSourceRangeEnd(source, start, statementEnd.end)
    })
}

function parseOnOff(value: string) {
    if (value === 'on') return true
    if (value === 'off') return false
}

function parseDefaultMode(value: string): CSSDirectiveConfig['defaultMode'] {
    if (value === 'false') throw new Error('default-mode must be a mode name or none')
    return value
}

function parseNumber(value: string) {
    const numberValue = Number(value)
    if (!Number.isNaN(numberValue) && String(numberValue) === value) return numberValue
}

function parseList(value: string) {
    return value.split(',').flatMap((part) => part.trim().split(/\s+/)).filter(Boolean)
}

function parseVariableValue(value: string): CSSDirectiveVariableValue {
    const trimmed = value.trim()
    const numberValue = parseNumber(trimmed)
    return numberValue === undefined ? trimmed : numberValue
}

function addThemeMode(config: CSSDirectiveConfig, mode: string) {
    config.modes ??= []
    if (!config.modes.includes(mode)) config.modes.push(mode)
}

function defineThemeVariable(config: CSSDirectiveConfig, property: string, rawValue: string, mode?: string) {
    const name = property.replace(/^--/, '')
    const value = parseVariableValue(rawValue)
    if (mode) {
        addThemeMode(config, mode)
    }
    config.variables ??= []
    const definition = {
        name,
        value,
        ...(mode ? { mode } : {})
    }
    const foundIndex = config.variables.findIndex((existing) =>
        existing.name === definition.name
        && existing.mode === definition.mode
    )
    if (foundIndex !== -1) {
        config.variables.splice(foundIndex, 1)
    }
    config.variables.push(definition)
}

function parseMasterOption(config: CSSDirectiveConfig, property: string, value: string) {
    switch (property) {
        case 'root-size': {
            const rootSize = parseNumber(value)
            if (rootSize === undefined) throw new Error('root-size must be a number')
            config.rootSize = rootSize
            return true
        }
        case 'base-unit': {
            const baseUnit = parseNumber(value)
            if (baseUnit === undefined) throw new Error('base-unit must be a number')
            config.baseUnit = baseUnit
            return true
        }
        case 'default-mode':
            config.defaultMode = parseDefaultMode(value)
            return true
        case 'mode-trigger':
            if (value !== 'class' && value !== 'media' && value !== 'host') {
                throw new Error('mode-trigger must be class, media, or host')
            }
            config.modeTrigger = value
            return true
        case 'important': {
            const important = parseOnOff(value)
            if (important === undefined) throw new Error('important must be on or off')
            config.important = important
            return true
        }
        case 'modes':
            for (const mode of parseList(value)) {
                addThemeMode(config, mode)
            }
            return true
        case 'scope':
            config.scope = value
            return true
        default:
            return false
    }
}

function formatDeclaration(declaration: Declaration): string {
    const result = getCSSTransform()({
        filename: 'master-css-declaration.css',
        code: encodeCSS('.x{}'),
        visitor: {
            Rule: {
                style(rule) {
                    rule.value.declarations.declarations = [declaration]
                    return rule
                }
            }
        }
    })
    const output = decodeCSS(result.code)

    const bodyStart = output.indexOf('{')
    const bodyEnd = output.lastIndexOf('}')
    const body = output.slice(bodyStart + 1, bodyEnd).trim()
    return body.replace(/;$/, '').trim()
}

function formatSelectors(selectors: Selector[]) {
    const result = getCSSTransform()({
        filename: 'master-css-selector.css',
        code: encodeCSS('.x{color:red}'),
        minify: true,
        visitor: {
            Rule: {
                style(rule) {
                    rule.value.selectors = selectors
                    return rule
                }
            }
        }
    })
    const output = decodeCSS(result.code)

    return output.slice(0, output.indexOf('{')).trim()
}

function collectSelectorClassNames(value: unknown, classNames = new Set<string>()) {
    if (!value || typeof value !== 'object') return classNames
    if (Array.isArray(value)) {
        for (const item of value) {
            collectSelectorClassNames(item, classNames)
        }
        return classNames
    }

    const node = value as Record<string, unknown>
    if (node.type === 'class' && typeof node.name === 'string') {
        classNames.add(node.name)
    }
    for (const key of Object.keys(node)) {
        collectSelectorClassNames(node[key], classNames)
    }
    return classNames
}

function getSelectorClassNames(selector: Selector) {
    return [...collectSelectorClassNames(selector)]
}

function recordNativeClassNames(parsed: ParsedDirectives, classNames: string[]) {
    for (const className of classNames) {
        if (!parsed.nativeClassNames.includes(className)) {
            parsed.nativeClassNames.push(className)
        }
    }
}

function getNativeStyleSelectorFilters(rule: any, parsed: ParsedDirectives, classFilter?: Set<string>) {
    const selectors = rule.value.selectors as Selector[]
    if (!selectors?.length) return

    const selectorEntries = selectors.map((selector) => ({
        selector,
        classNames: getSelectorClassNames(selector)
    }))
    recordNativeClassNames(parsed, selectorEntries.flatMap((entry) => entry.classNames))

    if (!classFilter) return

    const selectorFilters = selectorEntries
        .map(({ classNames }) => !classNames.length || classNames.some((className) => classFilter.has(className)))

    if (selectorFilters.every(Boolean)) return
    return selectorFilters
}

function removeEmptyRuleBlock(rule: any) {
    return rule.value?.rules?.length ? undefined : []
}

function pruneEmptyRuleBlocks(code: Uint8Array, filename: string) {
    return getCSSTransform()({
        filename,
        code,
        visitor: {
            Rule: {
                media: removeEmptyRuleBlock,
                supports: removeEmptyRuleBlock,
                container: removeEmptyRuleBlock,
                'starting-style': removeEmptyRuleBlock,
                'layer-block': removeEmptyRuleBlock
            }
        }
    }).code
}

function filterNativeCSS(code: Uint8Array, filename: string, parsed: ParsedDirectives, classFilter?: Set<string>) {
    const selectorFilters: boolean[] = []
    return getCSSTransform()({
        filename,
        code,
        visitor: {
            Rule: {
                style(rule) {
                    const filters = getNativeStyleSelectorFilters(rule, parsed, classFilter)
                    if (!filters) return
                    if (!filters.some(Boolean)) return []
                    selectorFilters.push(...filters)
                }
            },
            Selector() {
                if (!selectorFilters.length) return
                if (!selectorFilters.shift()) return []
            }
        }
    }).code
}

function formatDeclarationValue(declaration: Declaration) {
    if (declaration.property === 'unparsed') {
        return formatTokenOrValues(declaration.value.value)
    }
    const formatted = formatDeclarationValueOverride(declaration)
    if (formatted !== undefined) return formatted
    let declarationText: string
    try {
        declarationText = formatDeclaration(declaration)
    } catch (error) {
        const fallback = formatDeclarationValueFallback(declaration)
        if (fallback !== undefined) return fallback
        throw error
    }
    const colonIndex = declarationText.indexOf(':')
    return declarationText.slice(colonIndex + 1).trim()
}

function formatNumber(value: number) {
    return String(value).replace(/^(-?)0\./, '$1.')
}

function formatDeclarationValueOverride(declaration: Declaration): string | undefined {
    if (declaration.property !== 'aspect-ratio') return
    const value = declaration.value as any
    if (!Array.isArray(value.ratio)) return
    const ratio = `${formatNumber(value.ratio[0])}/${formatNumber(value.ratio[1])}`
    return value.auto ? `auto ${ratio}` : ratio
}

function formatDimensionNumber(value: number) {
    if (Number.isInteger(value) && Math.abs(value) >= 1_000_000_000) {
        return value.toExponential().replace('e+', 'e')
    }
    return formatNumber(value)
}

function formatDimensionValue(value: any): string | undefined {
    if (value?.type !== 'dimension') return
    return `${formatDimensionNumber(value.value.value)}${value.value.unit}`
}

function formatBorderRadiusCorner(value: any): string | undefined {
    if (!Array.isArray(value) || value.length !== 2) return
    const horizontal = formatDimensionValue(value[0])
    const vertical = formatDimensionValue(value[1])
    if (!horizontal || !vertical) return
    return horizontal === vertical ? horizontal : `${horizontal} ${vertical}`
}

function formatDeclarationValueFallback(declaration: Declaration): string | undefined {
    if (declaration.property !== 'border-radius') return
    const value = declaration.value as any
    const corners = [
        value.topLeft,
        value.topRight,
        value.bottomRight,
        value.bottomLeft
    ].map(formatBorderRadiusCorner)
    const firstCorner = corners[0]
    if (!firstCorner || corners.some((corner) => corner !== firstCorner)) return
    return firstCorner
}

function formatPropertyId(propertyId: { property?: string }) {
    return propertyId.property || ''
}

function formatVariableName(name: { ident: string }) {
    return name.ident
}

function formatVariable(value: { name: { ident: string }, fallback?: TokenOrValue[] | null }) {
    const name = formatVariableName(value.name)
    const fallback = value.fallback && formatTokenOrValues(value.fallback)
    return fallback ? `var(${name}, ${fallback})` : `var(${name})`
}

function formatEnvironmentVariable(value: { name: { type?: string, value?: string, ident?: string }, fallback?: TokenOrValue[] | null }) {
    const name = value.name.ident || value.name.value || ''
    const fallback = value.fallback && formatTokenOrValues(value.fallback)
    return fallback ? `env(${name}, ${fallback})` : `env(${name})`
}

function formatToken(token: Token): string {
    switch (token.type) {
        case 'ident':
            return token.value
        case 'at-keyword':
            return '@' + token.value
        case 'hash':
        case 'id-hash':
            return '#' + token.value
        case 'string':
            return JSON.stringify(token.value)
        case 'unquoted-url':
            return `url(${token.value})`
        case 'number':
            return String(token.value)
        case 'percentage':
            return `${token.value * 100}%`
        case 'dimension':
            return `${token.value}${token.unit}`
        case 'white-space':
            return token.value
        case 'comment':
            return `/*${token.value}*/`
        case 'colon':
            return ':'
        case 'semicolon':
            return ';'
        case 'comma':
            return ','
        case 'delim':
            return token.value
        case 'function':
            return `${token.value}(`
        case 'parenthesis-block':
            return '('
        case 'square-bracket-block':
            return '['
        case 'curly-bracket-block':
            return '{'
        case 'close-parenthesis':
            return ')'
        case 'close-square-bracket':
            return ']'
        case 'close-curly-bracket':
            return '}'
        default:
            return ''
    }
}

function formatTokenOrValue(value: TokenOrValue): string {
    if (value.type === 'token') return formatToken(value.value)
    if (value.type === 'dashed-ident') return value.value
    if (value.type === 'length') return `${formatNumber(value.value.value)}${value.value.unit}`
    if (value.type === 'angle') return `${formatNumber(value.value.value)}${value.value.type}`
    if (value.type === 'time') return value.value.type === 'seconds'
        ? `${formatNumber(value.value.value)}s`
        : `${formatNumber(value.value.value)}ms`
    if (value.type === 'resolution') return `${formatNumber(value.value.value)}${value.value.type}`
    if (value.type === 'var') return formatVariable(value.value)
    if (value.type === 'env') return formatEnvironmentVariable(value.value)
    if (value.type === 'function') return `${value.value.name}(${formatTokenOrValues(value.value.arguments)})`
    if (value.type === 'url') return `url(${JSON.stringify(value.value.url)})`
    if (value.type === 'animation-name') {
        if (value.value.type === 'none') return 'none'
        if (value.value.type === 'string') return JSON.stringify(value.value.value)
        return value.value.value
    }
    const declaration = {
        property: 'custom',
        value: {
            name: '--x',
            value: [value]
        }
    } satisfies Declaration
    return formatDeclarationValue(declaration)
}

function formatTokenOrValues(values: TokenOrValue[]) {
    return values.map(formatTokenOrValue).join('').trim()
}

function formatPrelude(prelude: any) {
    if (!prelude) return ''
    if (typeof prelude === 'string') return prelude.trim()
    if (Array.isArray(prelude)) return formatTokenOrValues(prelude)
    if (prelude.type === 'token-list') return formatTokenOrValues(prelude.value)
    if (Array.isArray(prelude.value)) return formatTokenOrValues(prelude.value)
    if (typeof prelude.value === 'string') return prelude.value.trim()
    return ''
}

const COMPARISON_OPERATORS: Record<string, string> = {
    'equal': '=',
    'greater-than': '>',
    'greater-than-equal': '>=',
    'less-than': '<',
    'less-than-equal': '<='
}

function formatFeatureValue(value: any): string {
    if (value === undefined || value === null) return ''
    if (typeof value === 'string' || typeof value === 'number') return String(value)
    switch (value.type) {
        case 'ident':
            return value.value
        case 'number':
            return String(value.value)
        case 'length': {
            let resolvedValue = value.value
            while (
                resolvedValue
                && typeof resolvedValue === 'object'
                && 'value' in resolvedValue
                && !('unit' in resolvedValue)
            ) {
                resolvedValue = resolvedValue.value
            }
            if (typeof resolvedValue === 'number') return formatNumber(resolvedValue)
            return `${formatNumber(resolvedValue.value)}${resolvedValue.unit || ''}`
        }
        case 'ratio':
            return `${value.value.numerator}/${value.value.denominator}`
        default:
            return formatPrelude(value) || String(value.value ?? '')
    }
}

function formatCondition(condition: any): string {
    if (!condition) return ''
    switch (condition.type) {
        case 'feature': {
            const feature = condition.value
            switch (feature.type) {
                case 'plain':
                    return `(${feature.name}:${formatFeatureValue(feature.value)})`
                case 'range':
                    return `(${feature.name}${COMPARISON_OPERATORS[feature.operator] || feature.operator}${formatFeatureValue(feature.value)})`
                case 'boolean':
                    return `(${feature.name})`
                case 'interval':
                    return `(${formatFeatureValue(feature.start)}${COMPARISON_OPERATORS[feature.startOperator] || feature.startOperator}${feature.name}${COMPARISON_OPERATORS[feature.endOperator] || feature.endOperator}${formatFeatureValue(feature.end)})`
                default:
                    return ''
            }
        }
        case 'operation':
            return condition.conditions.map(formatCondition).filter(Boolean).join(` ${condition.operator} `)
        case 'not':
            return `not ${formatCondition(condition.value)}`
        default:
            return ''
    }
}

function formatMediaQuery(query: any): string {
    return query.mediaQueries
        .map((mediaQuery: any) => {
            const parts: string[] = []
            if (mediaQuery.qualifier) parts.push(mediaQuery.qualifier)
            if (mediaQuery.mediaType && mediaQuery.mediaType !== 'all') parts.push(mediaQuery.mediaType)
            const condition = formatCondition(mediaQuery.condition)
            if (condition) {
                if (parts.length) {
                    parts.push('and', condition)
                } else {
                    parts.push(condition)
                }
            }
            return parts.join(' ') || 'all'
        })
        .join(', ')
}

function formatSupportsCondition(condition: any): string {
    switch (condition.type) {
        case 'declaration':
            return `(${formatPropertyId(condition.propertyId)}:${formatFeatureValue(condition.value)})`
        case 'selector':
            return `selector(${condition.value})`
        case 'not':
            return `not ${formatSupportsCondition(condition.value)}`
        case 'and':
        case 'or':
            return condition.value.map(formatSupportsCondition).join(` ${condition.type} `)
        default:
            return ''
    }
}

function formatNestedAtRule(rule: any) {
    switch (rule.type) {
        case 'media':
            return `@media ${formatMediaQuery(rule.value.query)}`
        case 'supports':
            return `@supports ${formatSupportsCondition(rule.value.condition)}`
        case 'container': {
            const condition = formatCondition(rule.value.condition)
            return `@container ${[rule.value.name, condition].filter(Boolean).join(' ')}`
        }
        case 'starting-style':
            return '@starting-style'
        case 'layer-block':
            return `@layer ${(rule.value.name || []).join('.')}`
    }
}

function getNestedAtRuleChildren(rule: any) {
    if (rule.type === 'media' || rule.type === 'supports' || rule.type === 'container' || rule.type === 'starting-style' || rule.type === 'layer-block') {
        return rule.value.rules as Rule[]
    }
}

function getParsedStyleDefinitions(parsed: ParsedDirectives) {
    parsed.styleDefinitions ??= []
    return parsed.styleDefinitions
}

function nextStyleOrder(parsed: ParsedDirectives) {
    parsed.styleOrder = (parsed.styleOrder || 0) + 1
    return parsed.styleOrder
}

function getDeclarationName(declaration: Declaration) {
    if (declaration.property === 'custom') return declaration.value.name
    if (declaration.property === 'unparsed') return formatPropertyId(declaration.value.propertyId)
    return declaration.property
}

function collectDeclarations(block: DeclarationBlock<Declaration>) {
    const declarations: Record<string, string> = {}
    for (const declaration of block.declarations || []) {
        declarations[getDeclarationName(declaration)] = formatDeclarationValue(declaration)
    }
    for (const declaration of block.importantDeclarations || []) {
        declarations[getDeclarationName(declaration)] = `${formatDeclarationValue(declaration)} !important`
    }
    return declarations
}

function parseSettingsDeclarations(block: DeclarationBlock<Declaration>, config: CSSDirectiveConfig) {
    for (const declaration of (block.declarations || []) as Declaration[]) {
        const property = getDeclarationName(declaration)
        const value = formatDeclarationValue(declaration)
        if (!parseMasterOption(config, property, value)) {
            throw new Error(`Unsupported @settings option: ${property}`)
        }
    }
    for (const declaration of (block.importantDeclarations || []) as Declaration[]) {
        const property = getDeclarationName(declaration)
        throw new Error(`@settings does not accept !important declarations: ${property}`)
    }
}

function parseThemeDeclarations(block: DeclarationBlock<Declaration>, config: CSSDirectiveConfig, mode?: string) {
    for (const declaration of (block.declarations || []) as Declaration[]) {
        const property = getDeclarationName(declaration)
        const value = formatDeclarationValue(declaration)
        if (!property.startsWith('--')) {
            throw new Error(`Unsupported @theme declaration: ${property}`)
        }
        defineThemeVariable(config, property, value, mode)
    }
    for (const declaration of (block.importantDeclarations || []) as Declaration[]) {
        const property = getDeclarationName(declaration)
        throw new Error(`@theme does not accept !important declarations: ${property}`)
    }
}

function normalizeAtValue(value: string) {
    const trimmed = value.trim().replace(/\s*([:<>]=?|=)\s*/g, '$1')
    const rawAtRule = /^@(media|supports|container|layer|starting-style)\b\s*(.*)$/.exec(trimmed)
    if (!rawAtRule) return trimmed

    const [, type, body] = rawAtRule
    if (type === 'starting-style') {
        if (body.trim()) throw new Error('@starting-style at token does not accept a value')
        return 'starting-style'
    }
    if (type === 'container') {
        return `${type}${body ? ' ' + body.trim() : ''}`.trim()
    }
    if (type === 'layer') {
        return body.trim().startsWith('(') ? `layer${body.trim()}` : `layer(${body.trim()})`
    }
    if (type === 'media') {
        const mediaBody = body.trim()
        return mediaBody.startsWith('(') ? `media${mediaBody}` : `media ${mediaBody}`
    }
    if (!body.trim().startsWith('(')) {
        throw new Error('@supports at token value must use a parenthesized condition')
    }
    return `${type}${body.trim()}`
}

function parseAtDefinition(rule: any, parsed: ParsedDirectives) {
    const match = /^(\S+)\s+(.+)$/.exec(formatPrelude(rule.value.prelude))
    if (!match) {
        throw new Error('@custom-at requires a token name and at-rule value')
    }

    const [, token, value] = match
    if (token.startsWith('@')) {
        throw new Error(`@custom-at names must not start with "@": ${token}`)
    }
    if (token.startsWith(':')) {
        throw new Error(`@custom-at names cannot be selector tokens: ${token}`)
    }
    if (!value.trim().startsWith('@')) {
        throw new Error(`@custom-at "${token}" must use an explicit at-rule value`)
    }
    parsed.config.atTokens ??= {}
    parsed.config.atTokens[token] = normalizeAtValue(value)
}

function parseSelectorDefinition(rule: any, parsed: ParsedDirectives) {
    const match = /^(\S+)\s+(.+)$/.exec(formatPrelude(rule.value.prelude))
    if (!match) {
        throw new Error('@custom-selector requires a selector token name and selector value')
    }

    const [, token, value] = match
    if (!token.startsWith(':')) {
        throw new Error(`@custom-selector names must start with ":" or "::": ${token}`)
    }
    parsed.config.selectorTokens ??= {}
    parsed.config.selectorTokens[token] = value.trim()
}

function isCustomAtDefinition(rule: Rule) {
    return (rule.type === 'unknown' || rule.type === 'custom') && rule.value?.name === 'custom-at'
}

function isCustomSelectorDefinition(rule: Rule) {
    return (rule.type === 'unknown' || rule.type === 'custom') && rule.value?.name === 'custom-selector'
}

function parseManagedStyleDefinitionSelector(selectors: Selector[]): StyleSelectorDefinition | undefined {
    const names = selectors.map((selector) => selector[0]?.type === 'class' ? selector[0].name : undefined)
    const name = names[0]
    if (!name || names.some((eachName) => eachName !== name)) return
    const selectorTexts = selectors.map((selector) => {
        const selectorText = formatSelectors([selector])
        const classPattern = new RegExp(`^\\.${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?=$|[^a-zA-Z0-9_-])`)
        return selectorText.replace(classPattern, '&')
    })
    return {
        name,
        selectors: selectorTexts,
        selector: selectorTexts.join(',')
    }
}

interface ParsedComposeClassName {
    className: string
    source?: CSSDirectiveSourceReference
}

interface ParsedComposeRule {
    classNames: ParsedComposeClassName[]
    directiveSource?: CSSDirectiveSourceReference
}

function takeComposeRange(parsed: ParsedDirectives) {
    const ranges = parsed.composeRanges || []
    const index = parsed.composeRangeIndex || 0
    parsed.composeRangeIndex = index + 1
    return ranges[index]
}

function parseComposeRule(rule: any, parsed: ParsedDirectives): ParsedComposeRule | undefined {
    if (rule.type === 'custom' && rule.value.name === 'compose') {
        const classList = unquote(rule.value.prelude.value)
        const range = takeComposeRange(parsed)
        const quotedRange = range?.quotedStringRanges[0]
        const tokenRanges = quotedRange
            ? collectMasterCSSClassListTokenRanges(parsed.source?.slice(quotedRange.contentRange.start, quotedRange.contentRange.end) || '')
            : []
        const classTokens = collectMasterCSSClassListTokenRanges(classList)
        return {
            classNames: classTokens.map((token, index) => {
                const sourceToken = tokenRanges[index]
                return {
                    className: token.token,
                    ...(sourceToken && quotedRange
                        ? {
                            source: createSourceReference(parsed, {
                                start: quotedRange.contentRange.start + sourceToken.start,
                                end: quotedRange.contentRange.start + sourceToken.end
                            })
                        }
                        : {})
                }
            }),
            ...(range ? { directiveSource: createSourceReference(parsed, range) } : {})
        }
    }
}

function createComposePlacementError(parsed: ParsedDirectives) {
    const range = takeComposeRange(parsed)
    return new CSSDirectiveError(
        'compose-placement',
        '@compose requires a style rule',
        range ? createSourceReference(parsed, range) : undefined
    )
}

function parseMasterAtRuleBlock(rule: any) {
    if ((rule.type !== 'custom' && rule.type !== 'unknown') || rule.value?.name !== 'at') return
    const token = formatPrelude(rule.value.prelude)
    if (!token) {
        throw new Error('@at requires a Master CSS at token')
    }
    if (token.startsWith('@')) {
        throw new Error('@at accepts Master CSS at tokens without the leading "@"')
    }
    const rules = rule.value.body?.value
    if (!Array.isArray(rules)) {
        throw new Error('@at requires a style block')
    }
    return {
        token,
        rules: rules as Rule[]
    }
}

function isNestedStyleRule(rule: Rule) {
    return rule.type === 'style'
        || rule.type === 'media'
        || rule.type === 'supports'
        || rule.type === 'container'
        || rule.type === 'starting-style'
        || rule.type === 'layer-block'
        || Boolean(parseMasterAtRuleBlock(rule))
}

type StyleRuleBodyItem =
    | {
        type: 'declarations'
        declarations: Record<string, string>
    }
    | {
        type: 'compose'
        classNames: ParsedComposeClassName[]
        directiveSource?: CSSDirectiveSourceReference
    }
    | {
        type: 'nested'
        rule: Rule
    }

function collectDirectiveStyleRule(rule: any, parsed: ParsedDirectives) {
    return collectDirectiveStyleRuleBody(rule.value.declarations, rule.value.rules, parsed)
}

function collectDirectiveStyleRuleBody(block: DeclarationBlock<Declaration>, rules: Rule[], parsed: ParsedDirectives) {
    const items: StyleRuleBodyItem[] = []
    const declarations = collectDeclarations(block)
    if (Object.keys(declarations).length) {
        items.push({
            type: 'declarations',
            declarations
        })
    }
    for (const child of rules) {
        if (child.type === 'nested-declarations') {
            const nestedDeclarations = collectDeclarations(child.value.declarations)
            if (Object.keys(nestedDeclarations).length) {
                items.push({
                    type: 'declarations',
                    declarations: nestedDeclarations
                })
            }
            continue
        }
        if (isNestedStyleRule(child)) {
            items.push({
                type: 'nested',
                rule: child
            })
            continue
        }
        const compose = parseComposeRule(child, parsed)
        if (compose) {
            items.push({
                type: 'compose',
                classNames: compose.classNames,
                ...(compose.directiveSource ? { directiveSource: compose.directiveSource } : {})
            })
            continue
        }
        throw new Error('Style definitions only accept declarations, @compose, nested selectors, and nested at-rules')
    }
    return items
}

function combineStyleSelectorLists(parentSelectors: string[], childSelectorAST: Selector[]) {
    const childSelectors = childSelectorAST.map((selector) => formatSelectors([selector]))
    const selectors: string[] = []

    for (const child of childSelectors) {
        for (const parent of parentSelectors) {
            selectors.push(child.includes('&')
                ? child.replace(/&/g, parent)
                : `${parent} ${child}`
            )
        }
    }

    return selectors
}

interface StyleSelectorDefinition {
    name?: string
    selectors: string[]
    selector: string
    source?: CSSDirectiveSourceReference
}

const EMPTY_DECLARATION_BLOCK: DeclarationBlock<Declaration> = {
    declarations: [],
    importantDeclarations: []
}

function parseStyleDefinitionBody(
    parsed: ParsedDirectives,
    selectorDefinition: StyleSelectorDefinition,
    items: StyleRuleBodyItem[],
    atRules: string[] = [],
    layer?: CSSDirectiveLayerName,
    name = selectorDefinition.name
) {
    const definitions = getParsedStyleDefinitions(parsed)

    for (const item of items) {
        if (item.type === 'compose') {
            definitions.push(...item.classNames.map(({ className, source }) => ({
                type: 'compose' as const,
                order: nextStyleOrder(parsed),
                className,
                selector: selectorDefinition.selector,
                ...(source ? { source } : {}),
                ...(item.directiveSource ? { directiveSource: item.directiveSource } : {}),
                ...(selectorDefinition.source ? { selectorSource: selectorDefinition.source } : {}),
                ...(name ? { name } : {}),
                ...(atRules.length ? { atRules: [...atRules] } : {}),
                ...(layer ? { layer } : {})
            })))
            continue
        }

        if (item.type === 'declarations') {
            if (!Object.keys(item.declarations).length) continue
            definitions.push({
                type: 'native',
                order: nextStyleOrder(parsed),
                selector: selectorDefinition.selector,
                ...(selectorDefinition.source ? { selectorSource: selectorDefinition.source } : {}),
                ...(name ? { name } : {}),
                declarations: item.declarations,
                ...(atRules.length ? { atRules: [...atRules] } : {}),
                ...(layer ? { layer } : {})
            })
            continue
        }

        if (name) {
            parseNestedManagedStyleChildRule(item.rule, parsed, selectorDefinition as StyleSelectorDefinition & { name: string }, atRules, layer)
        } else {
            parseNestedNativeStyleChildRule(item.rule, parsed, selectorDefinition, atRules)
        }
    }

    if (name && !parsed.classNames.includes(name)) {
        parsed.classNames.push(name)
    }
}

function parseStyleRuleBody(
    rules: Rule[],
    parsed: ParsedDirectives,
    selectorDefinition: StyleSelectorDefinition,
    atRules: string[] = [],
    layer?: CSSDirectiveLayerName,
    name = selectorDefinition.name
) {
    parseStyleDefinitionBody(parsed, selectorDefinition, collectDirectiveStyleRuleBody(EMPTY_DECLARATION_BLOCK, rules, parsed), atRules, layer, name)
}

function parseNestedManagedStyleChildRule(child: Rule, parsed: ParsedDirectives, parentSelectorDefinition: StyleSelectorDefinition, atRules: string[], layer?: CSSDirectiveLayerName) {
    const managedLayerBlock = parseManagedLayerBlock(child)
    if (managedLayerBlock) {
        if (layer) {
            throw new Error('Nested @layer blocks are not allowed inside managed style definitions')
        }
        parseStyleRuleBody(managedLayerBlock.rules, parsed, parentSelectorDefinition, atRules, managedLayerBlock.layer)
        return
    }

    const masterAtRuleBlock = parseMasterAtRuleBlock(child)
    if (masterAtRuleBlock) {
        parseStyleRuleBody(masterAtRuleBlock.rules, parsed, parentSelectorDefinition, [...atRules, createCSSDirectiveAtRuleReference(masterAtRuleBlock.token)], layer)
        return
    }

    const nestedAtRuleChildren = getNestedAtRuleChildren(child)
    if (nestedAtRuleChildren) {
        const atRule = formatNestedAtRule(child)
        if (!atRule) {
            throw new Error('Unsupported nested at-rule in @master')
        }
        parseStyleRuleBody(nestedAtRuleChildren, parsed, parentSelectorDefinition, [...atRules, atRule], layer)
        return
    }

    if (child.type === 'style') {
        parseManagedStyleRule(child, parsed, atRules, layer, parentSelectorDefinition)
        return
    }

    throw new Error('Style definitions only accept declarations, @compose, nested selectors, and nested at-rules')
}

function parseManagedStyleRule(rule: any, parsed: ParsedDirectives, atRules: string[] = [], layer?: CSSDirectiveLayerName, parentSelectorDefinition?: StyleSelectorDefinition) {
    const selectorDefinition = parentSelectorDefinition
        ? (() => {
            const selectors = combineStyleSelectorLists(parentSelectorDefinition.selectors, rule.value.selectors)
            return {
                name: parentSelectorDefinition.name,
                selectors,
                selector: selectors.join(','),
                source: createSelectorSourceReference(parsed, rule) || parentSelectorDefinition.source
            }
        })()
        : parseManagedStyleDefinitionSelector(rule.value.selectors)
    if (!selectorDefinition) {
        throw new Error('Managed style definition selector must start with a single class selector')
    }
    selectorDefinition.source ||= createSelectorSourceReference(parsed, rule)
    parseStyleDefinitionBody(parsed, selectorDefinition, collectDirectiveStyleRule(rule, parsed), atRules, layer)
}

function parseUtility(rule: any, parsed: ParsedDirectives, atRules: string[] = [], layer: CSSDirectiveLayerName = 'utilities') {
    const selectorDefinition = parseManagedStyleDefinitionSelector(rule.value.selectors)
    if (!selectorDefinition) {
        throw new Error('Utility definition selector must start with a single class selector')
    }
    selectorDefinition.source = createSelectorSourceReference(parsed, rule)
    parseStyleDefinitionBody(parsed, selectorDefinition, collectDirectiveStyleRule(rule, parsed), atRules, layer)
}

function parseNativeSelectorDefinition(selectors: Selector[], parentSelectorDefinition?: StyleSelectorDefinition): StyleSelectorDefinition {
    const selectorTexts = parentSelectorDefinition
        ? combineStyleSelectorLists(parentSelectorDefinition.selectors, selectors)
        : selectors.map((selector) => formatSelectors([selector]))
    return {
        selectors: selectorTexts,
        selector: selectorTexts.join(',')
    }
}

function parseNativeRuleBody(
    rules: Rule[],
    parsed: ParsedDirectives,
    atRules: string[] = [],
    parentSelectorDefinition?: StyleSelectorDefinition
) {
    for (const child of rules) {
        const compose = parseComposeRule(child, parsed)
        if (compose && parentSelectorDefinition) {
            parseStyleDefinitionBody(parsed, parentSelectorDefinition, [{
                type: 'compose',
                classNames: compose.classNames,
                ...(compose.directiveSource ? { directiveSource: compose.directiveSource } : {})
            }], atRules, undefined, undefined)
            continue
        }

        if (child.type === 'nested-declarations' && parentSelectorDefinition) {
            const declarations = collectDeclarations(child.value.declarations)
            if (Object.keys(declarations).length) {
                parseStyleDefinitionBody(parsed, parentSelectorDefinition, [{
                    type: 'declarations',
                    declarations
                }], atRules, undefined, undefined)
            }
            continue
        }

        const masterAtRuleBlock = parseMasterAtRuleBlock(child)
        if (masterAtRuleBlock) {
            parseNativeRuleBody(masterAtRuleBlock.rules, parsed, [...atRules, createCSSDirectiveAtRuleReference(masterAtRuleBlock.token)], parentSelectorDefinition)
            continue
        }

        const nestedAtRuleChildren = getNestedAtRuleChildren(child)
        if (nestedAtRuleChildren) {
            const atRule = formatNestedAtRule(child)
            if (!atRule) {
                throw new Error('Unsupported nested at-rule in native CSS')
            }
            parseNativeRuleBody(nestedAtRuleChildren, parsed, [...atRules, atRule], parentSelectorDefinition)
            continue
        }

        if (child.type === 'style') {
            parseNativeStyleRule(child, parsed, atRules, parentSelectorDefinition)
            continue
        }

        if (child.type === 'keyframes') {
            throw new Error('@keyframes is not allowed inside @at. Move animation definitions to top-level @keyframes.')
        }

        if (compose) {
            throw new CSSDirectiveError('compose-placement', '@compose requires a style rule', compose.directiveSource)
        }

        if (child.type === 'nested-declarations') {
            throw new Error('Native @at blocks only accept style rules, declarations, @compose, and nested at-rules')
        }
    }
}

function parseNestedNativeStyleChildRule(child: Rule, parsed: ParsedDirectives, parentSelectorDefinition: StyleSelectorDefinition, atRules: string[]) {
    const masterAtRuleBlock = parseMasterAtRuleBlock(child)
    if (masterAtRuleBlock) {
        parseNativeRuleBody(masterAtRuleBlock.rules, parsed, [...atRules, createCSSDirectiveAtRuleReference(masterAtRuleBlock.token)], parentSelectorDefinition)
        return
    }

    const nestedAtRuleChildren = getNestedAtRuleChildren(child)
    if (nestedAtRuleChildren) {
        const atRule = formatNestedAtRule(child)
        if (!atRule) {
            throw new Error('Unsupported nested at-rule in native CSS')
        }
        parseNativeRuleBody(nestedAtRuleChildren, parsed, [...atRules, atRule], parentSelectorDefinition)
        return
    }

    if (child.type === 'style') {
        parseNativeStyleRule(child, parsed, atRules, parentSelectorDefinition)
        return
    }

    throw new Error('Native CSS rules only accept declarations, @compose, nested selectors, and nested at-rules')
}

function parseNativeStyleRule(rule: any, parsed: ParsedDirectives, atRules: string[] = [], parentSelectorDefinition?: StyleSelectorDefinition) {
    const selectorDefinition = parseNativeSelectorDefinition(rule.value.selectors, parentSelectorDefinition)
    selectorDefinition.source = createSelectorSourceReference(parsed, rule) || parentSelectorDefinition?.source
    parseStyleDefinitionBody(parsed, selectorDefinition, collectDirectiveStyleRule(rule, parsed), atRules, undefined, undefined)
}

function formatKeyframeSelector(selector: KeyframeSelector) {
    switch (selector.type) {
        case 'from':
        case 'to':
            return selector.type
        case 'percentage':
            return `${selector.value * 100}%`
        case 'timeline-range-percentage':
            return `${selector.value.name} ${selector.value.percentage * 100}%`
    }
}

function parseKeyframes(rule: any, config: CSSDirectiveConfig) {
    const name = rule.value.name.value
    if (!name) {
        throw new Error('@keyframes requires a name')
    }
    const keyframes: CSSDirectiveAnimationDefinitions[string] = {}
    for (const keyframe of rule.value.keyframes) {
        const declarations = collectDeclarations(keyframe.declarations)
        for (const selector of keyframe.selectors.map(formatKeyframeSelector)) {
            keyframes[selector] = declarations
        }
    }
    config.animations ??= {}
    config.animations[name] = keyframes
}

function getCustomRulePrelude(rule: any) {
    return rule.prelude ?? rule.value?.prelude
}

function getCustomRuleBody(rule: any) {
    return rule.body ?? rule.value?.body
}

function getSettingsSection(rule: any): SettingsSection {
    const prelude = formatPrelude(getCustomRulePrelude(rule))
    if (!prelude) return 'root'
    throw new Error(`Unsupported @settings section: ${prelude}`)
}

function getThemeMode(rule: any) {
    const prelude = formatPrelude(getCustomRulePrelude(rule))
    if (!prelude) return
    if (/\s/.test(prelude)) {
        throw new Error('@theme mode must be a single token')
    }
    return prelude
}

function parseSettingsStyleRule(rule: any) {
    if (parseManagedStyleDefinitionSelector(rule.value.selectors)) {
        throw new Error('@settings does not accept class definitions')
    }

    throw new Error(`Unsupported @settings selector: ${formatSelectors(rule.value.selectors)}`)
}

function parseManagedLayerBlock(rule: Rule) {
    if (rule.type !== 'layer-block') return
    const layerName = (rule.value.name || []).join('.')
    if (!layerName) {
        throw new Error('Managed @layer requires a layer name')
    }
    if (!UTILITY_LAYER_NAMES.has(layerName as CSSDirectiveLayerName)) {
        throw new Error(`Unsupported managed @layer: ${layerName}`)
    }
    return {
        layer: layerName as CSSDirectiveLayerName,
        rules: rule.value.rules as Rule[]
    }
}

function parseSettingsChildRule(child: Rule, parsed: ParsedDirectives, section: SettingsSection) {
    const managedLayerBlock = parseManagedLayerBlock(child)
    if (managedLayerBlock) {
        throw new Error('@settings does not accept @layer')
    }

    const masterAtRuleBlock = parseMasterAtRuleBlock(child)
    if (masterAtRuleBlock) {
        throw new Error('@settings does not accept @at')
    }

    const nestedAtRuleChildren = getNestedAtRuleChildren(child)
    if (nestedAtRuleChildren) {
        throw new Error('@settings does not accept nested at-rules')
    }

    if (child.type === 'nested-declarations') {
        parseSettingsDeclarations(child.value.declarations, parsed.config)
        return
    }
    if (child.type === 'keyframes') {
        throw new Error('@settings does not accept @keyframes')
    }
    if (child.type === 'style') {
        parseSettingsStyleRule(child)
        return
    }
    if ((child.type === 'unknown' || child.type === 'custom') && child.value?.name === 'mode') {
        throw new Error('@settings does not accept @mode')
    }
    throw new Error(`Unsupported rule in @settings${section === 'root' ? '' : ' ' + section}`)
}

function parseSettingsRule(rule: any, parsed: ParsedDirectives) {
    const section = getSettingsSection(rule)
    const body = getCustomRuleBody(rule)
    if (!Array.isArray(body?.value)) {
        throw new Error('@settings requires a style block')
    }
    for (const child of body.value as Rule[]) {
        parseSettingsChildRule(child, parsed, section)
    }
}

function parseThemeRule(rule: any, parsed: ParsedDirectives) {
    const mode = getThemeMode(rule)
    const body = getCustomRuleBody(rule)
    if (!Array.isArray(body?.value)) {
        throw new Error('@theme requires a style block')
    }
    if (mode) addThemeMode(parsed.config, mode)
    for (const child of body.value as Rule[]) {
        if (child.type !== 'nested-declarations') {
            throw new Error('@theme only accepts custom property declarations')
        }
        parseThemeDeclarations(child.value.declarations, parsed.config, mode)
    }
}

function containsNativeStyleDirective(rule: Rule): boolean {
    if ((rule.type === 'unknown' || rule.type === 'custom') && (rule.value?.name === 'compose' || rule.value?.name === 'at')) {
        return true
    }
    if (rule.type === 'style') {
        return (rule.value.rules || []).some(containsNativeStyleDirective)
    }
    const nestedAtRuleChildren = getNestedAtRuleChildren(rule)
    if (nestedAtRuleChildren) {
        return nestedAtRuleChildren.some(containsNativeStyleDirective)
    }
    return false
}

function parseTopLevelLayerChildRule(child: Rule, parsed: ParsedDirectives, atRules: string[], layer: CSSDirectiveLayerName) {
    if (parseManagedLayerBlock(child)) {
        throw new Error(`Nested @layer blocks are not allowed in top-level @layer ${layer}`)
    }

    const masterAtRuleBlock = parseMasterAtRuleBlock(child)
    if (masterAtRuleBlock) {
        for (const nestedChild of masterAtRuleBlock.rules) {
            parseTopLevelLayerChildRule(nestedChild, parsed, [...atRules, createCSSDirectiveAtRuleReference(masterAtRuleBlock.token)], layer)
        }
        return
    }

    const nestedAtRuleChildren = getNestedAtRuleChildren(child)
    if (nestedAtRuleChildren) {
        const atRule = formatNestedAtRule(child)
        if (!atRule) {
            throw new Error(`Unsupported nested at-rule in top-level @layer ${layer}`)
        }
        for (const nestedChild of nestedAtRuleChildren) {
            parseTopLevelLayerChildRule(nestedChild, parsed, [...atRules, atRule], layer)
        }
        return
    }

    if (child.type === 'nested-declarations') {
        throw new Error(`Top-level @layer ${layer} only accepts class definitions and nested at-rules`)
    }
    if (child.type === 'keyframes') {
        throw new Error('@keyframes is not allowed inside managed @layer blocks. Move animation definitions to top-level @keyframes.')
    }
    if (child.type === 'style') {
        if (layer === 'utilities') {
            parseUtility(child, parsed, atRules, layer)
        } else {
            parseManagedStyleRule(child, parsed, atRules, layer)
        }
        return
    }
    if ((child.type === 'unknown' || child.type === 'custom') && child.value?.name === 'compose') {
        throw createComposePlacementError(parsed)
    }
    if ((child.type === 'unknown' || child.type === 'custom') && child.value?.name === 'mode') {
        throw new Error('Unsupported @mode rule')
    }
    if (isCustomAtDefinition(child)) {
        throw new Error('@custom-at must be top-level')
    }
    if (isCustomSelectorDefinition(child)) {
        throw new Error('@custom-selector must be top-level')
    }
    throw new Error(`Unsupported rule in top-level @layer ${layer}`)
}

function parseTopLevelLayerBlock(rule: any, parsed: ParsedDirectives) {
    const layerName = (rule.value.name || []).join('.')
    if (!TOP_LEVEL_DEFINITION_LAYER_NAMES.has(layerName as CSSDirectiveLayerName)) {
        throw new Error(`Unsupported managed @layer: ${layerName}`)
    }
    for (const child of rule.value.rules as Rule[]) {
        parseTopLevelLayerChildRule(child, parsed, [], layerName as CSSDirectiveLayerName)
    }
}

export function compileCSS(source: string, options: CompileCSSOptions = {}): CompileCSSResult {
    const filename = options.from || 'master.css'
    const parsed: ParsedDirectives = {
        config: {},
        extractionPolicy: createCSSDirectiveExtractionPolicy(),
        classNames: [],
        nativeClassNames: [],
        warnings: [],
        source,
        filename,
        composeRanges: collectCSSDirectiveRanges(source).filter((range) => range.name === 'compose'),
        composeRangeIndex: 0,
        sourceLocationResolver: createSourceLocationResolver(source)
    }
    const classFilter = options.classes === undefined
        ? undefined
        : new Set(options.classes)
    parsed.extractionPolicy = collectStandaloneCSSDirectiveExtractionPolicy(source, filename)
    const preprocessedSource = removeStandaloneCSSDirectives(source, filename)
    let ruleDepth = 0
    const transformed = getCSSTransform()({
        filename,
        code: encodeCSS(preprocessedSource),
        customAtRules: MASTER_CUSTOM_AT_RULES,
        visitor: {
            Rule(rule: any) {
                if (ruleDepth === 0) {
                    if (rule.type === 'keyframes') {
                        parseKeyframes(rule, parsed.config)
                        return []
                    }
                    if (rule.type === 'layer-block') {
                        const layerName = (rule.value.name || []).join('.')
                        if (TOP_LEVEL_DEFINITION_LAYER_NAMES.has(layerName as CSSDirectiveLayerName)) {
                            parseTopLevelLayerBlock(rule, parsed)
                            return []
                        }
                    }
                    if (isCustomAtDefinition(rule)) {
                        parseAtDefinition(rule, parsed)
                        return []
                    }
                    if (isCustomSelectorDefinition(rule)) {
                        parseSelectorDefinition(rule, parsed)
                        return []
                    }
                    const masterAtRuleBlock = parseMasterAtRuleBlock(rule)
                    if (masterAtRuleBlock) {
                        parseNativeRuleBody(masterAtRuleBlock.rules, parsed, [createCSSDirectiveAtRuleReference(masterAtRuleBlock.token)])
                        return []
                    }
                    const nestedAtRuleChildren = getNestedAtRuleChildren(rule)
                    if (nestedAtRuleChildren && containsNativeStyleDirective(rule)) {
                        const atRule = formatNestedAtRule(rule)
                        if (!atRule) {
                            throw new Error('Unsupported nested at-rule in native CSS')
                        }
                        parseNativeRuleBody(nestedAtRuleChildren, parsed, [atRule])
                        return []
                    }
                    if (rule.type === 'style' && containsNativeStyleDirective(rule)) {
                        parseNativeStyleRule(rule, parsed)
                        return []
                    }
                }

                if (rule.type === 'custom') {
                    switch (rule.value.name) {
                        case 'master':
                            return []
                        case 'settings':
                            if (ruleDepth !== 0) {
                                throw new Error('@settings must be top-level')
                            }
                            parseSettingsRule(rule, parsed)
                            return []
                        case 'theme':
                            if (ruleDepth !== 0) {
                                throw new Error('@theme must be top-level')
                            }
                            parseThemeRule(rule, parsed)
                            return []
                        case 'compose':
                            throw createComposePlacementError(parsed)
                        case 'custom-at':
                            throw new Error('@custom-at must be top-level')
                        case 'custom-selector':
                            throw new Error('@custom-selector must be top-level')
                        case 'at':
                            throw new Error('@at requires a style rule or nested style rules')
                        case 'mode':
                            throw new Error('Unsupported @mode rule')
                    }
                }

                ruleDepth++
            },
            RuleExit() {
                ruleDepth--
            }
        }
    })
    let remainingCSS = ''
    if (options.preserveNativeCSS !== false) {
        const filteredCode = filterNativeCSS(transformed.code, filename, parsed, classFilter)
        const remainingCode = classFilter
            ? pruneEmptyRuleBlocks(filteredCode, filename)
            : filteredCode
        remainingCSS = decodeCSS(remainingCode).trim()
    }

    return {
        config: parsed.config,
        extractionPolicy: parsed.extractionPolicy,
        classNames: parsed.classNames,
        nativeClassNames: parsed.nativeClassNames,
        warnings: parsed.warnings,
        nativeCSS: remainingCSS,
        css: remainingCSS,
        generatedCSS: '',
        dependencies: [],
        ...(parsed.styleDefinitions ? { styleDefinitions: parsed.styleDefinitions } : {})
    }
}

export function parseDirectives(source: string, options: CompileCSSOptions = {}) {
    const { config, extractionPolicy, classNames, nativeClassNames, warnings, styleDefinitions } = compileCSS(source, options)
    return {
        config,
        extractionPolicy,
        classNames,
        nativeClassNames,
        warnings,
        ...(styleDefinitions ? { styleDefinitions } : {})
    }
}
