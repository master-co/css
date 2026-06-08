import CSSLanguageService from './core'
import { SEMANTIC_TOKEN_MODIFIERS } from './common'
import { TextDocument } from 'vscode-languageserver-textdocument'
import type { Settings } from './settings'
import { collectHighlightTokenItems } from './features/render-semantic-tokens'
import type { HighlightTokenItem, HighlightTokenRole } from './semantic/highlight'
import { collectClassListHighlightTokenItems } from './semantic/tokenize-class'

type SemanticTokenType = HighlightTokenItem['type']
type SemanticTokenModifier = typeof SEMANTIC_TOKEN_MODIFIERS[number]
export type MasterCSSShikiSemanticTokenStyleKey = SemanticTokenType | `${SemanticTokenType}.${SemanticTokenModifier}`
export type MasterCSSShikiHighlightRoleStyleKey = HighlightTokenRole
export type MasterCSSShikiSemanticTokenStyle = string | Record<string, string>
export type MasterCSSShikiSemanticTokenStyles = Partial<Record<MasterCSSShikiSemanticTokenStyleKey, MasterCSSShikiSemanticTokenStyle>>
export type MasterCSSShikiHighlightRoleStyles = Partial<Record<MasterCSSShikiHighlightRoleStyleKey, MasterCSSShikiSemanticTokenStyle>>
interface ShikiToken {
    content: string
    offset: number
    htmlStyle?: Record<string, string>
    htmlAttrs?: Record<string, unknown>
    [key: string]: unknown
}

interface ShikiPosition {
    line: number
    character: number
}

export interface MasterCSSShikiDecoration {
    start: number | ShikiPosition
    end: number | ShikiPosition
    tagName?: string
    properties?: Record<string, unknown>
    alwaysWrap?: boolean
    transform?: (element: unknown, type: 'wrapper' | 'line' | 'token') => unknown | undefined
}

export interface MasterCSSShikiCodeToHastOptions {
    lang?: string
    decorations?: MasterCSSShikiDecoration[]
    [key: string]: unknown
}

export interface MasterCSSShikiCodeToTokensResult {
    tokens: ShikiToken[][]
}

export interface MasterCSSShikiTransformerContext {
    source: string
    options: MasterCSSShikiCodeToHastOptions
    codeToTokens?: (code: string, options: MasterCSSShikiCodeToHastOptions) => MasterCSSShikiCodeToTokensResult
}

export interface MasterCSSShikiTransformer {
    name: string
    enforce: 'post'
    tokens(this: MasterCSSShikiTransformerContext, tokens: ShikiToken[][]): ShikiToken[][] | undefined
}

export interface MasterCSSShikiSemanticDecoration extends Omit<MasterCSSShikiDecoration, 'start' | 'end'> {
    start: number
    end: number
    type: SemanticTokenType
    role: HighlightTokenRole
    modifiers: SemanticTokenModifier[]
}

export interface MasterCSSShikiSemanticTokensOptions {
    /**
     * Reuse an existing language service when the caller already owns a
     * configured instance.
     */
    languageService?: CSSLanguageService
    /**
     * Settings used to create an internal language service when
     * `languageService` is not provided.
     */
    settings?: Settings
    /**
     * Convenience shortcut for `settings.config`.
     */
    config?: Settings['config']
    /**
     * Shiki language id. Defaults to the `lang` passed to Shiki.
     */
    lang?: string
    /**
     * Treat the whole source as a whitespace-separated Master CSS class list.
     * This replaces the old standalone `.mcss` TextMate grammar use case
     * without contributing a Master CSS language.
     */
    classList?: boolean
    /**
     * Class prefix added to every semantic decoration.
     *
     * @default 'mcss-semantic'
     */
    classPrefix?: string
    /**
     * Add `data-semantic-token-*` attributes to decorated spans.
     *
     * @default true
     */
    dataAttributes?: boolean
    /**
     * Force Shiki to wrap semantic tokens instead of reusing the existing
     * TextMate token span when possible.
     */
    alwaysWrap?: boolean
    /**
     * Inline styles applied by semantic token type or type.modifier. These
     * styles intentionally replace the underlying TextMate token style for the
     * decorated range, which keeps tokens such as `block` and `block:hover`
     * visually aligned when they share the same semantic type.
     */
    semanticTokenStyles?: MasterCSSShikiSemanticTokenStyles
    /**
     * Inline styles applied by CSS-native highlight role. Role styles are the
     * most precise presentation override and are shared across host languages.
     */
    highlightRoleStyles?: MasterCSSShikiHighlightRoleStyles
    /**
     * Reuse Shiki's native CSS grammar styles for Master CSS highlight roles
     * when possible, so markup utilities and directives stay aligned with
     * CSS/SASS without hardcoded theme colors.
     *
     * @default true
     */
    matchCSSSyntaxStyles?: boolean
}

const shikiLanguageIds: Record<string, string> = {
    html: 'html',
    'angular-html': 'html',
    js: 'javascript',
    javascript: 'javascript',
    jsx: 'javascriptreact',
    javascriptreact: 'javascriptreact',
    ts: 'typescript',
    typescript: 'typescript',
    tsx: 'typescriptreact',
    typescriptreact: 'typescriptreact',
    css: 'css',
    scss: 'scss',
    less: 'less',
    vue: 'vue',
    svelte: 'svelte',
    astro: 'astro',
    md: 'markdown',
    markdown: 'markdown',
    mdx: 'mdx'
}

function resolveLanguageId(lang?: string) {
    if (!lang) return
    return shikiLanguageIds[lang] ?? lang
}

function createShikiDocument(code: string, lang?: string) {
    const languageId = resolveLanguageId(lang)
    if (!languageId) return
    const uriLang = lang?.replace(/[^\w.-]/g, '-') || 'txt'
    return TextDocument.create(`file:///master-css-shiki.${uriLang}`, languageId, 0, code)
}

function createLanguageService(options: MasterCSSShikiSemanticTokensOptions) {
    if (options.languageService) return options.languageService
    return new CSSLanguageService({
        ...options.settings,
        config: options.config ?? options.settings?.config
    })
}

function stringifyStyle(style: MasterCSSShikiSemanticTokenStyle) {
    if (typeof style === 'string') return style
    return Object.entries(style)
        .map(([property, value]) => `${property}:${value}`)
        .join(';')
}

function resolveSemanticTokenStyle(
    type: SemanticTokenType,
    modifiers: SemanticTokenModifier[],
    styles?: MasterCSSShikiSemanticTokenStyles
) {
    if (!styles) return
    const matchedStyles = [
        styles[type],
        ...modifiers.map((modifier) => styles[`${type}.${modifier}` as MasterCSSShikiSemanticTokenStyleKey])
    ].filter((style): style is MasterCSSShikiSemanticTokenStyle => Boolean(style))
    if (!matchedStyles.length) return
    return matchedStyles.map(stringifyStyle).join(';')
}

function resolveHighlightTokenStyle(
    item: Pick<HighlightTokenItem, 'role' | 'type' | 'modifiers'>,
    options: MasterCSSShikiSemanticTokensOptions
) {
    const roleStyle = options.highlightRoleStyles?.[item.role]
    if (roleStyle) return stringifyStyle(roleStyle)
    return resolveSemanticTokenStyle(item.type, item.modifiers ?? [], options.semanticTokenStyles)
}

function splitToken(token: ShikiToken, breakpoints: number[]) {
    const tokens: ShikiToken[] = []
    let lastOffset = 0
    for (const offset of breakpoints) {
        if (offset > lastOffset) {
            tokens.push({
                ...token,
                content: token.content.slice(lastOffset, offset),
                offset: token.offset + lastOffset
            })
        }
        lastOffset = offset
    }
    if (lastOffset < token.content.length) {
        tokens.push({
            ...token,
            content: token.content.slice(lastOffset),
            offset: token.offset + lastOffset
        })
    }
    return tokens
}

function splitTokensAtOffsets(tokens: ShikiToken[][], breakpoints: number[]) {
    const sortedBreakpoints = [...new Set(breakpoints)].sort((a, b) => a - b)
    if (!sortedBreakpoints.length) return tokens
    return tokens.map((line) => {
        return line.flatMap((token) => {
            const breakpointsInToken = sortedBreakpoints
                .filter((offset) => token.offset < offset && offset < token.offset + token.content.length)
                .map((offset) => offset - token.offset)
            return breakpointsInToken.length ? splitToken(token, breakpointsInToken) : token
        })
    })
}

function parseStyleProperty(style: unknown) {
    if (typeof style === 'string') {
        return Object.fromEntries(style
            .split(';')
            .map((declaration) => declaration.split(':'))
            .filter(([property, value]) => property && value)
            .map(([property, ...value]) => [property.trim(), value.join(':').trim()]))
    }
    if (style && typeof style === 'object' && !Array.isArray(style)) {
        return Object.fromEntries(Object
            .entries(style)
            .filter((entry): entry is [string, string] => typeof entry[1] === 'string'))
    }
}

function resolveClassNames(value: unknown): string[] {
    if (Array.isArray(value)) return value.flatMap(resolveClassNames)
    return typeof value === 'string' ? value.split(/\s+/).filter(Boolean) : []
}

function mergeClassProperty(current: unknown, next: unknown) {
    return [
        ...resolveClassNames(current),
        ...resolveClassNames(next)
    ].join(' ')
}

function applySemanticDecorationToToken(
    token: ShikiToken,
    decorations: MasterCSSShikiSemanticDecoration[],
    resolveSyntaxStyle?: (token: ShikiToken, decoration: MasterCSSShikiSemanticDecoration, decorations: MasterCSSShikiSemanticDecoration[]) => Record<string, string> | undefined
) {
    const tokenStart = token.offset
    const tokenEnd = token.offset + token.content.length
    const matchedDecorations = decorations.filter(({ start, end }) => start <= tokenStart && tokenEnd <= end)
    if (!matchedDecorations.length) return token

    const htmlAttrs: Record<string, unknown> = { ...token.htmlAttrs }
    const htmlStyle: Record<string, string> = { ...token.htmlStyle }
    for (const decoration of matchedDecorations) {
        const properties = decoration.properties ?? {}
        if (properties.class) {
            htmlAttrs.class = mergeClassProperty(htmlAttrs.class, properties.class)
        }
        const style = parseStyleProperty(properties.style)
        if (style) {
            for (const key of Object.keys(htmlStyle)) {
                delete htmlStyle[key]
            }
            Object.assign(htmlStyle, style)
        } else {
            const syntaxStyle = resolveSyntaxStyle?.(token, decoration, decorations)
            if (syntaxStyle) {
                for (const key of Object.keys(htmlStyle)) {
                    delete htmlStyle[key]
                }
                Object.assign(htmlStyle, syntaxStyle)
            }
        }
        for (const [name, value] of Object.entries(properties)) {
            if (name === 'class' || name === 'style' || value === undefined) continue
            htmlAttrs[name] = typeof value === 'string' ? value : String(value)
        }
    }

    return {
        ...token,
        htmlAttrs,
        htmlStyle
    }
}

function cloneStyle(style: unknown) {
    return style && typeof style === 'object' && !Array.isArray(style)
        ? Object.fromEntries(Object
            .entries(style)
            .filter((entry): entry is [string, string] => typeof entry[1] === 'string'))
        : undefined
}

function findTokenStyle(tokens: ShikiToken[], content: string, offset = 0) {
    let seen = 0
    for (const token of tokens) {
        if (token.content !== content) continue
        if (seen++ < offset) continue
        return cloneStyle(token.htmlStyle)
    }
}

function findTokenStyleContaining(tokens: ShikiToken[], content: string, offset = 0) {
    let seen = 0
    for (const token of tokens) {
        if (!token.content.includes(content)) continue
        if (seen++ < offset) continue
        return cloneStyle(token.htmlStyle)
    }
}

function findTokenStyleAfter(tokens: ShikiToken[], previousContent: string, content: string) {
    const previousIndex = tokens.findIndex((token) => token.content === previousContent)
    if (previousIndex === -1) return findTokenStyle(tokens, content)
    for (const token of tokens.slice(previousIndex + 1)) {
        if (token.content === content || token.content.includes(content)) return cloneStyle(token.htmlStyle)
    }
}

function createCSSSyntaxStyleResolver(
    context: MasterCSSShikiTransformerContext,
    options: MasterCSSShikiSemanticTokensOptions
) {
    if (options.matchCSSSyntaxStyles === false || typeof context.codeToTokens !== 'function') return
    try {
        const { lang: _lang, decorations: _decorations, transformers: _transformers, ...tokenOptions } = context.options
        const cssTokens = context.codeToTokens('.x,div>li:hover::before{color:red!important;width:1.5rem;background:rgb(0 0 0 / .5);content:"x";transform:translate(10px,20px)}@media(width>=1px){.y{color:var(--token)}}', {
            ...tokenOptions,
            lang: 'css'
        }).tokens.flat()
        const neutralStyle = findTokenStyle(cssTokens, ';') ?? findTokenStyleContaining(cssTokens, '{') ?? findTokenStyleContaining(cssTokens, '}')
        const atKeywordStyle = findTokenStyle(cssTokens, '@media')
        const propertyStyle = findTokenStyle(cssTokens, 'color') ?? findTokenStyle(cssTokens, 'width')
        const declarationSeparatorStyle = findTokenStyleAfter(cssTokens, 'color', ':')
        const valueStyle = findTokenStyle(cssTokens, 'red') ?? findTokenStyle(cssTokens, 'block')
        const importantStyle = findTokenStyleContaining(cssTokens, '!important') ?? atKeywordStyle
        const numberStyle = findTokenStyle(cssTokens, '1.5') ?? findTokenStyle(cssTokens, '.5') ?? findTokenStyle(cssTokens, '1')
        const unitStyle = findTokenStyle(cssTokens, 'rem') ?? findTokenStyle(cssTokens, 'px')
        const functionStyle = findTokenStyle(cssTokens, 'rgb') ?? findTokenStyle(cssTokens, 'translate')
        const functionPunctuationStyle = findTokenStyleAfter(cssTokens, 'rgb', '(') ?? neutralStyle
        const valueSeparatorStyle = findTokenStyle(cssTokens, '/') ?? findTokenStyleContaining(cssTokens, ' / ') ?? findTokenStyle(cssTokens, ',') ?? neutralStyle
        const stringStyle = findTokenStyle(cssTokens, 'x')
        const stringQuoteStyle = findTokenStyle(cssTokens, '"')
        const typeStyle = findTokenStyle(cssTokens, 'li') ?? findTokenStyle(cssTokens, 'div')
        const classStyle = findTokenStyle(cssTokens, '.x') ?? findTokenStyle(cssTokens, '.y') ?? typeStyle
        const selectorCombinatorStyle = findTokenStyle(cssTokens, '>') ?? findTokenStyle(cssTokens, ',') ?? neutralStyle
        const pseudoDelimiterStyle = findTokenStyleAfter(cssTokens, '.x', ':') ?? findTokenStyle(cssTokens, ':')
        const pseudoNameStyle = findTokenStyle(cssTokens, 'hover')
        const pseudoElementNameStyle = findTokenStyle(cssTokens, 'before') ?? pseudoNameStyle
        const queryFeatureStyle = findTokenStyle(cssTokens, 'width') ?? propertyStyle
        const queryOperatorStyle = findTokenStyle(cssTokens, '>=')
        const queryNumberStyle = findTokenStyle(cssTokens, '1') ?? numberStyle
        const queryUnitStyle = findTokenStyle(cssTokens, 'px') ?? unitStyle
        const variableStyle = findTokenStyleContaining(cssTokens, '--token') ?? propertyStyle

        const roleStyles: Partial<Record<HighlightTokenRole, Record<string, string> | undefined>> = {
            'block.brace': neutralStyle,
            'declaration.property': propertyStyle,
            'declaration.separator': declarationSeparatorStyle,
            'declaration.terminator': neutralStyle,
            'directive.keyword': atKeywordStyle,
            'directive.modifier': importantStyle,
            'directive.parameter': variableStyle,
            'directive.terminator': neutralStyle,
            'query.keyword': atKeywordStyle,
            'query.feature': queryFeatureStyle,
            'query.operator': queryOperatorStyle,
            'query.punctuation': neutralStyle,
            'query.value': valueStyle,
            'query.number': queryNumberStyle,
            'query.unit': queryUnitStyle,
            'selector.attribute': typeStyle,
            'selector.class': classStyle,
            'selector.combinator': selectorCombinatorStyle,
            'selector.id': classStyle,
            'selector.pseudoClass.delimiter': pseudoDelimiterStyle,
            'selector.pseudoClass.name': pseudoNameStyle,
            'selector.pseudoElement.delimiter': pseudoDelimiterStyle,
            'selector.pseudoElement.name': pseudoElementNameStyle,
            'selector.punctuation': neutralStyle,
            'selector.type': typeStyle,
            'theme.variable': variableStyle,
            'utility.component': classStyle,
            'utility.static': valueStyle,
            'value.color': valueStyle,
            'value.function.name': functionStyle,
            'value.function.punctuation': functionPunctuationStyle,
            'value.important': importantStyle,
            'value.keyword': valueStyle,
            'value.number': numberStyle,
            'value.operator': declarationSeparatorStyle,
            'value.separator': valueSeparatorStyle,
            'value.string': stringStyle,
            'value.string.quote': stringQuoteStyle,
            'value.unit': unitStyle,
            'value.variable': variableStyle
        }

        return (_token: ShikiToken, decoration: MasterCSSShikiSemanticDecoration) => {
            return roleStyles[decoration.role]
        }
    } catch {
        return
    }
}

function createSemanticTokenDecorations(
    tokens: HighlightTokenItem[],
    options: MasterCSSShikiSemanticTokensOptions
): MasterCSSShikiSemanticDecoration[] {
    const classPrefix = options.classPrefix ?? 'mcss-semantic'
    const includeDataAttributes = options.dataAttributes ?? true
    return tokens.map(({ start, end, type, role, modifiers = [] }) => {
        const classNames = [
            classPrefix,
            `${classPrefix}-${type}`,
            `${classPrefix}-role-${role.replace(/\./g, '-')}`,
            ...modifiers.map((modifier) => `${classPrefix}-${type}-${modifier}`)
        ]
        const style = resolveHighlightTokenStyle({ type, role, modifiers }, options)
        return {
            start,
            end,
            type,
            role,
            modifiers,
            alwaysWrap: options.alwaysWrap,
            properties: {
                class: classNames,
                ...(style ? { style } : undefined),
                ...(includeDataAttributes
                    ? {
                        'data-semantic-token-type': type,
                        'data-semantic-token-modifiers': modifiers.join(' '),
                        'data-highlight-role': role
                    }
                    : undefined)
            }
        }
    })
}

export function createMasterCSSShikiSemanticTokenDecorations(
    code: string,
    options: MasterCSSShikiSemanticTokensOptions = {}
): MasterCSSShikiSemanticDecoration[] {
    const document = createShikiDocument(code, options.classList ? 'plaintext' : options.lang)
    if (!document) return []
    const languageService = createLanguageService(options)
    const highlightTokens = options.classList
        ? collectClassListHighlightTokenItems(languageService.css, code)
        : collectHighlightTokenItems.call(languageService, document)
    if (!highlightTokens.length) return []
    return createSemanticTokenDecorations(highlightTokens, options)
}

export function transformerMasterCSSSemanticTokens(
    options: MasterCSSShikiSemanticTokensOptions = {}
): MasterCSSShikiTransformer {
    return {
        name: 'master-css:semantic-tokens',
        enforce: 'post',
        tokens(this: MasterCSSShikiTransformerContext, tokens) {
            const decorations = createMasterCSSShikiSemanticTokenDecorations(this.source, {
                ...options,
                lang: options.lang ?? this.options.lang
            })
            if (!decorations.length) return
            const tokensSplitAtSemanticBoundaries = splitTokensAtOffsets(tokens, decorations.flatMap(({ start, end }) => [start, end]))
            const resolveSyntaxStyle = createCSSSyntaxStyleResolver(this, options)
            return tokensSplitAtSemanticBoundaries.map((line) => line.map((token) => applySemanticDecorationToToken(token, decorations, resolveSyntaxStyle)))
        }
    }
}
