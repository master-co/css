import CSSLanguageService from './core'
import { SEMANTIC_TOKEN_MODIFIERS, SEMANTIC_TOKEN_TYPES } from './common'
import { TextDocument } from 'vscode-languageserver-textdocument'
import type { Settings } from './settings'

type SemanticTokenType = typeof SEMANTIC_TOKEN_TYPES[number]
type SemanticTokenModifier = typeof SEMANTIC_TOKEN_MODIFIERS[number]
interface ShikiToken {
    content: string
    offset: number
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

export interface MasterCSSShikiTransformerContext {
    source: string
    options: MasterCSSShikiCodeToHastOptions
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
}

const shikiLanguageIds: Record<string, string> = {
    mcss: 'master-css',
    'master-css': 'master-css',
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

function decodeSemanticTokenDecorations(
    document: TextDocument,
    data: number[],
    options: MasterCSSShikiSemanticTokensOptions
): MasterCSSShikiSemanticDecoration[] {
    const classPrefix = options.classPrefix ?? 'mcss-semantic'
    const includeDataAttributes = options.dataAttributes ?? true
    const decorations: MasterCSSShikiSemanticDecoration[] = []
    let line = 0
    let character = 0
    for (let i = 0; i < data.length; i += 5) {
        const deltaLine = data[i]
        const deltaStart = data[i + 1]
        line += deltaLine
        character = deltaLine === 0 ? character + deltaStart : deltaStart
        const length = data[i + 2]
        const type = SEMANTIC_TOKEN_TYPES[data[i + 3]]
        const modifierBits = data[i + 4]
        if (!type) continue
        const modifiers = SEMANTIC_TOKEN_MODIFIERS.filter((_, index) => modifierBits & (1 << index))
        const start = document.offsetAt({ line, character })
        const end = document.offsetAt({ line, character: character + length })
        const classNames = [
            classPrefix,
            `${classPrefix}-${type}`,
            ...modifiers.map((modifier) => `${classPrefix}-${type}-${modifier}`)
        ]
        decorations.push({
            start,
            end,
            type,
            modifiers,
            alwaysWrap: options.alwaysWrap,
            properties: {
                class: classNames,
                ...(includeDataAttributes
                    ? {
                        'data-semantic-token-type': type,
                        'data-semantic-token-modifiers': modifiers.join(' ')
                    }
                    : undefined)
            }
        })
    }
    return decorations
}

export function createMasterCSSShikiSemanticTokenDecorations(
    code: string,
    options: MasterCSSShikiSemanticTokensOptions = {}
): MasterCSSShikiSemanticDecoration[] {
    const document = createShikiDocument(code, options.lang)
    if (!document) return []
    const semanticTokens = createLanguageService(options).renderSemanticTokens(document)
    if (!semanticTokens?.data.length) return []
    return decodeSemanticTokenDecorations(document, semanticTokens.data, options)
}

export function transformerMasterCSSSemanticTokens(
    options: MasterCSSShikiSemanticTokensOptions = {}
): MasterCSSShikiTransformer {
    return {
        name: 'master-css:semantic-tokens',
        enforce: 'post',
        tokens(this: MasterCSSShikiTransformerContext) {
            const decorations = createMasterCSSShikiSemanticTokenDecorations(this.source, {
                ...options,
                lang: options.lang ?? this.options.lang
            })
            if (!decorations.length) return
            this.options.decorations = [
                ...(this.options.decorations ?? []),
                ...decorations
            ]
        }
    }
}
