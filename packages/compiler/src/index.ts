import { existsSync, readFileSync } from 'node:fs'
import { dirname, extname, isAbsolute, resolve } from 'node:path'
import { config as defaultConfig, createCSS, screens as defaultScreens, UtilityType } from '@master/css'
import { transform } from 'lightningcss'
import type { PropertiesHyphen } from 'csstype'
import type {
    AnimationDefinitions,
    Config,
    UtilityDefinition,
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
import unquote from './utils/unquote'
import resolveVariableNamespace from './utils/variable-namespace'

export interface CompileCSSOptions {
    config?: Parameters<typeof createCSS>[0]
    classes?: string[]
    from?: string
    onWarning?: (warning: string) => void
}

export interface CompileCSSFileOptions extends CompileCSSOptions {
    root?: string
}

export interface CompileCSSResult {
    config: Config
    componentNames: string[]
    css: string
    generatedCSS: string
    warnings: string[]
    dependencies: string[]
}

export interface ResolvedCSSImportGraph {
    source: string
    dependencies: string[]
}

export type ParsedDirectives = Pick<CompileCSSResult, 'config' | 'componentNames' | 'warnings'>

const MASTER_CUSTOM_AT_RULES = {
    master: {
        prelude: '*',
        body: 'style-block'
    },
    at: {
        prelude: '*',
        body: null
    },
    selector: {
        prelude: '*',
        body: null
    },
    compose: {
        prelude: '<string>',
        body: null
    }
} satisfies CustomAtRules

type MasterSection = 'root' | 'components' | 'utilities' | 'animations'

const DEFAULT_MODE_NAMES = new Set(defaultConfig.modes || [])
const DEFAULT_SCREEN_NAMES = new Set(Object.keys(defaultScreens))
const IMPORTANT_FLAG_VALUE = '__master_important__'

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
    const output = transform({
        filename: 'master-css-declaration.css',
        code: Buffer.from('.x{}'),
        visitor: {
            Rule: {
                style(rule) {
                    rule.value.declarations.declarations = [declaration]
                    return rule
                }
            }
        }
    }).code.toString()

    const bodyStart = output.indexOf('{')
    const bodyEnd = output.lastIndexOf('}')
    const body = output.slice(bodyStart + 1, bodyEnd).trim()
    return body.replace(/;$/, '').trim()
}

function formatSelectors(selectors: Selector[]) {
    const output = transform({
        filename: 'master-css-selector.css',
        code: Buffer.from('.x{color:red}'),
        minify: true,
        visitor: {
            Rule: {
                style(rule) {
                    rule.value.selectors = selectors
                    return rule
                }
            }
        }
    }).code.toString()

    return output.slice(0, output.indexOf('{')).trim()
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
        throw new Error('@at requires a token name and at-rule value')
    }

    const [, token, value] = match
    if (token.startsWith('@')) {
        throw new Error(`@at names must not start with "@": ${token}`)
    }
    if (token.startsWith(':')) {
        throw new Error(`@at names cannot be selector tokens: ${token}`)
    }
    if (!value.trim().startsWith('@')) {
        throw new Error(`@at "${token}" must use an explicit at-rule value`)
    }
    parsed.config.atTokens ??= {}
    parsed.config.atTokens[token] = normalizeAtValue(value)
}

function parseSelectorDefinition(rule: any, parsed: ParsedDirectives) {
    const match = /^(\S+)\s+(.+)$/.exec(formatPrelude(rule.value.prelude))
    if (!match) {
        throw new Error('@selector requires a selector token name and selector value')
    }

    const [, token, value] = match
    if (!token.startsWith(':')) {
        throw new Error(`@selector names must start with ":" or "::": ${token}`)
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

function collectStyleRule(rule: any, allowCompose: boolean) {
    const classNames: string[] = []
    const declarations = collectDeclarations(rule.value.declarations)
    for (const child of rule.value.rules) {
        if (child.type === 'nested-declarations') {
            Object.assign(declarations, collectDeclarations(child.value.declarations))
            continue
        }
        const compose = parseComposeRule(child)
        if (compose && allowCompose) {
            classNames.push(compose)
            continue
        }
        if (compose) {
            throw new Error('@compose is only allowed in @master components')
        }
        throw new Error(allowCompose
            ? 'Components only accept declarations and @compose'
            : 'Utilities only accept declarations'
        )
    }
    return {
        classNames,
        declarations
    }
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

function parseComponent(rule: any, parsed: ParsedDirectives) {
    const selectorDefinition = parseComponentDefinitionSelector(rule.value.selectors)
    if (!selectorDefinition) {
        throw new Error('Component definition selector must start with a single class selector')
    }
    const { classNames, declarations } = collectStyleRule(rule, true)
    const selectorSuffix = componentSelectorToClassSuffix(selectorDefinition.selector)
    const normalizedClassNames = normalizeClassNames(classNames)
        .map((className) => insertSelectorSuffix(className, selectorSuffix))
    parsed.config.components ??= {}
    parsed.config.components[selectorDefinition.name] ??= []
    const definitions = parsed.config.components[selectorDefinition.name]
    const firstSelectorDefinitionIndex = definitions.findIndex((definition) => typeof definition !== 'string')
    if (firstSelectorDefinitionIndex === -1) {
        definitions.push(...normalizedClassNames)
    } else {
        definitions.splice(firstSelectorDefinitionIndex, 0, ...normalizedClassNames)
    }
    if (Object.keys(declarations).length) {
        const existingDefinition = definitions.find((definition) =>
            typeof definition !== 'string' && definition.selector === selectorDefinition.selector
        )
        if (typeof existingDefinition !== 'string' && existingDefinition) {
            Object.assign(existingDefinition.declarations, declarations)
        } else {
            definitions.push({
                selector: selectorDefinition.selector,
                declarations: declarations as PropertiesHyphen
            })
        }
    }
    if (!parsed.componentNames.includes(selectorDefinition.name)) {
        parsed.componentNames.push(selectorDefinition.name)
    }
}

function parseUtility(rule: any, parsed: ParsedDirectives) {
    const name = parseClassDefinitionSelector(rule.value.selectors)
    if (!name) {
        throw new Error('Utility definition selector must be a single class selector')
    }
    const { declarations } = collectStyleRule(rule, false)
    parsed.config.utilities ??= []
    const existingDefinition = parsed.config.utilities.find((definition) =>
        definition.name === name && (definition.type ?? UtilityType.Static) === UtilityType.Static
    )
    if (existingDefinition) {
        existingDefinition.type = UtilityType.Static
        existingDefinition.declarations = {
            ...(existingDefinition.declarations as PropertiesHyphen),
            ...(declarations as PropertiesHyphen)
        }
        return
    }
    parsed.config.utilities.push({
        name,
        type: UtilityType.Static,
        declarations: declarations as PropertiesHyphen
    } satisfies UtilityDefinition)
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
    if (prelude === 'components' || prelude === 'utilities' || prelude === 'animations') return prelude
    throw new Error(`Unsupported @master section: ${prelude}`)
}

function warn(parsed: ParsedDirectives, options: CompileCSSOptions, message: string) {
    parsed.warnings.push(message)
    options.onWarning?.(message)
}

function parseModeBlock(rule: any, mode: string, parsed: ParsedDirectives) {
    addMasterMode(parsed.config, mode)
    parseMasterDeclarations(rule.value.declarations, parsed.config, mode)
    if (rule.value.rules.length) {
        throw new Error(`Mode "${mode}" only accepts custom property declarations`)
    }
}

function parseMasterStyleRule(rule: any, parsed: ParsedDirectives, options: CompileCSSOptions, section: MasterSection) {
    if (section === 'utilities') {
        parseUtility(rule, parsed)
        return
    }
    if (section === 'components') {
        parseComponent(rule, parsed)
        return
    }
    if (section === 'animations') {
        throw new Error('@master animations only accepts animation blocks and @keyframes')
    }

    if (parseComponentDefinitionSelector(rule.value.selectors)) {
        warn(parsed, options, `Component definitions must be placed in @master components: ${formatSelectors(rule.value.selectors)}`)
        return
    }

    const mode = parseSingleTypeSelector(rule.value.selectors)
    if (mode) {
        if (HTML_TAG_NAMES.has(mode)) {
            warn(parsed, options, `Unsupported @master block "${mode}". @master only accepts config declarations, mode variable blocks, @at, and @selector. Move regular CSS selectors outside @master.`)
            return
        }
        parseModeBlock(rule, mode, parsed)
        return
    }

    warn(parsed, options, `Unsupported @master selector "${formatSelectors(rule.value.selectors)}". @master only accepts mode variable blocks, @at, and @selector.`)
}

function parseMasterRule(rule: any, parsed: ParsedDirectives, options: CompileCSSOptions) {
    const section = getMasterSection(rule)
    for (const child of rule.body.value as Rule[]) {
        if (child.type === 'nested-declarations') {
            if (section !== 'root') {
                throw new Error(`@master ${section} does not accept config declarations`)
            }
            parseMasterDeclarations(child.value.declarations, parsed.config)
            continue
        }
        if ((child.type === 'unknown' || child.type === 'custom') && child.value?.name === 'at') {
            if (section !== 'root') {
                throw new Error('@at is only allowed in @master')
            }
            parseAtDefinition(child, parsed)
            continue
        }
        if ((child.type === 'unknown' || child.type === 'custom') && child.value?.name === 'selector') {
            if (section !== 'root') {
                throw new Error('@selector is only allowed in @master')
            }
            parseSelectorDefinition(child, parsed)
            continue
        }
        if (child.type === 'keyframes') {
            if (section !== 'animations') {
                throw new Error('@keyframes is only allowed in @master animations')
            }
            parseKeyframes(child, parsed.config)
            continue
        }
        if (child.type === 'style') {
            parseMasterStyleRule(child, parsed, options, section)
            continue
        }
        throw new Error(`Unsupported rule in @master${section === 'root' ? '' : ' ' + section}`)
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
            throw new Error(`@at "${token}" conflicts with mode "${token}"`)
        }
        if (screens.has(token)) {
            throw new Error(`@at "${token}" conflicts with screen variable "--screen-${token}"`)
        }
    }
}

function resolveComponentSelectorTokens(parsed: ParsedDirectives) {
    const selectorTokens = parsed.config.selectorTokens
    const components = parsed.config.components
    if (!selectorTokens || !components) return
    for (const name in components) {
        components[name] = components[name].map((definition) => {
            if (typeof definition === 'string') return definition
            let selector = definition.selector
            for (const token of Object.keys(selectorTokens).sort((a, b) => b.length - a.length)) {
                selector = selector.split(token).join(selectorTokens[token])
            }
            return {
                ...definition,
                selector
            }
        })
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

function findImportEnd(source: string, startIndex: number) {
    let quote = ''
    let comment = false
    let depth = 0
    for (let index = startIndex; index < source.length; index++) {
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
        if (char === '(') {
            depth++
            continue
        }
        if (char === ')') {
            depth--
            continue
        }
        if (char === ';' && depth === 0) return index + 1
    }
    return -1
}

function parseImportSource(statement: string) {
    const match = /^\s*@import\s+(?:(["'])(.*?)\1|url\(\s*(?:(["'])(.*?)\3|([^'")\s]+))\s*\))\s*;\s*$/s.exec(statement)
    return match?.[2] || match?.[4] || match?.[5]
}

function isExpandableImportSource(source: string) {
    return (source.startsWith('./') || source.startsWith('../')) && extname(source) === '.css'
}

function findImportStatements(source: string) {
    const imports: { start: number, end: number, statement: string }[] = []
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
        if (depth === 0 && source.startsWith('@import', index) && /\s/.test(source[index + '@import'.length] || '')) {
            const end = findImportEnd(source, index)
            if (end === -1) continue
            imports.push({
                start: index,
                end,
                statement: source.slice(index, end)
            })
            index = end - 1
        }
    }
    return imports
}

function resolveCSSImportGraphFile(file: string, dependencies: string[], dependencySet: Set<string>, stack: string[]) {
    const absoluteFile = resolve(file)
    if (stack.includes(absoluteFile)) {
        throw new Error(`Circular CSS import: ${[...stack, absoluteFile].join(' -> ')}`)
    }
    if (!existsSync(absoluteFile)) {
        throw new Error(`CSS config file not found: ${absoluteFile}`)
    }
    if (!dependencySet.has(absoluteFile)) {
        dependencySet.add(absoluteFile)
        dependencies.push(absoluteFile)
    }

    const source = readFileSync(absoluteFile, 'utf-8')
    const imports = findImportStatements(source)
    if (!imports.length) return source

    let output = ''
    let index = 0
    for (const importStatement of imports) {
        output += source.slice(index, importStatement.start)
        const importSource = parseImportSource(importStatement.statement)
        if (importSource && isExpandableImportSource(importSource)) {
            const importedFile = resolve(dirname(absoluteFile), importSource)
            output += resolveCSSImportGraphFile(importedFile, dependencies, dependencySet, [...stack, absoluteFile])
        } else {
            output += importStatement.statement
        }
        index = importStatement.end
    }
    return output + source.slice(index)
}

export function resolveCSSImportGraph(file: string): ResolvedCSSImportGraph {
    const dependencies: string[] = []
    const source = resolveCSSImportGraphFile(file, dependencies, new Set(), [])
    return {
        source,
        dependencies
    }
}

function createDirectiveCSS(parsed: ParsedDirectives, options: CompileCSSOptions) {
    const css = createCSS(options.config
        ? { extends: [options.config, parsed.config] }
        : parsed.config
    )
    const classes = options.classes || []
    for (const className of classes) {
        css.add(className)
    }
    return css
}

export function compileCSS(source: string, options: CompileCSSOptions = {}): CompileCSSResult {
    const parsed: ParsedDirectives = {
        config: {},
        componentNames: [],
        warnings: []
    }
    const preprocessedSource = preprocessMasterAnimations(preprocessMasterFlags(source))
    const transformed = transform({
        filename: options.from || 'master.css',
        code: Buffer.from(preprocessedSource),
        customAtRules: MASTER_CUSTOM_AT_RULES,
        visitor: {
            Rule: {
                custom: {
                    master(rule) {
                        parseMasterRule(rule, parsed, options)
                        return []
                    },
                    compose() {
                        throw new Error('@compose is only allowed in @master components')
                    },
                    at() {
                        throw new Error('@at is only allowed in @master')
                    },
                    selector() {
                        throw new Error('@selector is only allowed in @master')
                    }
                }
            }
        }
    })
    validateTokenConflicts(parsed)
    resolveComponentSelectorTokens(parsed)
    const css = createDirectiveCSS(parsed, options)
    const generatedCSS = options.classes?.length ? css.text : ''
    const remainingCSS = transformed.code.toString().trim()

    return {
        ...parsed,
        css: [remainingCSS, generatedCSS].filter(Boolean).join('\n\n'),
        generatedCSS,
        dependencies: []
    }
}

export function compileCSSFile(file: string, options: CompileCSSFileOptions = {}): CompileCSSResult {
    const { root, ...compileOptions } = options
    const absoluteFile = isAbsolute(file) ? file : resolve(root || '', file)
    const graph = resolveCSSImportGraph(absoluteFile)
    const result = compileCSS(graph.source, {
        ...compileOptions,
        from: absoluteFile
    })
    return {
        ...result,
        dependencies: graph.dependencies
    }
}

export function parseDirectives(source: string, options: CompileCSSOptions = {}) {
    const { config, componentNames, warnings } = compileCSS(source, options)
    return {
        config,
        componentNames,
        warnings
    }
}
