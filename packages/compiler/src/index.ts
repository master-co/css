import { createCSS, SyntaxRuleType } from '@master/css'
import { transform } from 'lightningcss'
import type { PropertiesHyphen } from 'csstype'
import type {
    AnimationDefinitions,
    Config,
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
}

export interface CompileCSSResult {
    config: Config
    componentNames: string[]
    css: string
    generatedCSS: string
}

export type ParsedDirectives = Pick<CompileCSSResult, 'config' | 'componentNames'>

const MASTER_CUSTOM_AT_RULES = {
    master: {
        body: 'declaration-list'
    },
    mode: {
        prelude: '<custom-ident>',
        body: 'declaration-list'
    },
    apply: {
        prelude: '<string>',
        body: null
    }
} satisfies CustomAtRules

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

function parseVariableValue(value: string): VariableValue {
    const trimmed = value.trim()
    const numberValue = parseNumber(trimmed)
    return numberValue === undefined ? trimmed : numberValue
}

function defineMasterVariable(config: Config, property: string, rawValue: string, mode?: string) {
    const variable = resolveVariableNamespace(property)
    const value = parseVariableValue(rawValue)
    if (mode && variable.namespace === 'screen') {
        throw new Error(`Screen variables cannot be mode-specific: screen-${variable.key}@${mode}`)
    }
    if (mode) {
        config.modes ??= []
        if (!config.modes.includes(mode)) config.modes.push(mode)
    }
    config.variables ??= []
    config.variables.push({
        ...(variable.namespace ? { namespace: variable.namespace } : {}),
        key: variable.key,
        value,
        ...(mode ? { mode } : {})
    })
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
            const important = parseBoolean(value)
            if (important === undefined) throw new Error('important must be true or false')
            config.important = important
            return true
        }
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

function parseMaster(rule: any, config: Config) {
    for (const declaration of rule.body.value.declarations as Declaration[]) {
        const property = getDeclarationName(declaration)
        const value = formatDeclarationValue(declaration)
        if (property.startsWith('--')) {
            defineMasterVariable(config, property, value)
            continue
        }
        if (!parseMasterOption(config, property, value)) {
            throw new Error(`Unsupported @master option: ${property}`)
        }
    }
}

function parseMode(rule: any, config: Config) {
    const mode = rule.prelude?.value
    if (!mode) {
        throw new Error('@mode requires a mode name')
    }
    for (const declaration of rule.body.value.declarations as Declaration[]) {
        const property = getDeclarationName(declaration)
        if (!property.startsWith('--')) {
            throw new Error('@mode only accepts custom property declarations')
        }
        defineMasterVariable(config, property, formatDeclarationValue(declaration), mode)
    }
}

function normalizeAtValue(value: string) {
    const rawAtRule = /^@(media|supports|container|layer)\s*(.*)$/.exec(value.trim())
    if (!rawAtRule) return value
    return rawAtRule[1] + rawAtRule[2].trim().replace(/\s*:\s*/g, ':')
}

function parseAtDefinition(rule: any, config: Config) {
    const match = /^(\S+)\s+(.+)$/.exec(formatTokenOrValues(rule.prelude).trim())
    if (!match) {
        throw new Error('@at requires a name and at-rule value')
    }
    config.atRuleAliases ??= {}
    config.atRuleAliases[match[1]] = normalizeAtValue(match[2])
}

function parseSelectorDefinition(rule: any, config: Config) {
    const match = /^(\S+)\s+(.+)$/.exec(formatTokenOrValues(rule.prelude).trim())
    if (!match) {
        throw new Error('@selector requires a name and selector value')
    }
    config.selectorAliases ??= {}
    config.selectorAliases[match[1]] = match[2]
}

function parseClassDefinitionSelector(selectors: Selector[]) {
    if (selectors.length !== 1) return
    const selector = selectors[0]
    if (selector.length !== 1) return
    const selectorComponent = selector[0]
    if (selectorComponent.type !== 'class') return
    return selectorComponent.name
}

function parseApplyRule(rule: any) {
    if (rule.type === 'custom' && rule.value.name === 'apply') {
        return unquote(rule.value.prelude.value)
    }
}

function collectStyleRuleDeclarations(rule: any) {
    const declarations = collectDeclarations(rule.value.declarations)
    for (const child of rule.value.rules) {
        if (child.type === 'nested-declarations') {
            Object.assign(declarations, collectDeclarations(child.value.declarations))
            continue
        }
        if (parseApplyRule(child)) {
            continue
        }
        throw new Error('Definitions only accept declarations and @apply in components')
    }
    return declarations
}

function parseComponent(rule: any, parsed: ParsedDirectives) {
    const name = parseClassDefinitionSelector(rule.value.selectors)
    if (!name) {
        throw new Error('Component definition selector must be a single class selector')
    }
    const classNames: string[] = []
    for (const child of rule.value.rules) {
        const apply = parseApplyRule(child)
        if (apply) {
            classNames.push(apply)
        } else if (child.type !== 'nested-declarations') {
            throw new Error('Components only accept declarations and @apply')
        }
    }
    const declarations = collectStyleRuleDeclarations(rule)
    parsed.config.components ??= {}
    parsed.config.components[name] = [
        ...normalizeClassNames(classNames),
        ...(Object.keys(declarations).length
            ? [{ selector: '&', declarations: declarations as PropertiesHyphen }]
            : [])
    ]
    parsed.componentNames.push(name)
}

function parseUtilityRule(rule: any, config: Config) {
    const name = parseClassDefinitionSelector(rule.value.selectors)
    if (!name) {
        throw new Error('Utility definition selector must be a single class selector')
    }
    for (const child of rule.value.rules) {
        if (child.type !== 'nested-declarations') {
            throw new Error('Utilities only accept declarations')
        }
    }
    config.rules ??= []
    config.rules.push({
        name,
        type: SyntaxRuleType.Utility,
        declarations: collectStyleRuleDeclarations(rule) as PropertiesHyphen
    })
}

function parseLayerBlock(rule: any, parsed: ParsedDirectives) {
    const layerName = rule.value.name?.length === 1 ? rule.value.name[0] : undefined
    if (layerName !== 'components' && layerName !== 'utilities') return
    for (const child of rule.value.rules as Rule[]) {
        if (child.type !== 'style') {
            throw new Error(`@layer ${layerName} only accepts class definition rules`)
        }
        if (layerName === 'components') {
            parseComponent(child, parsed)
        } else {
            parseUtilityRule(child, parsed.config)
        }
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

function createDirectiveCSS(parsed: ParsedDirectives, options: CompileCSSOptions) {
    const css = createCSS(options.config
        ? { extends: [options.config, parsed.config] }
        : parsed.config
    )
    const classes = [...parsed.componentNames, ...(options.classes || [])]
    for (const className of classes) {
        css.add(className)
    }
    return css
}

export function compileCSS(source: string, options: CompileCSSOptions = {}): CompileCSSResult {
    const parsed: ParsedDirectives = {
        config: {},
        componentNames: []
    }
    const transformed = transform({
        filename: options.from || 'master.css',
        code: Buffer.from(source),
        customAtRules: MASTER_CUSTOM_AT_RULES,
        visitor: {
            Rule: {
                custom: {
                    master(rule) {
                        parseMaster(rule, parsed.config)
                        return []
                    },
                    mode(rule) {
                        parseMode(rule, parsed.config)
                        return []
                    },
                    apply() {
                        throw new Error('@apply is only allowed inside @layer components')
                    }
                },
                unknown: {
                    at(rule) {
                        parseAtDefinition(rule, parsed.config)
                        return []
                    },
                    selector(rule) {
                        parseSelectorDefinition(rule, parsed.config)
                        return []
                    },
                    utility() {
                        throw new Error('@utility is not supported; use @layer utilities')
                    }
                },
                'layer-block'(rule) {
                    const layerName = rule.value.name?.length === 1 ? rule.value.name[0] : undefined
                    if (layerName !== 'components' && layerName !== 'utilities') return
                    parseLayerBlock(rule, parsed)
                    return []
                },
                keyframes(rule) {
                    parseKeyframes(rule, parsed.config)
                    return []
                }
            }
        }
    })
    const css = createDirectiveCSS(parsed, options)
    const generatedCSS = css.text
    const remainingCSS = transformed.code.toString().trim()

    return {
        ...parsed,
        css: [remainingCSS, generatedCSS].filter(Boolean).join('\n\n'),
        generatedCSS
    }
}

export function parseDirectives(source: string, options: CompileCSSOptions = {}) {
    const { config, componentNames } = compileCSS(source, options)
    return {
        config,
        componentNames
    }
}
