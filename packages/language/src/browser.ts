import {
    SEMANTIC_TOKEN_MODIFIERS,
    SEMANTIC_TOKEN_TYPES,
    SEMANTIC_TOKENS_LEGEND
} from './common'
import { defaultManifest, MasterCSS, matchesLanguageServiceNativeDeclaration } from './master-css'
import { collectClassListHighlightTokenItems } from './semantic/tokenize-class'
import { collectCSSHighlightTokenItems, isCSSSemanticTokenDocument } from './semantic/tokenize-css'
import { toSemanticTokenItems, type HighlightTokenItem } from './semantic/highlight'
import type { SemanticTokenItem, SemanticTokenModifier } from './semantic/types'
import type { MasterCSSManifest } from '@master/css-schema/manifest'

export {
    SEMANTIC_TOKEN_MODIFIERS,
    SEMANTIC_TOKEN_TYPES,
    SEMANTIC_TOKENS_LEGEND
}
export type { HighlightTokenItem, SemanticTokenItem }

export interface BrowserSemanticTokenOptions {
    css?: MasterCSS
    manifest?: MasterCSSManifest
    classAttributes?: string[]
}

export interface BrowserSemanticTokens {
    data: Uint32Array
}

interface SourceRange {
    start: number
    end: number
}

const HTML_LANGUAGE_IDS = new Set([
    'html',
    'angular-html'
])
const DEFAULT_CLASS_ATTRIBUTES = ['class', 'className']
const tokenTypeIndex = new Map(SEMANTIC_TOKEN_TYPES.map((type, index) => [type, index]))
const tokenModifierIndex = new Map(SEMANTIC_TOKEN_MODIFIERS.map((modifier, index) => [modifier, index]))

function createBrowserCSS(options: BrowserSemanticTokenOptions = {}) {
    return options.css || MasterCSS.create({
        manifest: options.manifest || defaultManifest,
        nativeDeclarationMatcher: matchesLanguageServiceNativeDeclaration
    })
}

function escapeRegExp(value: string) {
    return value.replace(/[|\\{}()[\]^$+*?.]/g, '\\$&')
}

function collectHTMLClassListRanges(source: string, classAttributes = DEFAULT_CLASS_ATTRIBUTES): SourceRange[] {
    const ranges: SourceRange[] = []
    const attributes = classAttributes
        .filter(Boolean)
        .map(escapeRegExp)
    if (!attributes.length) return ranges

    const pattern = new RegExp(`(?:^|[\\s<])(?:${attributes.join('|')})\\s*=\\s*(["'])`, 'g')
    for (const match of source.matchAll(pattern)) {
        if (match.index === undefined) continue
        const quote = match[1]
        const start = match.index + match[0].length
        let end = start
        while (end < source.length) {
            if (source[end] === quote) break
            end++
        }
        if (end > start) {
            ranges.push({ start, end })
        }
    }
    return ranges
}

export function isBrowserHTMLSemanticTokenDocument(languageId: string) {
    return HTML_LANGUAGE_IDS.has(languageId)
}

export function collectBrowserHighlightTokenItems(
    source: string,
    languageId: string,
    options: BrowserSemanticTokenOptions = {}
): HighlightTokenItem[] {
    const css = createBrowserCSS(options)
    const tokens: HighlightTokenItem[] = []
    if (isCSSSemanticTokenDocument(languageId)) {
        tokens.push(...collectCSSHighlightTokenItems(source, css, languageId))
    }
    if (isBrowserHTMLSemanticTokenDocument(languageId)) {
        for (const range of collectHTMLClassListRanges(source, options.classAttributes)) {
            tokens.push(...collectClassListHighlightTokenItems(css, source.slice(range.start, range.end), range.start))
        }
    }
    return tokens
}

export function collectBrowserSemanticTokenItems(
    source: string,
    languageId: string,
    options: BrowserSemanticTokenOptions = {}
): SemanticTokenItem[] {
    return toSemanticTokenItems(collectBrowserHighlightTokenItems(source, languageId, options))
}

function collectLineStarts(source: string) {
    const starts = [0]
    for (let index = 0; index < source.length; index++) {
        if (source.charCodeAt(index) === 10) starts.push(index + 1)
    }
    return starts
}

function positionAtOffset(lineStarts: number[], offset: number) {
    let low = 0
    let high = lineStarts.length
    while (low < high) {
        const mid = (low + high) >> 1
        if (lineStarts[mid] > offset) {
            high = mid
        } else {
            low = mid + 1
        }
    }
    const line = Math.max(0, low - 1)
    return {
        line,
        character: offset - lineStarts[line]
    }
}

function modifierBits(modifiers: SemanticTokenModifier[] = []) {
    let bits = 0
    for (const modifier of modifiers) {
        const index = tokenModifierIndex.get(modifier)
        if (index !== undefined) bits |= 1 << index
    }
    return bits
}

export function encodeBrowserSemanticTokens(source: string, tokens: SemanticTokenItem[]): BrowserSemanticTokens {
    const data: number[] = []
    const lineStarts = collectLineStarts(source)
    let previousLine = 0
    let previousCharacter = 0
    let previousEnd = -1
    for (const token of tokens
        .filter((token) => token.end > token.start)
        .sort((a, b) => a.start - b.start || a.end - b.end)) {
        if (token.start < previousEnd) continue
        const typeIndex = tokenTypeIndex.get(token.type)
        if (typeIndex === undefined) continue
        const startPosition = positionAtOffset(lineStarts, token.start)
        const endPosition = positionAtOffset(lineStarts, token.end)
        if (startPosition.line !== endPosition.line) continue
        data.push(
            startPosition.line - previousLine,
            startPosition.line === previousLine ? startPosition.character - previousCharacter : startPosition.character,
            endPosition.character - startPosition.character,
            typeIndex,
            modifierBits(token.modifiers)
        )
        previousLine = startPosition.line
        previousCharacter = startPosition.character
        previousEnd = token.end
    }
    return { data: new Uint32Array(data) }
}

export function renderBrowserSemanticTokens(
    source: string,
    languageId: string,
    options: BrowserSemanticTokenOptions = {}
): BrowserSemanticTokens | undefined {
    const tokens = collectBrowserSemanticTokenItems(source, languageId, options)
    if (!tokens.length) return
    return encodeBrowserSemanticTokens(source, tokens)
}
