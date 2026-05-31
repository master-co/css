import {
    AT_IDENTIFIERS,
    config as defaultConfig,
    createCSS,
    extendConfig,
    generateAt,
    generateSelector,
    screens as defaultScreens,
    UtilityType
} from '@master/css'
import resolveSelectorTokens from '@master/css/utils/resolve-selector-tokens'
import parseAt from '@master/css/utils/parse-at'
import compareRulePriority from '@master/css/utils/compare-rule-priority'
import type { PropertiesHyphen } from 'csstype'
import type {
    AnimationDefinitions,
    Config,
    Utility,
    UtilityDefinition,
    UtilityLayerName,
    UtilityRuleDefinition,
    VariableValue
} from '@master/css'
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
import type * as LightningCSS from 'lightningcss'
import unquote from './utils/unquote'
import resolveVariableNamespace from './utils/variable-namespace'

export type CSSTransform = typeof LightningCSS.transform

let transform: CSSTransform | undefined

export function setCSSTransform(transformer: CSSTransform) {
    transform = transformer
}

function getCSSTransform() {
    if (!transform) {
        throw new Error('@master/css-compiler requires a CSS transform implementation. Use the default Node entry or initialize the browser entry.')
    }
    return transform
}

export interface CompileCSSOptions {
    config?: Parameters<typeof createCSS>[0]
    classes?: string[]
    from?: string
    preserveNativeCSS?: boolean
    onWarning?: (warning: string) => void
}

export interface CompileCSSFileOptions extends CompileCSSOptions {
    root?: string
}

export interface CompileCSSResult {
    config: Config
    classNames: string[]
    nativeClassNames: string[]
    nativeCSS: string
    css: string
    generatedCSS: string
    warnings: string[]
    dependencies: string[]
}

export interface ResolvedCSSImportGraph {
    source: string
    dependencies: string[]
}

interface PendingComponentCompose {
    type: 'compose'
    order: number
    className: string
    selector: string
    atRules?: string[]
    layer?: UtilityLayerName
}

interface PendingComponentNative {
    type: 'native'
    order: number
    selector: string
    declarations: PropertiesHyphen
    atRules?: string[]
    layer?: UtilityLayerName
}

type ParsedComponentDefinition = PendingComponentCompose | PendingComponentNative

type ParsedUtilityRuleDefinition = UtilityRuleDefinition

export interface ParsedDirectives extends Pick<CompileCSSResult, 'config' | 'classNames' | 'nativeClassNames' | 'warnings'> {
    componentDefinitions?: Record<string, ParsedComponentDefinition[]>
    componentOrder?: number
}

const MASTER_CUSTOM_AT_RULES = {
    master: {
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

type MasterSection = 'root'

const DEFAULT_MODE_NAMES = new Set(defaultConfig.modes || [])
const DEFAULT_SCREEN_NAMES = new Set(Object.keys(defaultScreens))
const IMPORTANT_FLAG_VALUE = '__master_important__'
const MASTER_AT_RULE_PREFIX = '__master_at__:'
const UTILITY_LAYER_NAMES = new Set<UtilityLayerName>(['base', 'preset', 'main', 'general'])
const STANDALONE_MASTER_DIRECTIVE_NAMES = new Set(['shake', 'no-shake', 'source', 'class'])

const HTML_TAG_NAMES = new Set([
    'a',
    'abbr',
    'address',
    'area',
    'article',
    'aside',
    'audio',
    'b',
    'base',
    'bdi',
    'bdo',
    'blockquote',
    'body',
    'br',
    'button',
    'canvas',
    'caption',
    'cite',
    'code',
    'col',
    'colgroup',
    'data',
    'datalist',
    'dd',
    'del',
    'details',
    'dfn',
    'dialog',
    'div',
    'dl',
    'dt',
    'em',
    'embed',
    'fieldset',
    'figcaption',
    'figure',
    'footer',
    'form',
    'h1',
    'h2',
    'h3',
    'h4',
    'h5',
    'h6',
    'head',
    'header',
    'hgroup',
    'hr',
    'html',
    'i',
    'iframe',
    'img',
    'input',
    'ins',
    'kbd',
    'label',
    'legend',
    'li',
    'link',
    'main',
    'map',
    'mark',
    'menu',
    'meta',
    'meter',
    'nav',
    'noscript',
    'object',
    'ol',
    'optgroup',
    'option',
    'output',
    'p',
    'picture',
    'pre',
    'progress',
    'q',
    'rp',
    'rt',
    'ruby',
    's',
    'samp',
    'script',
    'search',
    'section',
    'select',
    'slot',
    'small',
    'source',
    'span',
    'strong',
    'style',
    'sub',
    'summary',
    'sup',
    'svg',
    'table',
    'tbody',
    'td',
    'template',
    'textarea',
    'tfoot',
    'th',
    'thead',
    'time',
    'title',
    'tr',
    'track',
    'u',
    'ul',
    'var',
    'video',
    'wbr'
])

function normalizeClassNames(classNames: string[]) {
    return classNames.join(' ').replace(/(?:\n\s*)+/g, ' ').trim().split(' ').filter(Boolean)
}

function parseBoolean(value: string) {
    if (value === 'true') return true
    if (value === 'false') return false
}

function parseNumber(value: string) {
    const numberValue = Number(value)
    if (!Number.isNaN(numberValue) && String(numberValue) === value) return numberValue
}

function parseList(value: string) {
    return value.split(',').flatMap((part) => part.trim().split(/\s+/)).filter(Boolean)
}

function encodeCSS(source: string) {
    return new TextEncoder().encode(source)
}

function decodeCSS(code: Uint8Array) {
    return new TextDecoder().decode(code)
}

function parseVariableValue(value: string): VariableValue {
    const trimmed = value.trim()
    const numberValue = parseNumber(trimmed)
    return numberValue === undefined ? trimmed : numberValue
}

function addMasterMode(config: Config, mode: string) {
    if (DEFAULT_MODE_NAMES.has(mode)) return
    config.modes ??= []
    if (!config.modes.includes(mode)) config.modes.push(mode)
}

function defineMasterVariable(config: Config, property: string, rawValue: string, mode?: string) {
    const variable = resolveVariableNamespace(property)
    const value = parseVariableValue(rawValue)
    if (mode && variable.namespace === 'screen') {
        throw new Error(`Screen variables cannot be mode-specific: screen-${variable.key}@${mode}`)
    }
    if (mode) {
        addMasterMode(config, mode)
    }
    config.variables ??= []
    const definition = {
        ...(variable.namespace ? { namespace: variable.namespace } : {}),
        key: variable.key,
        value,
        ...(mode ? { mode } : {})
    }
    const foundIndex = config.variables.findIndex((existing) =>
        existing.key === definition.key
        && existing.namespace === definition.namespace
        && existing.mode === definition.mode
    )
    if (foundIndex !== -1) {
        config.variables.splice(foundIndex, 1)
    }
    config.variables.push(definition)
}

function parseMasterOption(config: Config, property: string, value: string) {
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
            config.defaultMode = parseBoolean(value) === false ? false : value as Config['defaultMode']
            return true
        case 'mode-trigger':
            if (value !== 'class' && value !== 'media' && value !== 'host') {
                throw new Error('mode-trigger must be class, media, or host')
            }
            config.modeTrigger = value
            return true
        case 'important': {
            if (value !== IMPORTANT_FLAG_VALUE) {
                throw new Error('Use "important;" or "!important;" to enable important output')
            }
            config.important = true
            return true
        }
        case 'modes':
            for (const mode of parseList(value)) {
                addMasterMode(config, mode)
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
    const declarationText = formatDeclaration(declaration)
    const colonIndex = declarationText.indexOf(':')
    return declarationText.slice(colonIndex + 1).trim()
}

function formatNumber(value: number) {
    return String(value).replace(/^(-?)0\./, '$1.')
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
    }
}

function getNestedAtRuleChildren(rule: any) {
    if (rule.type === 'media' || rule.type === 'supports' || rule.type === 'container' || rule.type === 'starting-style') {
        return rule.value.rules as Rule[]
    }
}

function sameAtRules(a: string[] | undefined, b: string[] | undefined) {
    const left = a || []
    const right = b || []
    return left.length === right.length && left.every((value, index) => value === right[index])
}

function getParsedComponentDefinitions(parsed: ParsedDirectives, name: string) {
    parsed.componentDefinitions ??= {}
    parsed.componentDefinitions[name] ??= []
    return parsed.componentDefinitions[name]
}

function nextComponentOrder(parsed: ParsedDirectives) {
    parsed.componentOrder = (parsed.componentOrder || 0) + 1
    return parsed.componentOrder
}

function getUtilityAtRuleDefinitions(utility: Utility) {
    const atRules: string[] = []
    if (utility.atRules) {
        for (const id of AT_IDENTIFIERS) {
            const nodes = utility.atRules[id]
            if (!nodes) continue
            if (id === 'layer' && getUtilityComponentLayer(utility)) continue
            atRules.push(generateAt({ id, nodes }))
        }
    }
    return atRules
}

function getUtilityComponentLayer(utility: Utility) {
    return utility.explicitLayerName
}

function getUtilityComponentSelector(utility: Utility, css: ReturnType<typeof createCSS>) {
    let selector = utility.selectorNodes
        ? generateSelector(utility.selectorNodes, '&')
        : '&'
    if (utility.mode && css.config.modeTrigger !== 'media') {
        const modeSelector = css.getModeSelector(utility.mode)
        if (modeSelector) selector = `${modeSelector} ${selector}`
    }
    return selector
}

function cloneDeclarations(declarations: PropertiesHyphen, important?: boolean) {
    const result: PropertiesHyphen = {}
    for (const propertyName in declarations) {
        const propertyValue = declarations[propertyName as keyof PropertiesHyphen]
        const value = String(propertyValue)
        result[propertyName as keyof PropertiesHyphen] = (important && !value.endsWith('!important'))
            ? `${value}!important` as any
            : value as any
    }
    return result
}

interface MergedStyleDefinition {
    selector: string
    declarations: PropertiesHyphen
    atRules?: string[]
    layer?: UtilityLayerName
}

interface ComposedComponentDefinition extends MergedStyleDefinition {
    utility: Utility
}

function createComponentDefinitionsFromCompose(className: string, css: ReturnType<typeof createCSS>): ComposedComponentDefinition[] {
    const utility = css.create(className)
    if (!utility?.valid) {
        throw new Error(`Invalid @compose class: ${className}`)
    }
    const selector = getUtilityComponentSelector(utility, css)
    const layer = getUtilityComponentLayer(utility)
    const utilityAtRules = getUtilityAtRuleDefinitions(utility)
    const declarationRules = utility.declarationRules || (utility.declarations ? [{ declarations: utility.declarations }] : [])
    return declarationRules.map(({ declarations, atRules, selector: ruleSelector }) => ({
        utility,
        selector: ruleSelector ? combineComponentSelectors(selector, ruleSelector) : selector,
        declarations: cloneDeclarations(declarations, utility.important),
        ...(layer ? { layer } : {}),
        ...([...utilityAtRules, ...(atRules || [])].length
            ? { atRules: [...utilityAtRules, ...(atRules || [])] }
            : {})
    }))
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

function parseMasterDeclarations(block: DeclarationBlock<Declaration>, config: Config, mode?: string) {
    for (const declaration of (block.declarations || []) as Declaration[]) {
        const property = getDeclarationName(declaration)
        const value = formatDeclarationValue(declaration)
        if (property.startsWith('--')) {
            defineMasterVariable(config, property, value, mode)
            continue
        }
        if (mode) {
            throw new Error(`Mode "${mode}" only accepts custom property declarations`)
        }
        if (!parseMasterOption(config, property, value)) {
            throw new Error(`Unsupported @master option: ${property}`)
        }
    }
    for (const declaration of (block.importantDeclarations || []) as Declaration[]) {
        const property = getDeclarationName(declaration)
        throw new Error(`@master does not accept !important declarations: ${property}`)
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

function parseClassDefinitionSelector(selectors: Selector[]) {
    if (selectors.length !== 1) return
    const selector = selectors[0]
    if (selector.length !== 1) return
    const selectorComponent = selector[0]
    if (selectorComponent.type !== 'class') return
    return selectorComponent.name
}

function parseSingleTypeSelector(selectors: Selector[]) {
    if (selectors.length !== 1) return
    const selector = selectors[0]
    if (selector.length !== 1) return
    const selectorComponent = selector[0]
    if (selectorComponent.type !== 'type') return
    return selectorComponent.name
}

function parseComponentDefinitionSelector(selectors: Selector[]) {
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
        selector: selectorTexts.join(',')
    }
}

function parseComposeRule(rule: any) {
    if (rule.type === 'custom' && rule.value.name === 'compose') {
        return unquote(rule.value.prelude.value)
    }
}

function createMasterAtRuleReference(token: string) {
    return MASTER_AT_RULE_PREFIX + token
}

function readMasterAtRuleReference(atRule: string) {
    return atRule.startsWith(MASTER_AT_RULE_PREFIX)
        ? atRule.slice(MASTER_AT_RULE_PREFIX.length)
        : undefined
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

type ComponentStyleRuleBodyItem =
    | {
        type: 'declarations'
        declarations: Record<string, string>
    }
    | {
        type: 'compose'
        classNames: string[]
    }
    | {
        type: 'nested'
        rule: Rule
    }

function collectStyleRule(rule: any, allowCompose: boolean, allowNestedRules = false) {
    return collectStyleRuleBody(rule.value.declarations, rule.value.rules, allowCompose, allowNestedRules)
}

function collectComponentStyleRule(rule: any) {
    return collectComponentStyleRuleBody(rule.value.declarations, rule.value.rules)
}

function collectComponentStyleRuleBody(block: DeclarationBlock<Declaration>, rules: Rule[]) {
    const items: ComponentStyleRuleBodyItem[] = []
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
        const compose = parseComposeRule(child)
        if (compose) {
            items.push({
                type: 'compose',
                classNames: [compose]
            })
            continue
        }
        throw new Error('Components only accept declarations, @compose, nested selectors, and nested at-rules')
    }
    return items
}

function collectStyleRuleBody(block: DeclarationBlock<Declaration>, rules: Rule[], allowCompose: boolean, allowNestedRules = false) {
    const classNames: string[] = []
    const declarations = collectDeclarations(block)
    const nestedRules: Rule[] = []
    for (const child of rules) {
        if (child.type === 'nested-declarations') {
            Object.assign(declarations, collectDeclarations(child.value.declarations))
            continue
        }
        if (allowNestedRules && isNestedStyleRule(child)) {
            nestedRules.push(child)
            continue
        }
        const compose = parseComposeRule(child)
        if (compose && allowCompose) {
            classNames.push(compose)
            continue
        }
        if (compose) {
            throw new Error('@compose is only allowed in @master class definitions outside @layer general')
        }
        throw new Error(allowCompose
            ? 'Class definitions only accept declarations and @compose'
            : 'Utilities only accept declarations'
        )
    }
    return {
        classNames,
        declarations,
        nestedRules
    }
}

function splitSelectorList(selectorText: string) {
    const selectors: string[] = []
    let current = ''
    let depth = 0
    let quote = ''

    for (let index = 0; index < selectorText.length; index++) {
        const char = selectorText[index]
        if (quote) {
            current += char
            if (char === '\\') {
                current += selectorText[++index] || ''
            } else if (char === quote) {
                quote = ''
            }
            continue
        }
        if (char === '"' || char === '\'') {
            quote = char
            current += char
            continue
        }
        if (char === '(' || char === '[') {
            depth++
            current += char
            continue
        }
        if (char === ')' || char === ']') {
            depth--
            current += char
            continue
        }
        if (char === ',' && depth === 0) {
            selectors.push(current.trim())
            current = ''
            continue
        }
        current += char
    }

    if (current.trim()) selectors.push(current.trim())
    return selectors
}

function combineComponentSelectors(parentSelector: string, childSelector: string) {
    const parentSelectors = splitSelectorList(parentSelector)
    const childSelectors = splitSelectorList(childSelector)
    const selectors: string[] = []

    for (const child of childSelectors) {
        for (const parent of parentSelectors) {
            selectors.push(child.includes('&')
                ? child.replace(/&/g, parent)
                : `${parent} ${child}`
            )
        }
    }

    return selectors.join(',')
}

function componentSelectorToClassSuffix(selector: string) {
    if (selector === '&') return ''
    if (!selector.startsWith('&')) return ''
    return selector.slice(1).replace(/\s+/g, '_')
}

function insertSelectorSuffix(className: string, suffix: string) {
    if (!suffix) return className
    let depth = 0
    let quote = ''
    for (let index = 0; index < className.length; index++) {
        const char = className[index]
        if (quote) {
            if (char === '\\') {
                index++
            } else if (char === quote) {
                quote = ''
            }
            continue
        }
        if (char === '"' || char === '\'') {
            quote = char
            continue
        }
        if (char === '(' || char === '[' || char === '{') {
            depth++
            continue
        }
        if (char === ')' || char === ']' || char === '}') {
            depth--
            continue
        }
        if (char === '@' && index > 0 && depth === 0) {
            return className.slice(0, index) + suffix + className.slice(index)
        }
    }
    return className + suffix
}

interface ComponentSelectorDefinition {
    name: string
    selector: string
}

const EMPTY_DECLARATION_BLOCK: DeclarationBlock<Declaration> = {
    declarations: [],
    importantDeclarations: []
}

function parseComponentDefinitionBody(
    parsed: ParsedDirectives,
    selectorDefinition: ComponentSelectorDefinition,
    items: ComponentStyleRuleBodyItem[],
    atRules: string[] = [],
    layer?: UtilityLayerName
) {
    const definitions = getParsedComponentDefinitions(parsed, selectorDefinition.name)
    const selectorSuffix = componentSelectorToClassSuffix(selectorDefinition.selector)

    for (const item of items) {
        if (item.type === 'compose') {
            const normalizedClassNames = normalizeClassNames(item.classNames)
                .map((className) => insertSelectorSuffix(className, selectorSuffix))
            definitions.push(...normalizedClassNames.map((className) => ({
                type: 'compose' as const,
                order: nextComponentOrder(parsed),
                className,
                selector: selectorDefinition.selector,
                ...(atRules.length ? { atRules: [...atRules] } : {}),
                ...(layer ? { layer } : {})
            })))
            continue
        }

        if (item.type === 'declarations') {
            if (!Object.keys(item.declarations).length) continue
            definitions.push({
                type: 'native',
                order: nextComponentOrder(parsed),
                selector: selectorDefinition.selector,
                declarations: item.declarations as PropertiesHyphen,
                ...(atRules.length ? { atRules: [...atRules] } : {}),
                ...(layer ? { layer } : {})
            })
            continue
        }

        parseNestedComponentChildRule(item.rule, parsed, selectorDefinition, atRules, layer)
    }

    if (!parsed.classNames.includes(selectorDefinition.name)) {
        parsed.classNames.push(selectorDefinition.name)
    }
}

function parseComponentRuleBody(
    rules: Rule[],
    parsed: ParsedDirectives,
    selectorDefinition: ComponentSelectorDefinition,
    atRules: string[] = [],
    layer?: UtilityLayerName
) {
    parseComponentDefinitionBody(parsed, selectorDefinition, collectComponentStyleRuleBody(EMPTY_DECLARATION_BLOCK, rules), atRules, layer)
}

function parseNestedComponentChildRule(child: Rule, parsed: ParsedDirectives, parentSelectorDefinition: ComponentSelectorDefinition, atRules: string[], layer?: UtilityLayerName) {
    const componentLayerBlock = parseComponentLayerBlock(child)
    if (componentLayerBlock) {
        if (layer) {
            throw new Error('Nested @layer blocks are not allowed in @master')
        }
        parseComponentRuleBody(componentLayerBlock.rules, parsed, parentSelectorDefinition, atRules, componentLayerBlock.layer)
        return
    }

    const masterAtRuleBlock = parseMasterAtRuleBlock(child)
    if (masterAtRuleBlock) {
        parseComponentRuleBody(masterAtRuleBlock.rules, parsed, parentSelectorDefinition, [...atRules, createMasterAtRuleReference(masterAtRuleBlock.token)], layer)
        return
    }

    const nestedAtRuleChildren = getNestedAtRuleChildren(child)
    if (nestedAtRuleChildren) {
        const atRule = formatNestedAtRule(child)
        if (!atRule) {
            throw new Error('Unsupported nested at-rule in @master')
        }
        parseComponentRuleBody(nestedAtRuleChildren, parsed, parentSelectorDefinition, [...atRules, atRule], layer)
        return
    }

    if (child.type === 'style') {
        parseComponent(child, parsed, atRules, layer, parentSelectorDefinition)
        return
    }

    throw new Error('Components only accept declarations, @compose, nested selectors, and nested at-rules')
}

function parseComponent(rule: any, parsed: ParsedDirectives, atRules: string[] = [], layer?: UtilityLayerName, parentSelectorDefinition?: ComponentSelectorDefinition) {
    const selectorDefinition = parentSelectorDefinition
        ? {
            name: parentSelectorDefinition.name,
            selector: combineComponentSelectors(parentSelectorDefinition.selector, formatSelectors(rule.value.selectors))
        }
        : parseComponentDefinitionSelector(rule.value.selectors)
    if (!selectorDefinition) {
        throw new Error('Component definition selector must start with a single class selector')
    }
    parseComponentDefinitionBody(parsed, selectorDefinition, collectComponentStyleRule(rule), atRules, layer)
}

function pushUtilityRule(definition: UtilityDefinition, declarations: Record<string, string>, atRules: string[]) {
    definition.rules ??= []
    const rules = definition.rules as ParsedUtilityRuleDefinition[]
    const existingRule = rules[rules.length - 1]
    if (existingRule && sameAtRules(existingRule.atRules, atRules)) {
        Object.assign(existingRule.declarations, declarations)
    } else {
        rules.push({
            ...(atRules.length ? { atRules: [...atRules] } : {}),
            declarations: declarations as PropertiesHyphen
        })
    }
}

function ensureUtilityRules(definition: UtilityDefinition) {
    if (!definition.declarations) return
    const declarations = definition.declarations as PropertiesHyphen
    delete definition.declarations
    const atRules = definition.atRules
    delete definition.atRules
    pushUtilityRule(definition, declarations as Record<string, string>, atRules || [])
}

function mergeUtilityDeclarations(definition: UtilityDefinition, declarations: Record<string, string>, atRules: string[]) {
    if (atRules.length || definition.rules?.length) {
        ensureUtilityRules(definition)
        pushUtilityRule(definition, declarations, atRules)
        return
    }

    definition.declarations = {
        ...(definition.declarations as PropertiesHyphen),
        ...(declarations as PropertiesHyphen)
    }
}

function parseNestedUtilityChildRule(child: Rule, parsed: ParsedDirectives, name: string, atRules: string[], layer: UtilityLayerName) {
    const masterAtRuleBlock = parseMasterAtRuleBlock(child)
    if (masterAtRuleBlock) {
        parseUtilityRuleBody(masterAtRuleBlock.rules, parsed, name, [...atRules, createMasterAtRuleReference(masterAtRuleBlock.token)], layer)
        return
    }

    const nestedAtRuleChildren = getNestedAtRuleChildren(child)
    if (nestedAtRuleChildren) {
        const atRule = formatNestedAtRule(child)
        if (!atRule) {
            throw new Error('Unsupported nested at-rule in @layer general')
        }
        parseUtilityRuleBody(nestedAtRuleChildren, parsed, name, [...atRules, atRule], layer)
        return
    }

    throw new Error('Utilities only accept declarations and nested at-rules')
}

function parseUtilityRuleBody(rules: Rule[], parsed: ParsedDirectives, name: string, atRules: string[] = [], layer: UtilityLayerName = 'general') {
    const { declarations, nestedRules } = collectStyleRuleBody(EMPTY_DECLARATION_BLOCK, rules, false, true)
    if (Object.keys(declarations).length) {
        parsed.config.utilities ??= []
        const existingDefinition = parsed.config.utilities.find((definition) =>
            definition.name === name && (definition.type ?? UtilityType.Static) === UtilityType.Static
            && (definition.layer || 'general') === layer
        )
        if (existingDefinition) {
            existingDefinition.type = UtilityType.Static
            existingDefinition.layer = layer
            mergeUtilityDeclarations(existingDefinition, declarations, atRules)
        } else {
            const definition = {
                name,
                type: UtilityType.Static,
                layer
            } satisfies UtilityDefinition
            mergeUtilityDeclarations(definition, declarations, atRules)
            parsed.config.utilities.push(definition)
        }
    }
    for (const nestedRule of nestedRules) {
        parseNestedUtilityChildRule(nestedRule, parsed, name, atRules, layer)
    }
}

function parseUtility(rule: any, parsed: ParsedDirectives, atRules: string[] = [], layer: UtilityLayerName = 'general') {
    const name = parseClassDefinitionSelector(rule.value.selectors)
    if (!name) {
        throw new Error('Utility definition selector must be a single class selector')
    }
    const { declarations, nestedRules } = collectStyleRule(rule, false, true)
    parsed.config.utilities ??= []
    const existingDefinition = parsed.config.utilities.find((definition) =>
        definition.name === name && (definition.type ?? UtilityType.Static) === UtilityType.Static
        && (definition.layer || 'general') === layer
    )
    if (existingDefinition) {
        existingDefinition.type = UtilityType.Static
        existingDefinition.layer = layer
        if (Object.keys(declarations).length) {
            mergeUtilityDeclarations(existingDefinition, declarations, atRules)
        }
    } else {
        const definition = {
            name,
            type: UtilityType.Static,
            layer
        } satisfies UtilityDefinition
        if (Object.keys(declarations).length) {
            mergeUtilityDeclarations(definition, declarations, atRules)
        }
        parsed.config.utilities.push(definition)
    }
    for (const nestedRule of nestedRules) {
        parseNestedUtilityChildRule(nestedRule, parsed, name, atRules, layer)
    }
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

function parseKeyframes(rule: any, config: Config) {
    const name = rule.value.name.value
    if (!name) {
        throw new Error('@keyframes requires a name')
    }
    const keyframes: AnimationDefinitions[string] = {}
    for (const keyframe of rule.value.keyframes) {
        const declarations = collectDeclarations(keyframe.declarations)
        for (const selector of keyframe.selectors.map(formatKeyframeSelector)) {
            keyframes[selector] = declarations as PropertiesHyphen
        }
    }
    config.animations ??= {}
    config.animations[name] = keyframes
}

function getMasterSection(rule: any): MasterSection {
    const prelude = formatPrelude(rule.prelude)
    if (!prelude) return 'root'
    throw new Error(`Unsupported @master section: ${prelude}`)
}

function warn(parsed: ParsedDirectives, options: CompileCSSOptions, message: string) {
    parsed.warnings.push(message)
    options.onWarning?.(message)
}

function parseMasterModeBlock(rule: any, parsed: ParsedDirectives, atRules: string[] = [], layer?: UtilityLayerName) {
    if ((rule.type !== 'custom' && rule.type !== 'unknown') || rule.value?.name !== 'mode') return
    if (layer || atRules.length) {
        throw new Error('@mode is only allowed directly in @master')
    }

    const mode = formatPrelude(rule.value.prelude)
    if (!mode) {
        throw new Error('@mode requires a mode name')
    }
    if (/\s/.test(mode)) {
        throw new Error('@mode requires a single mode name')
    }

    addMasterMode(parsed.config, mode)
    const rules = rule.value.body?.value
    if (!Array.isArray(rules)) {
        throw new Error('@mode requires a style block')
    }
    for (const child of rules as Rule[]) {
        if (child.type !== 'nested-declarations') {
            throw new Error(`Mode "${mode}" only accepts custom property declarations`)
        }
        parseMasterDeclarations(child.value.declarations, parsed.config, mode)
    }
    return true
}

function parseMasterStyleRule(rule: any, parsed: ParsedDirectives, options: CompileCSSOptions, section: MasterSection, atRules: string[] = [], layer?: UtilityLayerName) {
    if (parseComponentDefinitionSelector(rule.value.selectors)) {
        if ((layer || 'main') === 'general') {
            parseUtility(rule, parsed, atRules, 'general')
        } else {
            parseComponent(rule, parsed, atRules, layer)
        }
        return
    }

    const mode = parseSingleTypeSelector(rule.value.selectors)
    if (mode) {
        if (HTML_TAG_NAMES.has(mode)) {
            warn(parsed, options, `Unsupported @master block "${mode}". @master only accepts config declarations, @mode blocks, @custom-at, @custom-selector, @keyframes, @layer, and class definitions. Move regular CSS selectors outside @master.`)
            return
        }
        throw new Error(`Unsupported @master block "${mode}". Use @mode ${mode} { ... } for mode-specific variables, or @keyframes ${mode} { ... } for animations.`)
    }

    warn(parsed, options, `Unsupported @master selector "${formatSelectors(rule.value.selectors)}". @master only accepts @mode blocks, @custom-at, @custom-selector, and class definitions.`)
}

function parseComponentLayerBlock(rule: Rule) {
    if (rule.type !== 'layer-block') return
    const layerName = (rule.value.name || []).join('.')
    if (!layerName) {
        throw new Error('@layer in @master requires a layer name')
    }
    if (!UTILITY_LAYER_NAMES.has(layerName as UtilityLayerName)) {
        throw new Error(`Unsupported @master layer: ${layerName}`)
    }
    return {
        layer: layerName as UtilityLayerName,
        rules: rule.value.rules as Rule[]
    }
}

function parseMasterChildRule(child: Rule, parsed: ParsedDirectives, options: CompileCSSOptions, section: MasterSection, atRules: string[] = [], layer?: UtilityLayerName) {
    const componentLayerBlock = parseComponentLayerBlock(child)
    if (componentLayerBlock) {
        if (layer) {
            throw new Error('Nested @layer blocks are not allowed in @master')
        }
        for (const nestedChild of componentLayerBlock.rules) {
            parseMasterChildRule(nestedChild, parsed, options, section, atRules, componentLayerBlock.layer)
        }
        return
    }

    const masterAtRuleBlock = parseMasterAtRuleBlock(child)
    if (masterAtRuleBlock) {
        for (const nestedChild of masterAtRuleBlock.rules) {
            parseMasterChildRule(nestedChild, parsed, options, section, [...atRules, createMasterAtRuleReference(masterAtRuleBlock.token)], layer)
        }
        return
    }

    if (parseMasterModeBlock(child, parsed, atRules, layer)) {
        return
    }

    const nestedAtRuleChildren = getNestedAtRuleChildren(child)
    if (nestedAtRuleChildren) {
        const atRule = formatNestedAtRule(child)
        if (!atRule) {
            throw new Error(`Unsupported nested at-rule in @master ${section}`)
        }
        for (const nestedChild of nestedAtRuleChildren) {
            parseMasterChildRule(nestedChild, parsed, options, section, [...atRules, atRule], layer)
        }
        return
    }

    if (child.type === 'nested-declarations') {
        if (layer) throw new Error(`@layer ${layer} does not accept config declarations`)
        parseMasterDeclarations(child.value.declarations, parsed.config)
        return
    }
    if ((child.type === 'unknown' || child.type === 'custom') && child.value?.name === 'custom-at') {
        if (section !== 'root') {
            throw new Error('@custom-at is only allowed in @master')
        }
        parseAtDefinition(child, parsed)
        return
    }
    if ((child.type === 'unknown' || child.type === 'custom') && child.value?.name === 'custom-selector') {
        if (section !== 'root') {
            throw new Error('@custom-selector is only allowed in @master')
        }
        parseSelectorDefinition(child, parsed)
        return
    }
    if (child.type === 'keyframes') {
        if (layer) throw new Error('@keyframes is only allowed directly in @master')
        parseKeyframes(child, parsed.config)
        return
    }
    if (child.type === 'style') {
        parseMasterStyleRule(child, parsed, options, section, atRules, layer)
        return
    }
    throw new Error(`Unsupported rule in @master${section === 'root' ? '' : ' ' + section}`)
}

function parseMasterRule(rule: any, parsed: ParsedDirectives, options: CompileCSSOptions) {
    const section = getMasterSection(rule)
    for (const child of rule.body.value as Rule[]) {
        parseMasterChildRule(child, parsed, options, section)
    }
}

function validateTokenConflicts(parsed: ParsedDirectives) {
    const modes = new Set([...DEFAULT_MODE_NAMES, ...(parsed.config.modes || [])])
    const customScreens = (parsed.config.variables || [])
        .filter((variable) => variable.namespace === 'screen')
        .map((variable) => variable.key)
    const screens = new Set([...DEFAULT_SCREEN_NAMES, ...customScreens])

    for (const mode of parsed.config.modes || []) {
        if (screens.has(mode)) {
            throw new Error(`Mode "${mode}" conflicts with screen variable "--screen-${mode}"`)
        }
    }

    for (const screen of screens) {
        if (modes.has(screen)) {
            throw new Error(`Screen variable "--screen-${screen}" conflicts with mode "${screen}"`)
        }
    }

    const atTokens = parsed.config.atTokens
    if (!atTokens) return
    for (const token of Object.keys(atTokens)) {
        if (modes.has(token)) {
            throw new Error(`@custom-at "${token}" conflicts with mode "${token}"`)
        }
        if (screens.has(token)) {
            throw new Error(`@custom-at "${token}" conflicts with screen variable "--screen-${token}"`)
        }
    }
}

function warnUnsupportedMediaModes(parsed: ParsedDirectives, options: CompileCSSOptions) {
    const config = extendConfig(defaultConfig, options.config, parsed.config)
    if (config.modeTrigger !== 'media') return

    const customModes = new Set((config.modes || []).filter((mode) => !DEFAULT_MODE_NAMES.has(mode)))
    if (typeof config.defaultMode === 'string' && !DEFAULT_MODE_NAMES.has(config.defaultMode)) {
        customModes.add(config.defaultMode)
    }
    if (!customModes.size) return

    const modeList = [...customModes].map((mode) => `"${mode}"`).join(', ')
    const subject = customModes.size === 1 ? 'mode' : 'modes'
    warn(parsed, options, `Custom ${subject} ${modeList} will not work with mode-trigger: media. Browsers only support light and dark prefers-color-scheme values; use mode-trigger: class or host for custom modes.`)
}

function createComposeCSS(parsed: ParsedDirectives, options: CompileCSSOptions) {
    return createCSS(extendConfig(options.config, parsed.config))
}

function combineSelectorWrapper(selector: string, wrapper: string) {
    return wrapper.replace(/&/g, selector)
}

function resolveMasterAtRuleReference(token: string, css: ReturnType<typeof createCSS>) {
    if (css.modes.includes(token)) {
        const modeSelector = css.getModeSelector(token)
        return modeSelector
            ? { selector: `${modeSelector} &` }
            : { atRules: [`@media (prefers-color-scheme:${token})`] }
    }

    return {
        atRules: [generateAt(parseAt(token, css))]
    }
}

function resolveConfiguredAtRules(atRules: string[] | undefined, css: ReturnType<typeof createCSS>, selector = '&') {
    if (!atRules?.length) return { selector, atRules: undefined }

    const resolvedAtRules: string[] = []
    let resolvedSelector = selector

    for (const atRule of atRules) {
        const token = readMasterAtRuleReference(atRule)
        if (!token) {
            resolvedAtRules.push(atRule)
            continue
        }
        const resolved = resolveMasterAtRuleReference(token, css)
        if (resolved.selector) {
            resolvedSelector = combineSelectorWrapper(resolvedSelector, resolved.selector)
        }
        if (resolved.atRules?.length) {
            resolvedAtRules.push(...resolved.atRules)
        }
    }

    return {
        selector: resolvedSelector,
        atRules: resolvedAtRules.length ? resolvedAtRules : undefined
    }
}

function finalizeUtilityDefinitions(parsed: ParsedDirectives, options: CompileCSSOptions) {
    const utilities = parsed.config.utilities
    if (!utilities?.length) return

    const css = createCSS(extendConfig(options.config, parsed.config))

    for (const definition of utilities) {
        if (definition.atRules?.some(readMasterAtRuleReference)) {
            const resolved = resolveConfiguredAtRules(definition.atRules, css)
            delete definition.atRules
            if (definition.declarations) {
                definition.rules ??= []
                definition.rules.push({
                    declarations: definition.declarations as PropertiesHyphen,
                    ...(resolved.selector !== '&' ? { selector: resolved.selector } : {}),
                    ...(resolved.atRules?.length ? { atRules: resolved.atRules } : {})
                })
                delete definition.declarations
            }
        }

        if (!definition.rules?.length) continue
        definition.rules = definition.rules.map((rule) => {
            const resolved = resolveConfiguredAtRules(rule.atRules, css, rule.selector || '&')
            return {
                declarations: rule.declarations,
                ...(resolved.selector !== '&' ? { selector: resolved.selector } : {}),
                ...(resolved.atRules?.length ? { atRules: resolved.atRules } : {})
            }
        })
    }
}

type ComponentMergeEvent =
    | {
        type: 'compose'
        order: number
        utility: Utility
        declarations: PropertiesHyphen
    }
    | {
        type: 'native'
        order: number
        declarations: PropertiesHyphen
    }

interface ComponentMergeBucket {
    selector: string
    atRules?: string[]
    layer?: UtilityLayerName
    order: number
    events: ComponentMergeEvent[]
}

function resolveComponentSelector(selector: string, css: ReturnType<typeof createCSS>) {
    return css.config.selectorTokens
        ? resolveSelectorTokens(selector, css.config.selectorTokens)
        : selector
}

function getComponentMergeBucketKey(selector: string, atRules: string[] | undefined, layer: UtilityLayerName | undefined) {
    return JSON.stringify([layer || '', selector, atRules || []])
}

function getComponentMergeBucket(
    buckets: Map<string, ComponentMergeBucket>,
    selector: string,
    atRules: string[] | undefined,
    layer: UtilityLayerName | undefined,
    order: number
) {
    const key = getComponentMergeBucketKey(selector, atRules, layer)
    const existingBucket = buckets.get(key)
    if (existingBucket) {
        existingBucket.order = Math.min(existingBucket.order, order)
        return existingBucket
    }
    const bucket: ComponentMergeBucket = {
        selector,
        ...(atRules?.length ? { atRules } : {}),
        ...(layer ? { layer } : {}),
        order,
        events: []
    }
    buckets.set(key, bucket)
    return bucket
}

function isImportantDeclarationValue(value: unknown) {
    return String(value).trim().endsWith('!important')
}

function applyComponentDeclaration(declarations: PropertiesHyphen, propertyName: string, value: unknown) {
    const key = propertyName as keyof PropertiesHyphen
    const currentValue = declarations[key]
    if (currentValue !== undefined && isImportantDeclarationValue(currentValue) && !isImportantDeclarationValue(value)) {
        return
    }
    delete declarations[key]
    declarations[key] = value as any
}

function applyComponentDeclarations(declarations: PropertiesHyphen, incomingDeclarations: PropertiesHyphen) {
    for (const propertyName in incomingDeclarations) {
        applyComponentDeclaration(declarations, propertyName, incomingDeclarations[propertyName as keyof PropertiesHyphen])
    }
}

function createMergedComponentDefinition(bucket: ComponentMergeBucket): MergedStyleDefinition | undefined {
    const declarations: PropertiesHyphen = {}
    const composeBatch: Extract<ComponentMergeEvent, { type: 'compose' }>[] = []
    const flushComposeBatch = () => {
        composeBatch.sort((a, b) => compareRulePriority(a.utility, b.utility) || a.order - b.order)
        for (const event of composeBatch) {
            applyComponentDeclarations(declarations, event.declarations)
        }
        composeBatch.length = 0
    }

    for (const event of [...bucket.events].sort((a, b) => a.order - b.order)) {
        if (event.type === 'compose') {
            composeBatch.push(event)
            continue
        }
        flushComposeBatch()
        applyComponentDeclarations(declarations, event.declarations)
    }
    flushComposeBatch()

    if (!Object.keys(declarations).length) return
    return {
        selector: bucket.selector,
        declarations,
        ...(bucket.atRules?.length ? { atRules: bucket.atRules } : {}),
        ...(bucket.layer ? { layer: bucket.layer } : {})
    }
}

function pushComponentMergeEvent(
    buckets: Map<string, ComponentMergeBucket>,
    selector: string,
    atRules: string[] | undefined,
    layer: UtilityLayerName | undefined,
    event: ComponentMergeEvent
) {
    getComponentMergeBucket(buckets, selector, atRules, layer, event.order).events.push(event)
}

type ComponentAtRuleFeature = [string, number, number]

const COMPONENT_AT_FEATURE_REGEX = /\(\s*(width|height|resolution)\s*(>=|<=|>|<)\s*(-?(?:\d+(?:\.\d+)?|\.\d+))([a-z%]*)\s*\)/g

function normalizeComponentAtFeatureValue(value: number, unit: string, rootSize: number) {
    if (unit === 'px') return value / rootSize
    return value
}

function getComponentAtRuleFeatures(atRules: string[] | undefined, rootSize: number) {
    const featureMap = new Map<string, { min?: number, max?: number }>()
    for (const atRule of atRules || []) {
        for (const match of atRule.matchAll(COMPONENT_AT_FEATURE_REGEX)) {
            const [, name, operator, rawValue, unit] = match
            const value = normalizeComponentAtFeatureValue(Number(rawValue), unit, rootSize)
            const entry = featureMap.get(name) ?? {}
            switch (operator) {
                case '>':
                    entry.min = value + 0.02
                    break
                case '>=':
                    entry.min = value
                    break
                case '<':
                    entry.max = value - 0.02
                    break
                case '<=':
                    entry.max = value
                    break
            }
            featureMap.set(name, entry)
        }
    }
    return [...featureMap.entries()]
        .map(([name, entry]) => [
            name,
            entry.min ?? 0,
            entry.max ?? Number.MAX_SAFE_INTEGER
        ] as ComponentAtRuleFeature)
        .sort(([a], [b]) => a.localeCompare(b, undefined, { numeric: true }))
}

function compareComponentAtRuleFeatures(
    a: ComponentAtRuleFeature[],
    b: ComponentAtRuleFeature[]
) {
    const len = Math.max(a.length, b.length)
    for (let index = 0; index < len; index++) {
        const left = a[index]
        const right = b[index]
        if (!left) return -1
        if (!right) return 1
        const [nameA, minA, maxA] = left
        const [nameB, minB, maxB] = right
        const nameCompare = nameA.localeCompare(nameB, undefined, { numeric: true })
        if (nameCompare !== 0) return nameCompare
        const rangeA = maxA - minA
        const rangeB = maxB - minB
        if (rangeA !== rangeB) return rangeB - rangeA
        if (minA !== minB) return minB - minA
        if (maxA !== maxB) return maxB - maxA
    }
    return 0
}

function compareComponentMergeBuckets(a: ComponentMergeBucket, b: ComponentMergeBucket, rootSize: number) {
    const layerA = a.layer || 'main'
    const layerB = b.layer || 'main'
    if (layerA === layerB && a.selector === b.selector) {
        const atRuleStateA = a.atRules?.length ? 1 : 0
        const atRuleStateB = b.atRules?.length ? 1 : 0
        if (atRuleStateA !== atRuleStateB) return atRuleStateA - atRuleStateB
        if (atRuleStateA && atRuleStateB) {
            const featuresA = getComponentAtRuleFeatures(a.atRules, rootSize)
            const featuresB = getComponentAtRuleFeatures(b.atRules, rootSize)
            if (featuresA.length && featuresB.length) {
                const featureCompare = compareComponentAtRuleFeatures(featuresA, featuresB)
                if (featureCompare !== 0) return featureCompare
            }
        }
    }
    return a.order - b.order
}

function getStaticUtilityDefinition(parsed: ParsedDirectives, name: string, layer: UtilityLayerName) {
    parsed.config.utilities ??= []
    const existingDefinition = parsed.config.utilities.find((definition) =>
        definition.name === name
        && (definition.type ?? UtilityType.Static) === UtilityType.Static
        && (definition.layer || 'general') === layer
    )
    if (existingDefinition) {
        existingDefinition.type = UtilityType.Static
        existingDefinition.layer = layer
        return existingDefinition
    }
    const definition = {
        name,
        type: UtilityType.Static,
        layer
    } satisfies UtilityDefinition
    parsed.config.utilities.push(definition)
    return definition
}

function pushStaticUtilityStyleRule(definition: UtilityDefinition, styleDefinition: MergedStyleDefinition) {
    const rule = {
        declarations: styleDefinition.declarations,
        ...(styleDefinition.selector !== '&' ? { selector: styleDefinition.selector } : {}),
        ...(styleDefinition.atRules?.length ? { atRules: styleDefinition.atRules } : {})
    } satisfies UtilityRuleDefinition
    if (!definition.declarations && !definition.rules?.length && !rule.selector && !rule.atRules?.length) {
        definition.declarations = rule.declarations
        return
    }
    ensureUtilityRules(definition)
    definition.rules ??= []
    definition.rules.push(rule)
}

function finalizeComponentDefinitions(parsed: ParsedDirectives, options: CompileCSSOptions) {
    if (!parsed.componentDefinitions) return
    const css = createComposeCSS(parsed, options)
    for (const name in parsed.componentDefinitions) {
        const buckets = new Map<string, ComponentMergeBucket>()
        for (const definition of parsed.componentDefinitions[name]) {
            if (definition.type === 'compose') {
                const composedDefinitions = createComponentDefinitionsFromCompose(definition.className, css)
                for (const composedDefinition of composedDefinitions) {
                    const { atRules: _composedAtRules, ...composedDefinitionWithoutAtRules } = composedDefinition
                    const resolved = resolveConfiguredAtRules([
                        ...(definition.atRules || []),
                        ...(_composedAtRules || [])
                    ], css, composedDefinition.selector)
                    pushComponentMergeEvent(buckets, resolveComponentSelector(resolved.selector, css), resolved.atRules, definition.layer || composedDefinitionWithoutAtRules.layer, {
                        type: 'compose',
                        order: definition.order,
                        utility: composedDefinitionWithoutAtRules.utility,
                        declarations: composedDefinitionWithoutAtRules.declarations as PropertiesHyphen
                    })
                }
            } else {
                const resolved = resolveConfiguredAtRules(definition.atRules, css, definition.selector)
                pushComponentMergeEvent(buckets, resolveComponentSelector(resolved.selector, css), resolved.atRules, definition.layer, {
                    type: 'native',
                    order: definition.order,
                    declarations: definition.declarations
                })
            }
        }
        const rootSize = css.config.rootSize || defaultConfig.rootSize || 16
        const definitions = [...buckets.values()]
            .sort((a, b) => compareComponentMergeBuckets(a, b, rootSize))
            .flatMap((bucket) => {
                const definition = createMergedComponentDefinition(bucket)
                return definition ? [definition] : []
            })
        for (const definition of definitions) {
            const layer = definition.layer || 'main'
            const utilityDefinition = getStaticUtilityDefinition(parsed, name, layer)
            pushStaticUtilityStyleRule(utilityDefinition, definition)
        }
    }
}

function findMatchingBrace(source: string, openIndex: number) {
    let depth = 0
    let quote = ''
    let comment = false
    for (let index = openIndex; index < source.length; index++) {
        const char = source[index]
        const next = source[index + 1]
        if (comment) {
            if (char === '*' && next === '/') {
                comment = false
                index++
            }
            continue
        }
        if (quote) {
            if (char === '\\') {
                index++
            } else if (char === quote) {
                quote = ''
            }
            continue
        }
        if (char === '/' && next === '*') {
            comment = true
            index++
            continue
        }
        if (char === '"' || char === '\'') {
            quote = char
            continue
        }
        if (char === '{') {
            depth++
            continue
        }
        if (char === '}') {
            depth--
            if (depth === 0) return index
        }
    }
    return -1
}

function convertMasterFlags(body: string) {
    let output = ''
    let statementStart = 0
    let depth = 0
    let quote = ''
    let comment = false

    const flush = (endIndex: number) => {
        const statement = body.slice(statementStart, endIndex)
        const match = /^(\s*)(!?important)(\s*;)(\s*)$/.exec(statement)
        output += match
            ? `${match[1]}important: ${IMPORTANT_FLAG_VALUE};${match[4]}`
            : statement
        statementStart = endIndex
    }

    for (let index = 0; index < body.length; index++) {
        const char = body[index]
        const next = body[index + 1]
        if (comment) {
            if (char === '*' && next === '/') {
                comment = false
                index++
            }
            continue
        }
        if (quote) {
            if (char === '\\') {
                index++
            } else if (char === quote) {
                quote = ''
            }
            continue
        }
        if (char === '/' && next === '*') {
            comment = true
            index++
            continue
        }
        if (char === '"' || char === '\'') {
            quote = char
            continue
        }
        if (char === '{') {
            depth++
            continue
        }
        if (char === '}') {
            depth--
            if (depth === 0) {
                flush(index + 1)
            }
            continue
        }
        if (char === ';' && depth === 0) {
            flush(index + 1)
        }
    }

    output += body.slice(statementStart)
    return output
}

function preprocessMasterFlags(source: string) {
    let output = ''
    let index = 0
    const pattern = /@master\s*\{/g
    let match: RegExpExecArray | null
    while ((match = pattern.exec(source))) {
        const openIndex = match.index + match[0].length - 1
        const closeIndex = findMatchingBrace(source, openIndex)
        if (closeIndex === -1) break
        const body = source.slice(openIndex + 1, closeIndex)
        output += source.slice(index, openIndex + 1) + convertMasterFlags(body)
        index = closeIndex
        pattern.lastIndex = closeIndex + 1
    }
    return output + source.slice(index)
}

function isIdentChar(char: string | undefined) {
    return Boolean(char && /[-_a-zA-Z0-9]/.test(char))
}

function findStandaloneMasterDirectiveEnd(source: string, start: number) {
    let quote = ''
    let comment = false
    for (let index = start; index < source.length; index++) {
        const char = source[index]
        const next = source[index + 1]
        if (comment) {
            if (char === '*' && next === '/') {
                comment = false
                index++
            }
            continue
        }
        if (quote) {
            if (char === '\\') {
                index++
            } else if (char === quote) {
                quote = ''
            }
            continue
        }
        if (char === '/' && next === '*') {
            comment = true
            index++
            continue
        }
        if (char === '"' || char === '\'') {
            quote = char
            continue
        }
        if (char === ';') return index + 1
        if (char === '{') return -1
    }
    return -1
}

function removeStandaloneMasterDirectives(source: string) {
    let output = ''
    let offset = 0
    let quote = ''
    let comment = false
    let depth = 0
    for (let index = 0; index < source.length; index++) {
        const char = source[index]
        const next = source[index + 1]
        if (comment) {
            if (char === '*' && next === '/') {
                comment = false
                index++
            }
            continue
        }
        if (quote) {
            if (char === '\\') {
                index++
            } else if (char === quote) {
                quote = ''
            }
            continue
        }
        if (char === '/' && next === '*') {
            comment = true
            index++
            continue
        }
        if (char === '"' || char === '\'') {
            quote = char
            continue
        }
        if (char === '{') {
            depth++
            continue
        }
        if (char === '}') {
            depth--
            continue
        }
        if (depth !== 0 || !source.startsWith('@master', index)) continue

        let cursor = index + '@master'.length
        if (isIdentChar(source[cursor]) || !/\s/.test(source[cursor] || '')) continue
        while (/\s/.test(source[cursor] || '')) cursor++
        const nameStart = cursor
        while (isIdentChar(source[cursor])) cursor++
        const name = source.slice(nameStart, cursor)
        if (!STANDALONE_MASTER_DIRECTIVE_NAMES.has(name)) continue
        const end = findStandaloneMasterDirectiveEnd(source, cursor)
        if (end === -1) continue
        output += source.slice(offset, index)
        offset = end
        index = end - 1
    }
    return offset ? output + source.slice(offset) : source
}

function convertBareAnimations(body: string) {
    let output = ''
    let index = 0
    while (index < body.length) {
        const rest = body.slice(index)
        const leading = /^\s+/.exec(rest)?.[0]
        if (leading) {
            output += leading
            index += leading.length
            continue
        }
        if (rest.startsWith('@keyframes')) {
            const openIndex = body.indexOf('{', index)
            if (openIndex === -1) break
            const closeIndex = findMatchingBrace(body, openIndex)
            if (closeIndex === -1) break
            output += body.slice(index, closeIndex + 1)
            index = closeIndex + 1
            continue
        }
        const identifier = /^-?[_a-zA-Z][-_a-zA-Z0-9]*/.exec(rest)?.[0]
        if (identifier) {
            const afterIdentifier = index + identifier.length
            const whitespace = /^\s*/.exec(body.slice(afterIdentifier))?.[0] || ''
            const openIndex = afterIdentifier + whitespace.length
            if (body[openIndex] === '{') {
                const closeIndex = findMatchingBrace(body, openIndex)
                if (closeIndex === -1) break
                output += `@keyframes ${identifier}${whitespace}${body.slice(openIndex, closeIndex + 1)}`
                index = closeIndex + 1
                continue
            }
        }
        output += body[index]
        index++
    }
    return output + body.slice(index)
}

function preprocessMasterAnimations(source: string) {
    let output = ''
    let index = 0
    const pattern = /@master\s+animations\s*\{/g
    let match: RegExpExecArray | null
    while ((match = pattern.exec(source))) {
        const openIndex = match.index + match[0].length - 1
        const closeIndex = findMatchingBrace(source, openIndex)
        if (closeIndex === -1) break
        const body = source.slice(openIndex + 1, closeIndex)
        output += source.slice(index, openIndex + 1) + convertBareAnimations(body)
        index = closeIndex
        pattern.lastIndex = closeIndex + 1
    }
    return output + source.slice(index)
}

function createDirectiveCSS(parsed: ParsedDirectives, options: CompileCSSOptions) {
    const css = createCSS(extendConfig(options.config, parsed.config))
    const classes = options.classes || []
    for (const className of classes) {
        css.add(className)
    }
    return css
}

export function compileCSS(source: string, options: CompileCSSOptions = {}): CompileCSSResult {
    const parsed: ParsedDirectives = {
        config: {},
        classNames: [],
        nativeClassNames: [],
        warnings: []
    }
    const classFilter = options.classes === undefined
        ? undefined
        : new Set(options.classes)
    const preprocessedSource = preprocessMasterFlags(removeStandaloneMasterDirectives(source))
    const transformed = getCSSTransform()({
        filename: options.from || 'master.css',
        code: encodeCSS(preprocessedSource),
        customAtRules: MASTER_CUSTOM_AT_RULES,
        visitor: {
            Rule: {
                custom: {
                    master(rule) {
                        parseMasterRule(rule, parsed, options)
                        return []
                    },
                    compose() {
                        throw new Error('@compose is only allowed in @master class definitions outside @layer general')
                    },
                    'custom-at'() {
                        throw new Error('@custom-at is only allowed in @master')
                    },
                    'custom-selector'() {
                        throw new Error('@custom-selector is only allowed in @master')
                    },
                    at() {
                        throw new Error('@at is only allowed in @master class definitions')
                    },
                    mode() {
                        throw new Error('@mode is only allowed in @master')
                    }
                }
            }
        }
    })
    validateTokenConflicts(parsed)
    warnUnsupportedMediaModes(parsed, options)
    finalizeUtilityDefinitions(parsed, options)
    finalizeComponentDefinitions(parsed, options)
    const css = createDirectiveCSS(parsed, options)
    const generatedCSS = options.classes?.length ? css.text : ''
    let remainingCSS = ''
    if (options.preserveNativeCSS !== false) {
        const filteredCode = filterNativeCSS(transformed.code, options.from || 'master.css', parsed, classFilter)
        const remainingCode = classFilter
            ? pruneEmptyRuleBlocks(filteredCode, options.from || 'master.css')
            : filteredCode
        remainingCSS = decodeCSS(remainingCode).trim()
    }

    return {
        config: parsed.config,
        classNames: parsed.classNames,
        nativeClassNames: parsed.nativeClassNames,
        warnings: parsed.warnings,
        nativeCSS: remainingCSS,
        css: [remainingCSS, generatedCSS].filter(Boolean).join('\n\n'),
        generatedCSS,
        dependencies: []
    }
}

export function parseDirectives(source: string, options: CompileCSSOptions = {}) {
    const { config, classNames, nativeClassNames, warnings } = compileCSS(source, options)
    return {
        config,
        classNames,
        nativeClassNames,
        warnings
    }
}
