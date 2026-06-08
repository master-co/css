import { pushHighlightToken, toSemanticTokenItems, type HighlightTokenItem } from './highlight'
import { collectClassListHighlightTokenItems, tokenizeAtQuery, tokenizeUtilityValue } from './tokenize-class'
import type { MasterCSS } from '@master/css'

const CSS_LANGUAGE_IDS = new Set(['css', 'scss', 'less'])
const MASTER_AT_RULES = new Set(['master', 'theme', 'custom-at', 'custom-selector', 'compose', 'at'])
const MASTER_STANDALONE_NAMES = new Set(['shake', 'no-shake', 'source', 'class'])
const MASTER_STANDALONE_MODIFIERS = new Set(['exclude', 'force'])

interface ScanOptions {
    positionOffset?: number
}

interface SourceRange {
    start: number
    end: number
}

function isIdentChar(char: string | undefined) {
    return Boolean(char && /[-_a-zA-Z0-9]/.test(char))
}

function isIdentStart(char: string | undefined) {
    return Boolean(char && /[_a-zA-Z-]/.test(char))
}

function skipWhitespace(source: string, index: number) {
    while (/\s/.test(source[index] || '')) index++
    return index
}

function readIdent(source: string, index: number) {
    const start = index
    while (isIdentChar(source[index])) index++
    return {
        start,
        end: index,
        value: source.slice(start, index)
    }
}

function findStatementEnd(source: string, start: number) {
    let quote = ''
    let comment = false
    let depth = 0
    for (let i = start; i < source.length; i++) {
        const char = source[i]
        const next = source[i + 1]
        if (comment) {
            if (char === '*' && next === '/') {
                comment = false
                i++
            }
            continue
        }
        if (quote) {
            if (char === '\\') i++
            else if (char === quote) quote = ''
            continue
        }
        if (char === '/' && next === '*') {
            comment = true
            i++
            continue
        }
        if (char === '"' || char === '\'') {
            quote = char
            continue
        }
        if (char === '(' || char === '[') {
            depth++
            continue
        }
        if (char === ')' || char === ']') {
            depth = Math.max(0, depth - 1)
            continue
        }
        if (depth === 0 && char === ';') return i + 1
        if (depth === 0 && char === '{') return i
    }
    return source.length
}

function findMatchingBrace(source: string, open: number) {
    let quote = ''
    let comment = false
    let depth = 0
    for (let i = open; i < source.length; i++) {
        const char = source[i]
        const next = source[i + 1]
        if (comment) {
            if (char === '*' && next === '/') {
                comment = false
                i++
            }
            continue
        }
        if (quote) {
            if (char === '\\') i++
            else if (char === quote) quote = ''
            continue
        }
        if (char === '/' && next === '*') {
            comment = true
            i++
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
            if (depth === 0) return i
        }
    }
    return source.length - 1
}

function findClosingQuote(source: string, start: number, quote: string, limit: number) {
    for (let i = start + 1; i < limit; i++) {
        if (source[i] === '\\') {
            i++
            continue
        }
        if (source[i] === quote) return i
    }
    return limit - 1
}

function containsPosition(range: SourceRange, options: ScanOptions) {
    return options.positionOffset === undefined || (range.start <= options.positionOffset && options.positionOffset <= range.end)
}

function collectQuotedStrings(source: string, start: number, end: number) {
    const strings: SourceRange[] = []
    let comment = false
    for (let i = start; i < end; i++) {
        const char = source[i]
        const next = source[i + 1]
        if (comment) {
            if (char === '*' && next === '/') {
                comment = false
                i++
            }
            continue
        }
        if (char === '/' && next === '*') {
            comment = true
            i++
            continue
        }
        if (char === '"' || char === '\'') {
            const close = findClosingQuote(source, i, char, end)
            strings.push({ start: i, end: close + 1 })
            i = close
        }
    }
    return strings
}

function tokenizeDeclarations(source: string, start: number, end: number, tokens: HighlightTokenItem[]) {
    let quote = ''
    let comment = false
    let depth = 0
    let propertyStart = -1
    let colon = -1
    let declarationStart = start

    const flushDeclaration = (declarationEnd: number) => {
        if (propertyStart === -1 || colon === -1) return
        const rawProperty = source.slice(propertyStart, colon).trim()
        const propertyOffset = propertyStart + source.slice(propertyStart, colon).search(/\S/)
        if (rawProperty.startsWith('--')) {
            pushHighlightToken(tokens, propertyOffset, rawProperty.length, 'variable', 'theme.variable')
        } else {
            pushHighlightToken(tokens, propertyOffset, rawProperty.length, 'property', 'declaration.property')
        }
        pushHighlightToken(tokens, colon, 1, 'operator', 'declaration.separator')
        const valueStart = skipWhitespace(source, colon + 1)
        const rawValueEnd = source.slice(valueStart, declarationEnd).search(/\s*$/)
        const valueEnd = rawValueEnd === -1 ? declarationEnd : valueStart + rawValueEnd
        if (valueEnd > valueStart) {
            tokens.push(...tokenizeUtilityValue(source.slice(valueStart, valueEnd), valueStart))
        }
    }

    for (let i = start; i < end; i++) {
        const char = source[i]
        const next = source[i + 1]
        if (comment) {
            if (char === '*' && next === '/') {
                comment = false
                i++
            }
            continue
        }
        if (quote) {
            if (char === '\\') i++
            else if (char === quote) quote = ''
            continue
        }
        if (char === '/' && next === '*') {
            comment = true
            i++
            continue
        }
        if (char === '"' || char === '\'') {
            quote = char
            continue
        }
        if (char === '(' || char === '[') {
            depth++
            continue
        }
        if (char === ')' || char === ']') {
            depth = Math.max(0, depth - 1)
            continue
        }
        if (depth !== 0) continue
        if (propertyStart === -1 && isIdentStart(char)) {
            propertyStart = i
        }
        if (char === ':' && colon === -1 && propertyStart !== -1) {
            colon = i
            continue
        }
        if (char === ';') {
            flushDeclaration(i)
            pushHighlightToken(tokens, i, 1, 'operator', 'declaration.terminator')
            propertyStart = -1
            colon = -1
            declarationStart = i + 1
        } else if (char === '{' || char === '}') {
            propertyStart = -1
            colon = -1
            declarationStart = i + 1
        }
    }
    flushDeclaration(end)
    void declarationStart
}

function pushQuoteDelimiters(tokens: HighlightTokenItem[], start: number, end: number) {
    pushHighlightToken(tokens, start, 1, 'string', 'value.string.quote', ['quoted'])
    pushHighlightToken(tokens, end - 1, 1, 'string', 'value.string.quote', ['quoted'])
}

function pushQuotedString(tokens: HighlightTokenItem[], start: number, end: number) {
    pushQuoteDelimiters(tokens, start, end)
    if (end > start + 2) {
        pushHighlightToken(tokens, start + 1, end - start - 2, 'string', 'value.string', ['quoted'])
    }
}

function tokenizeMasterPrelude(source: string, start: number, end: number, tokens: HighlightTokenItem[], css: MasterCSS) {
    let cursor = skipWhitespace(source, start)
    const name = readIdent(source, cursor)
    if (MASTER_STANDALONE_NAMES.has(name.value)) {
        pushHighlightToken(tokens, name.start, name.value.length, 'property', 'directive.parameter', ['directive'])
        cursor = name.end
    }

    while (cursor < end) {
        cursor = skipWhitespace(source, cursor)
        const char = source[cursor]
        if (char === '"' || char === '\'') {
            const close = findClosingQuote(source, cursor, char, end)
            const innerStart = cursor + 1
            const inner = source.slice(innerStart, close)
            if (name.value === 'class') {
                pushQuoteDelimiters(tokens, cursor, close + 1)
                tokens.push(...collectClassListHighlightTokenItems(css, inner, innerStart))
            } else {
                pushQuotedString(tokens, cursor, close + 1)
            }
            cursor = close + 1
            continue
        }
        if (isIdentStart(char)) {
            const ident = readIdent(source, cursor)
            if (MASTER_STANDALONE_MODIFIERS.has(ident.value)) {
                pushHighlightToken(tokens, ident.start, ident.value.length, 'modifier', 'directive.modifier', ['directive'])
            } else if (ident.start !== name.start) {
                pushHighlightToken(tokens, ident.start, ident.value.length, 'enumMember', 'directive.parameter', ['directive'])
            }
            cursor = ident.end
            continue
        }
        cursor++
    }
}

function tokenizeThemePrelude(source: string, start: number, end: number, tokens: HighlightTokenItem[]) {
    const cursor = skipWhitespace(source, start)
    if (cursor >= end) return
    const mode = readIdent(source, cursor)
    if (mode.value) pushHighlightToken(tokens, mode.start, mode.value.length, 'enumMember', 'directive.parameter', ['directive'])
}

function tokenizeCustomAtPrelude(source: string, start: number, end: number, tokens: HighlightTokenItem[]) {
    let cursor = skipWhitespace(source, start)
    const token = readIdent(source, cursor)
    if (token.value) {
        pushHighlightToken(tokens, token.start, token.value.length, 'variable', 'directive.parameter', ['directive', 'query'])
        cursor = token.end
    }
    const at = source.indexOf('@', cursor)
    if (at !== -1 && at < end) {
        tokens.push(...tokenizeAtQuery(source.slice(at, end).replace(/;$/, ''), at))
    }
}

function tokenizeSelectorPrelude(source: string, start: number, end: number, tokens: HighlightTokenItem[]) {
    for (let i = start; i < end;) {
        const char = source[i]
        if (char === ':') {
            const colonLength = source[i + 1] === ':' ? 2 : 1
            const modifier = colonLength === 2 ? 'pseudoElement' : 'pseudoClass'
            pushHighlightToken(tokens, i, colonLength, 'operator', colonLength === 2 ? 'selector.pseudoElement.delimiter' : 'selector.pseudoClass.delimiter', ['selector', modifier])
            const ident = readIdent(source, i + colonLength)
            if (ident.value) {
                pushHighlightToken(tokens, ident.start, ident.value.length, 'modifier', colonLength === 2 ? 'selector.pseudoElement.name' : 'selector.pseudoClass.name', [modifier])
                i = ident.end
                continue
            }
        } else if (char === '.' && isIdentStart(source[i + 1])) {
            const ident = readIdent(source, i + 1)
            pushHighlightToken(tokens, i, 1, 'operator', 'selector.class', ['selector'])
            pushHighlightToken(tokens, ident.start, ident.value.length, 'class', 'selector.class', ['selector'])
            i = ident.end
            continue
        } else if (char === '(' || char === ')' || char === ',' || char === '>' || char === '+' || char === '~') {
            pushHighlightToken(tokens, i, 1, 'operator', char === ',' || char === '>' || char === '+' || char === '~' ? 'selector.combinator' : 'selector.punctuation', ['selector'])
        } else if (isIdentStart(char)) {
            const ident = readIdent(source, i)
            pushHighlightToken(tokens, ident.start, ident.value.length, 'type', 'selector.type', ['selector'])
            i = ident.end
            continue
        }
        i++
    }
}

function tokenizeComposePrelude(source: string, start: number, end: number, tokens: HighlightTokenItem[], css: MasterCSS) {
    for (const stringRange of collectQuotedStrings(source, start, end)) {
        pushQuoteDelimiters(tokens, stringRange.start, stringRange.end)
        tokens.push(...collectClassListHighlightTokenItems(css, source.slice(stringRange.start + 1, stringRange.end - 1), stringRange.start + 1))
    }
}

function tokenizeAtPrelude(source: string, start: number, end: number, tokens: HighlightTokenItem[]) {
    const cursor = skipWhitespace(source, start)
    if (cursor >= end) return
    tokens.push(...tokenizeAtQuery(source.slice(cursor, end).replace(/\s*\{$/, ''), cursor))
}

function tokenizeAtRule(source: string, at: number, tokens: HighlightTokenItem[], css: MasterCSS, options: ScanOptions) {
    const name = readIdent(source, at + 1)
    if (!MASTER_AT_RULES.has(name.value)) return at + 1

    const statementEnd = findStatementEnd(source, name.end)
    const blockStart = source[statementEnd] === '{' ? statementEnd : -1
    const end = blockStart === -1 ? statementEnd : findMatchingBrace(source, blockStart) + 1
    if (!containsPosition({ start: at, end }, options)) return end

    pushHighlightToken(tokens, at, name.end - at, 'keyword', 'directive.keyword', ['directive'])

    const preludeStart = name.end
    const preludeEnd = blockStart === -1 ? Math.max(name.end, end - 1) : blockStart
    switch (name.value) {
        case 'master':
            tokenizeMasterPrelude(source, preludeStart, preludeEnd, tokens, css)
            break
        case 'theme':
            tokenizeThemePrelude(source, preludeStart, preludeEnd, tokens)
            break
        case 'custom-at':
            tokenizeCustomAtPrelude(source, preludeStart, preludeEnd, tokens)
            break
        case 'custom-selector':
            tokenizeSelectorPrelude(source, preludeStart, preludeEnd, tokens)
            break
        case 'compose':
            tokenizeComposePrelude(source, preludeStart, preludeEnd, tokens, css)
            break
        case 'at':
            tokenizeAtPrelude(source, preludeStart, preludeEnd, tokens)
            break
    }

    if (blockStart !== -1) {
        const blockEnd = end - 1
        pushHighlightToken(tokens, blockStart, 1, 'operator', 'block.brace', ['directive'])
        if (name.value === 'master' || name.value === 'theme') {
            tokenizeDeclarations(source, blockStart + 1, blockEnd, tokens)
        }
        pushHighlightToken(tokens, blockEnd, 1, 'operator', 'block.brace', ['directive'])
    } else if (source[end - 1] === ';') {
        pushHighlightToken(tokens, end - 1, 1, 'operator', 'directive.terminator', ['directive'])
    }

    return blockStart === -1 ? end : at + 1
}

function tokenizeCSSClassSelectors(source: string, tokens: HighlightTokenItem[], options: ScanOptions) {
    if (options.positionOffset !== undefined) return
    let quote = ''
    let comment = false
    for (let i = 0; i < source.length; i++) {
        const char = source[i]
        const next = source[i + 1]
        if (comment) {
            if (char === '*' && next === '/') {
                comment = false
                i++
            }
            continue
        }
        if (quote) {
            if (char === '\\') i++
            else if (char === quote) quote = ''
            continue
        }
        if (char === '/' && next === '*') {
            comment = true
            i++
            continue
        }
        if (char === '"' || char === '\'') {
            quote = char
            continue
        }
        if (char === '.' && isIdentStart(next)) {
            const ident = readIdent(source, i + 1)
            pushHighlightToken(tokens, ident.start, ident.value.length, 'class', 'selector.class', ['selector'])
            i = ident.end - 1
        }
    }
}

export function isCSSSemanticTokenDocument(languageId: string) {
    return CSS_LANGUAGE_IDS.has(languageId)
}

export function collectCSSHighlightTokenItems(source: string, css: MasterCSS, languageId: string, options: ScanOptions = {}): HighlightTokenItem[] {
    if (!isCSSSemanticTokenDocument(languageId)) return []

    const tokens: HighlightTokenItem[] = []
    let quote = ''
    let comment = false
    for (let i = 0; i < source.length; i++) {
        const char = source[i]
        const next = source[i + 1]
        if (comment) {
            if (char === '*' && next === '/') {
                comment = false
                i++
            }
            continue
        }
        if (quote) {
            if (char === '\\') i++
            else if (char === quote) quote = ''
            continue
        }
        if (char === '/' && next === '*') {
            comment = true
            i++
            continue
        }
        if (char === '"' || char === '\'') {
            quote = char
            continue
        }
        if (char === '@') {
            i = tokenizeAtRule(source, i, tokens, css, options) - 1
        }
    }

    tokenizeCSSClassSelectors(source, tokens, options)
    return tokens
}

export function collectCSSSemanticTokenItems(source: string, css: MasterCSS, languageId: string, options: ScanOptions = {}) {
    return toSemanticTokenItems(collectCSSHighlightTokenItems(source, css, languageId, options))
}
