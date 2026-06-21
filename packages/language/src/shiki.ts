import { SEMANTIC_TOKEN_MODIFIERS } from './common'
import masterCSSTextMateGrammar from '../syntaxes/master-css.tmLanguage.json' with { type: 'json' }
import { TextDocument } from 'vscode-languageserver-textdocument'
import languageSettings, { type LanguageSettings } from './settings'
import { collectHighlightTokenItems } from './render-semantic-tokens'
import type { HighlightTokenItem, HighlightTokenRole } from './semantic/highlight'
import { collectClassListHighlightTokenItems } from './semantic/tokenize-class'
import getClassPositions from './utils/get-class-positions'
import { createLanguageCSS, defaultPlan, type MasterCSS } from './master-css'
import {
    MASTER_CSS_SEMANTIC_TOKEN_SCOPE_MAP,
    getMasterCSSSemanticTokenScopeKeys
} from './semantic/scopes'

export const MASTER_CSS_SHIKI_SCOPE_NAME = 'master-css.directive.injection'
export const MASTER_CSS_SHIKI_INJECT_TO = [
    'source.css',
    'source.css.scss',
    'source.css.less',
    'source.css.postcss'
] as const

export interface MasterCSSTextMateGrammar {
    name: string
    scopeName: string
    injectionSelector: string
    patterns: any[]
    repository: Record<string, any>
    [key: string]: any
}

export const MASTER_CSS_TEXTMATE_GRAMMAR = masterCSSTextMateGrammar as MasterCSSTextMateGrammar

export function createMasterCSSShikiLanguageRegistration(): MasterCSSTextMateGrammar & { injectTo: string[] } {
    return {
        ...MASTER_CSS_TEXTMATE_GRAMMAR,
        injectTo: [...MASTER_CSS_SHIKI_INJECT_TO]
    }
}

export const masterCSSShikiLanguage = createMasterCSSShikiLanguageRegistration()

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
    color?: string
    htmlStyle?: Record<string, string>
    htmlAttrs?: Record<string, unknown>
    explanation?: {
        scopes?: {
            scopeName: string
        }[]
    }[]
    [key: string]: unknown
}

interface ShikiPosition {
    line: number
    character: number
}

interface ShikiDecoration {
    start: number | ShikiPosition
    end: number | ShikiPosition
    tagName?: string
    properties?: Record<string, unknown>
    alwaysWrap?: boolean
    transform?: (element: unknown, type: 'wrapper' | 'line' | 'token') => unknown | undefined
}

interface ShikiCodeToHastOptions {
    lang?: string
    decorations?: ShikiDecoration[]
    includeExplanation?: 'scopeName' | boolean
    [key: string]: unknown
}

interface ShikiCodeToTokensResult {
    tokens: ShikiToken[][]
}

interface ShikiTransformerContext {
    source: string
    options: ShikiCodeToHastOptions
    codeToTokens?: (code: string, options: ShikiCodeToHastOptions) => ShikiCodeToTokensResult
}

interface ShikiTransformer {
    name: string
    enforce: 'post'
    tokens(this: ShikiTransformerContext, tokens: ShikiToken[][]): ShikiToken[][] | undefined
}

export interface MasterCSSShikiDecoration extends Omit<ShikiDecoration, 'start' | 'end'> {
    start: number
    end: number
    type: SemanticTokenType
    role: HighlightTokenRole
    modifiers: SemanticTokenModifier[]
}

export interface MasterCSSShikiOptions {
    /**
     * Reuse an existing Master CSS instance when the caller already owns a
     * configured language engine.
     */
    css?: MasterCSS
    /**
     * Class-position and plan settings used when collecting embedded utilities.
     */
    settings?: LanguageSettings
    /**
     * Convenience shortcut for `settings.plan`.
     */
    plan?: LanguageSettings['plan']
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
     * Resolve Master CSS semantic token scopes through the active Shiki
     * theme when possible. When disabled, the transformer only splits tokens
     * and attaches semantic metadata/classes unless explicit semantic styles
     * are provided.
     *
     * @default true
     */
    matchCSSSyntaxStyles?: boolean
}

const shikiLanguageIds: Record<string, string> = {
    html: 'html',
    'angular-html': 'angular-html',
    js: 'javascript',
    javascript: 'javascript',
    jsx: 'jsx',
    javascriptreact: 'jsx',
    ts: 'typescript',
    typescript: 'typescript',
    tsx: 'tsx',
    typescriptreact: 'tsx',
    css: 'css',
    scss: 'scss',
    less: 'less',
    postcss: 'postcss',
    vue: 'vue',
    svelte: 'svelte',
    astro: 'astro',
    md: 'markdown',
    markdown: 'markdown',
    mdx: 'mdx'
}
const languageServiceLanguageIds: Record<string, string> = {
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
    postcss: 'postcss',
    vue: 'vue',
    svelte: 'svelte',
    astro: 'astro',
    md: 'markdown',
    markdown: 'markdown',
    mdx: 'mdx'
}
const masterCSSClassListLanguageIds = new Set(['mcss', 'master-css'])
const masterCSSShikiSupportedLanguageIds = new Set([
    ...Object.keys(shikiLanguageIds),
    ...Object.values(shikiLanguageIds)
])

export function isMasterCSSClassListLanguage(lang?: string) {
    return Boolean(lang && masterCSSClassListLanguageIds.has(lang))
}

export function getMasterCSSShikiLanguageId(lang?: string) {
    if (!lang) return
    return shikiLanguageIds[lang] ?? lang
}

export function isMasterCSSShikiSupportedLanguage(lang?: string) {
    const languageId = getMasterCSSShikiLanguageId(lang)
    return Boolean(languageId && masterCSSShikiSupportedLanguageIds.has(languageId))
}

function createShikiDocument(code: string, lang?: string) {
    const languageId = lang ? languageServiceLanguageIds[lang] ?? lang : undefined
    if (!languageId) return
    const uriLang = lang?.replace(/[^\w.-]/g, '-') || 'txt'
    return TextDocument.create(`file:///master-css-shiki.${uriLang}`, languageId, 0, code)
}

function createShikiCSS(options: MasterCSSShikiOptions) {
    return options.css || createLanguageCSS(options.plan ?? options.settings?.plan ?? defaultPlan)
}

function createShikiSettings(options: MasterCSSShikiOptions): LanguageSettings {
    return {
        ...languageSettings,
        ...options.settings,
        plan: options.plan ?? options.settings?.plan
    }
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
    options: MasterCSSShikiOptions
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
    decorations: MasterCSSShikiDecoration[],
    resolveSyntaxStyle?: (token: ShikiToken, decoration: MasterCSSShikiDecoration, decorations: MasterCSSShikiDecoration[]) => Record<string, string> | undefined
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

function getTokenStyleObject(token: ShikiToken) {
    const htmlStyle = cloneStyle(token.htmlStyle)
    if (htmlStyle) return htmlStyle
    return typeof token.color === 'string' ? { color: token.color } : undefined
}

interface ScopeStyleEntry {
    scope: string
    normalizedScope: string
    style: Record<string, string>
}

const SEMANTIC_SCOPE_STYLE_PROBE = [
    '@theme light inline {',
    '  --token: $value;',
    '}',
    '@components {',
    '  btn { @compose block fg:red:hover@md; }',
    '}',
    '.x, div > li:hover::before {',
    '  color: red !important;',
    '  width: 1.5rem;',
    '  background: rgb(0 0 0 / .5);',
    '  content: "x";',
    '  --token: red;',
    '}',
    '@media (width >= 1px) { .y { color: var(--token); } }'
].join('\n')

function normalizeScope(scope: string) {
    let normalizedScope = scope
    while (normalizedScope.endsWith('.css') || normalizedScope.endsWith('.master-css')) {
        normalizedScope = normalizedScope
            .replace(/\.css$/, '')
            .replace(/\.master-css$/, '')
    }
    return normalizedScope
}

function getScopeCandidates(scope: string) {
    return [...new Set([
        scope,
        scope.replace(/\.css$/, ''),
        scope.replace(/\.master-css$/, ''),
        normalizeScope(scope)
    ])]
}

function getScopePrefixes(scope: string) {
    const prefixes: string[] = []
    const bases = [
        scope,
        scope.replace(/\.css$/, ''),
        scope.replace(/\.master-css$/, ''),
        normalizeScope(scope)
    ]
    for (const base of bases) {
        const segments = base.split('.')
        for (let length = segments.length; length >= 2; length--) {
            prefixes.push(segments.slice(0, length).join('.'))
        }
    }
    return [...new Set(prefixes)]
}

function collectScopeStyleEntries(tokens: ShikiToken[]): ScopeStyleEntry[] {
    const entries: ScopeStyleEntry[] = []
    const seenScopes = new Set<string>()
    for (const token of tokens) {
        const style = getTokenStyleObject(token)
        if (!style) continue
        for (const explanation of token.explanation ?? []) {
            for (const { scopeName } of explanation.scopes ?? []) {
                if (seenScopes.has(scopeName)) continue
                seenScopes.add(scopeName)
                entries.push({
                    scope: scopeName,
                    normalizedScope: normalizeScope(scopeName),
                    style
                })
            }
        }
    }
    return entries
}

function findStyleByScope(entries: ScopeStyleEntry[], scope: string) {
    for (const candidate of getScopeCandidates(scope)) {
        const exact = entries.find((entry) => entry.scope === candidate || entry.normalizedScope === candidate)
        if (exact) return exact.style
    }
    for (const prefix of getScopePrefixes(scope)) {
        const prefixed = entries.find((entry) => (
            entry.scope === prefix
            || entry.normalizedScope === prefix
            || entry.scope.startsWith(`${prefix}.`)
            || entry.normalizedScope.startsWith(`${prefix}.`)
        ))
        if (prefixed) return prefixed.style
    }
}

function createSemanticScopeStyleResolver(
    context: ShikiTransformerContext,
    options: MasterCSSShikiOptions
) {
    if (options.matchCSSSyntaxStyles === false || typeof context.codeToTokens !== 'function') return
    try {
        const { lang: _lang, decorations: _decorations, transformers: _transformers, ...tokenOptions } = context.options
        const scopeStyleEntries = collectScopeStyleEntries(context.codeToTokens(SEMANTIC_SCOPE_STYLE_PROBE, {
            ...tokenOptions,
            lang: 'css',
            includeExplanation: 'scopeName'
        }).tokens.flat())

        return (_token: ShikiToken, decoration: MasterCSSShikiDecoration) => {
            for (const key of getMasterCSSSemanticTokenScopeKeys(decoration.type, decoration.modifiers)) {
                for (const scope of MASTER_CSS_SEMANTIC_TOKEN_SCOPE_MAP[key]) {
                    const style = findStyleByScope(scopeStyleEntries, scope)
                    if (style) return style
                }
            }
        }
    } catch {
        return
    }
}

function createSemanticTokenDecorations(
    tokens: HighlightTokenItem[],
    options: MasterCSSShikiOptions
): MasterCSSShikiDecoration[] {
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

export function createMasterCSSShikiDecorations(
    code: string,
    options: MasterCSSShikiOptions = {}
): MasterCSSShikiDecoration[] {
    const classList = options.classList ?? isMasterCSSClassListLanguage(options.lang)
    const document = createShikiDocument(code, classList ? 'plaintext' : options.lang)
    if (!document) return []
    const css = createShikiCSS(options)
    const highlightTokens = classList
        ? collectClassListHighlightTokenItems(css, code)
        : collectHighlightTokenItems(css, document, getClassPositions(document, createShikiSettings(options)))
    if (!highlightTokens.length) return []
    return createSemanticTokenDecorations(highlightTokens, options)
}

export function transformerMasterCSS(
    options: MasterCSSShikiOptions = {}
): ShikiTransformer {
    return {
        name: 'master-css',
        enforce: 'post',
        tokens(this: ShikiTransformerContext, tokens) {
            const lang = options.lang ?? this.options.lang
            const classList = options.classList ?? isMasterCSSClassListLanguage(lang)
            const decorations = createMasterCSSShikiDecorations(this.source, {
                ...options,
                lang,
                classList
            })
            if (!decorations.length) return
            const tokensSplitAtSemanticBoundaries = splitTokensAtOffsets(tokens, decorations.flatMap(({ start, end }) => [start, end]))
            const resolveSyntaxStyle = createSemanticScopeStyleResolver(this, {
                ...options,
                lang,
                classList
            })
            return tokensSplitAtSemanticBoundaries.map((line) => line.map((token) => applySemanticDecorationToToken(token, decorations, resolveSyntaxStyle)))
        }
    }
}

export default [masterCSSShikiLanguage]
