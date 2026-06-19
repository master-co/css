import { pushHighlightToken, type HighlightTokenItem } from '../highlight'
import { collectClassListHighlightTokenItems, tokenizeAtQuery, tokenizeState } from '../tokenize-class'
import { tokenizeSelectorPrelude } from './selector'
import type { MasterCSS } from '../../master-css'
import {
    collectCSSQuotedStringRanges,
    findCSSClosingQuote,
    isCSSIdentStart,
    readCSSIdent,
    skipCSSWhitespace
} from '@master/css-lexer'

const SOURCE_MODIFIERS = new Set(['not', 'required'])
const PRESERVE_PARAMETERS = new Set(['native'])
const THEME_MODIFIERS = new Set(['inline', 'static'])

export function tokenizeSourcePrelude(source: string, start: number, end: number, tokens: HighlightTokenItem[]) {
    let cursor = skipCSSWhitespace(source, start)
    while (cursor < end) {
        cursor = skipCSSWhitespace(source, cursor)
        const char = source[cursor]
        if (char === '"' || char === '\'') {
            const close = findCSSClosingQuote(source, cursor, char, end)
            cursor = close + 1
            continue
        }
        if (isCSSIdentStart(char)) {
            const ident = readCSSIdent(source, cursor)
            if (SOURCE_MODIFIERS.has(ident.value)) {
                pushHighlightToken(tokens, ident.start, ident.value.length, 'modifier', 'directive.modifier', ['directive'])
            }
            cursor = ident.end
            continue
        }
        cursor++
    }
}

export function tokenizeClassListPrelude(source: string, start: number, end: number, tokens: HighlightTokenItem[], css: MasterCSS) {
    for (const stringRange of collectCSSQuotedStringRanges(source, start, end)) {
        tokens.push(...collectClassListHighlightTokenItems(css, source.slice(stringRange.start + 1, stringRange.end - 1), stringRange.start + 1))
    }
}

export function tokenizePreservePrelude(source: string, start: number, end: number, tokens: HighlightTokenItem[]) {
    let cursor = skipCSSWhitespace(source, start)
    while (cursor < end) {
        const ident = readCSSIdent(source, cursor)
        if (ident.value) {
            if (PRESERVE_PARAMETERS.has(ident.value)) {
                pushHighlightToken(tokens, ident.start, ident.value.length, 'enumMember', 'directive.parameter', ['directive'])
            }
            cursor = skipCSSWhitespace(source, ident.end)
            continue
        }
        cursor++
    }
}

export function tokenizeThemePrelude(source: string, start: number, end: number, tokens: HighlightTokenItem[]) {
    let cursor = skipCSSWhitespace(source, start)
    while (cursor < end) {
        const ident = readCSSIdent(source, cursor)
        if (ident.value) {
            if (THEME_MODIFIERS.has(ident.value)) {
                pushHighlightToken(tokens, ident.start, ident.value.length, 'modifier', 'directive.modifier', ['directive'])
            } else {
                pushHighlightToken(tokens, ident.start, ident.value.length, 'enumMember', 'directive.parameter', ['directive'])
            }
            cursor = skipCSSWhitespace(source, ident.end)
            continue
        }
        cursor++
    }
}

export function tokenizeCustomVariantPrelude(source: string, start: number, end: number, tokens: HighlightTokenItem[]) {
    let cursor = skipCSSWhitespace(source, start)
    if (source[cursor] === ':') {
        const colonLength = source[cursor + 1] === ':' ? 2 : 1
        pushHighlightToken(tokens, cursor, colonLength, 'operator', 'directive.parameter', ['directive', 'query'])
        const token = readCSSIdent(source, cursor + colonLength)
        if (token.value) {
            pushHighlightToken(tokens, token.start, token.value.length, 'variable', 'directive.parameter', ['directive', 'query'])
            cursor = token.end
        }
    } else {
        const token = readCSSIdent(source, cursor)
        if (token.value) {
            pushHighlightToken(tokens, token.start, token.value.length, 'variable', 'directive.parameter', ['directive', 'query'])
            cursor = token.end
        }
    }
    const at = source.indexOf('@', cursor)
    if (at !== -1 && at < end) {
        tokens.push(...tokenizeAtQuery(source.slice(at, end).replace(/;$/, ''), at))
        return
    }
    const selectorStart = source.indexOf('(', cursor)
    if (selectorStart !== -1 && selectorStart < end) {
        tokenizeSelectorPrelude(source, selectorStart, end, tokens)
    }
}

export function tokenizeComposePrelude(source: string, start: number, end: number, tokens: HighlightTokenItem[], css: MasterCSS) {
    if (collectCSSQuotedStringRanges(source, start, end).length) {
        return
    }
    const classListStart = skipCSSWhitespace(source, start)
    let classListEnd = end
    while (classListEnd > classListStart && /\s/.test(source[classListEnd - 1] || '')) classListEnd--
    if (classListEnd <= classListStart) return
    tokens.push(...collectClassListHighlightTokenItems(css, source.slice(classListStart, classListEnd), classListStart))
}

export function tokenizeVariantPrelude(source: string, start: number, end: number, tokens: HighlightTokenItem[]) {
    const cursor = skipCSSWhitespace(source, start)
    if (cursor >= end) return
    const token = source.slice(cursor, end).replace(/\s*\{$/, '').trim()
    tokens.push(...tokenizeState(token, 0, cursor))
}
