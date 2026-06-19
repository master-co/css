import { pushHighlightToken, toSemanticTokenItems, type HighlightTokenItem } from './highlight'
import { collectClassListHighlightTokenItems, tokenizeAtQuery, tokenizeState, tokenizeUtilityValue } from './tokenize-class'
import type { MasterCSS } from '../master-css'
import {
    collectCSSDeclarationRanges,
    collectCSSDirectiveRanges,
    collectCSSQuotedStringRanges,
    findCSSBlockEnd,
    findCSSClosingQuote,
    findCSSStatementEnd,
    isCSSIdentStart,
    readCSSIdent,
    skipCSSWhitespace,
    type CSSDirectiveRuleRange,
    type SourceRange
} from '@master/css-lexer'

const CSS_LANGUAGE_IDS = new Set(['css', 'scss', 'less'])
const SOURCE_MODIFIERS = new Set(['not', 'required'])
const PRESERVE_PARAMETERS = new Set(['native'])
const THEME_MODIFIERS = new Set(['inline', 'static'])
const MANAGED_DEFINITION_DIRECTIVES = new Set(['defaults', 'components', 'utilities'])
const MANAGED_BODY_DIRECTIVES = new Set(['compose', 'variant', 'dark', 'light'])

interface ScanOptions {
    positionOffset?: number
}

function containsPosition(range: SourceRange, options: ScanOptions) {
    return options.positionOffset === undefined || (range.start <= options.positionOffset && options.positionOffset <= range.end)
}

function tokenizeDeclarations(source: string, start: number, end: number, tokens: HighlightTokenItem[], directiveName?: CSSDirectiveRuleRange['name']) {
    for (const declaration of collectCSSDeclarationRanges(source, start, end)) {
        const rawProperty = source.slice(declaration.propertyRange.start, declaration.propertyRange.end)
        const propertyOffset = declaration.propertyRange.start
        if (directiveName === 'theme' || rawProperty.startsWith('--')) {
            pushHighlightToken(tokens, propertyOffset, rawProperty.length, 'variable', 'theme.variable')
        } else {
            pushHighlightToken(tokens, propertyOffset, rawProperty.length, 'property', 'declaration.property')
        }
        pushHighlightToken(tokens, declaration.separatorRange.start, 1, 'operator', 'declaration.separator')
        if (declaration.valueRange.end > declaration.valueRange.start) {
            tokens.push(...tokenizeUtilityValue(source.slice(declaration.valueRange.start, declaration.valueRange.end), declaration.valueRange.start))
        }
        if (declaration.terminatorRange) {
            pushHighlightToken(tokens, declaration.terminatorRange.start, 1, 'operator', 'declaration.terminator')
        }
    }
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

function tokenizeSourcePrelude(source: string, start: number, end: number, tokens: HighlightTokenItem[]) {
    let cursor = skipCSSWhitespace(source, start)
    while (cursor < end) {
        cursor = skipCSSWhitespace(source, cursor)
        const char = source[cursor]
        if (char === '"' || char === '\'') {
            const close = findCSSClosingQuote(source, cursor, char, end)
            pushQuotedString(tokens, cursor, close + 1)
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

function tokenizeClassListPrelude(source: string, start: number, end: number, tokens: HighlightTokenItem[], css: MasterCSS) {
    for (const stringRange of collectCSSQuotedStringRanges(source, start, end)) {
        pushQuoteDelimiters(tokens, stringRange.start, stringRange.end)
        tokens.push(...collectClassListHighlightTokenItems(css, source.slice(stringRange.start + 1, stringRange.end - 1), stringRange.start + 1))
    }
}

function tokenizeQuotedStringPrelude(source: string, start: number, end: number, tokens: HighlightTokenItem[]) {
    for (const stringRange of collectCSSQuotedStringRanges(source, start, end)) {
        pushQuotedString(tokens, stringRange.start, stringRange.end)
    }
}

function tokenizePreservePrelude(source: string, start: number, end: number, tokens: HighlightTokenItem[]) {
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

function tokenizeThemePrelude(source: string, start: number, end: number, tokens: HighlightTokenItem[]) {
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

function tokenizeCustomVariantPrelude(source: string, start: number, end: number, tokens: HighlightTokenItem[]) {
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

function tokenizeSelectorPrelude(source: string, start: number, end: number, tokens: HighlightTokenItem[]) {
    for (let i = start; i < end;) {
        const char = source[i]
        const next = source[i + 1]
        if (char === '/' && next === '*') {
            const close = source.indexOf('*/', i + 2)
            i = close === -1 ? end : close + 2
            continue
        }
        if (char === '"' || char === '\'') {
            i = findCSSClosingQuote(source, i, char, end) + 1
            continue
        }
        if (char === ':') {
            const colonLength = source[i + 1] === ':' ? 2 : 1
            const modifier = colonLength === 2 ? 'pseudoElement' : 'pseudoClass'
            pushHighlightToken(tokens, i, colonLength, 'operator', colonLength === 2 ? 'selector.pseudoElement.delimiter' : 'selector.pseudoClass.delimiter', ['selector', modifier])
            const ident = readCSSIdent(source, i + colonLength)
            if (ident.value) {
                pushHighlightToken(tokens, ident.start, ident.value.length, 'modifier', colonLength === 2 ? 'selector.pseudoElement.name' : 'selector.pseudoClass.name', [modifier])
                i = ident.end
                continue
            }
        } else if (char === '.' && isCSSIdentStart(source[i + 1])) {
            const ident = readCSSIdent(source, i + 1)
            pushHighlightToken(tokens, i, 1, 'operator', 'selector.class', ['selector'])
            pushHighlightToken(tokens, ident.start, ident.value.length, 'class', 'selector.class', ['selector'])
            i = ident.end
            continue
        } else if (char === '#' && isCSSIdentStart(source[i + 1])) {
            const ident = readCSSIdent(source, i + 1)
            pushHighlightToken(tokens, i, 1, 'operator', 'selector.id', ['selector'])
            pushHighlightToken(tokens, ident.start, ident.value.length, 'variable', 'selector.id', ['selector'])
            i = ident.end
            continue
        } else if (char === '&' || char === '(' || char === ')' || char === '[' || char === ']' || char === ',' || char === '>' || char === '+' || char === '~') {
            pushHighlightToken(tokens, i, 1, 'operator', char === ',' || char === '>' || char === '+' || char === '~' ? 'selector.combinator' : 'selector.punctuation', ['selector'])
        } else if (isCSSIdentStart(char)) {
            const ident = readCSSIdent(source, i)
            pushHighlightToken(tokens, ident.start, ident.value.length, 'type', 'selector.type', ['selector'])
            i = ident.end
            continue
        }
        i++
    }
}

function tokenizeCustomVariantBlock(source: string, start: number, end: number, tokens: HighlightTokenItem[]) {
    for (let cursor = start; cursor < end;) {
        cursor = skipCSSWhitespace(source, cursor)
        if (cursor >= end) break

        const char = source[cursor]
        const next = source[cursor + 1]
        if (char === '/' && next === '*') {
            const close = source.indexOf('*/', cursor + 2)
            cursor = close === -1 ? end : close + 2
            continue
        }
        if (char === '"' || char === '\'') {
            cursor = findCSSClosingQuote(source, cursor, char, end) + 1
            continue
        }

        const statementEnd = findCSSStatementEnd(source, cursor)
        if (statementEnd.end > end) break

        if (char === '@') {
            const atName = readCSSIdent(source, cursor + 1)
            if (atName.value === 'slot') {
                pushHighlightToken(tokens, cursor, atName.end - cursor, 'keyword', 'directive.keyword', ['directive'])
                if (statementEnd.reason === 'semicolon' && statementEnd.delimiterRange && statementEnd.delimiterRange.start < end) {
                    pushHighlightToken(tokens, statementEnd.delimiterRange.start, 1, 'operator', 'directive.terminator', ['directive'])
                }
            } else {
                const preludeEnd = Math.min(statementEnd.reason === 'semicolon' ? statementEnd.end - 1 : statementEnd.end, end)
                tokens.push(...tokenizeAtQuery(source.slice(cursor, preludeEnd), cursor))
            }
        } else if (statementEnd.reason === 'block') {
            tokenizeSelectorPrelude(source, cursor, Math.min(statementEnd.end, end), tokens)
        }

        if (statementEnd.reason !== 'block' || !statementEnd.delimiterRange || statementEnd.delimiterRange.start >= end) {
            cursor = Math.max(cursor + 1, Math.min(statementEnd.end, end))
            continue
        }

        const blockStart = statementEnd.delimiterRange.start
        const blockEnd = findCSSBlockEnd(source, blockStart)
        pushHighlightToken(tokens, blockStart, 1, 'operator', 'block.brace')
        tokenizeCustomVariantBlock(source, blockStart + 1, blockEnd === -1 ? end : Math.min(blockEnd, end), tokens)
        if (blockEnd !== -1 && blockEnd < end) {
            pushHighlightToken(tokens, blockEnd, 1, 'operator', 'block.brace')
        }
        cursor = blockEnd === -1 ? end : blockEnd + 1
    }
}

function tokenizeComposePrelude(source: string, start: number, end: number, tokens: HighlightTokenItem[], css: MasterCSS) {
    if (collectCSSQuotedStringRanges(source, start, end).length) {
        tokenizeQuotedStringPrelude(source, start, end, tokens)
        return
    }
    const classListStart = skipCSSWhitespace(source, start)
    let classListEnd = end
    while (classListEnd > classListStart && /\s/.test(source[classListEnd - 1] || '')) classListEnd--
    if (classListEnd <= classListStart) return
    tokens.push(...collectClassListHighlightTokenItems(css, source.slice(classListStart, classListEnd), classListStart))
}

function tokenizeVariantPrelude(source: string, start: number, end: number, tokens: HighlightTokenItem[]) {
    const cursor = skipCSSWhitespace(source, start)
    if (cursor >= end) return
    const token = source.slice(cursor, end).replace(/\s*\{$/, '').trim()
    tokens.push(...tokenizeState(token, 0, cursor))
}

function isManagedPatternValueChar(char: string | undefined) {
    return Boolean(char && /[-_a-zA-Z0-9]/.test(char))
}

function readManagedPatternValue(source: string, index: number) {
    const start = index
    while (isManagedPatternValueChar(source[index])) index++
    return {
        start,
        end: index,
        value: source.slice(start, index)
    }
}

function tokenizeManagedEnumPatternName(source: string, start: number, end: number, tokens: HighlightTokenItem[]) {
    const pattern = source.slice(start, end)
    const open = pattern.indexOf('<')
    const close = pattern.lastIndexOf('>')
    if (open === -1 || close === -1 || close < open) {
        tokenizeSelectorPrelude(source, start, end, tokens)
        return
    }
    const prefixStart = skipCSSWhitespace(source, start)
    const openOffset = start + open
    if (openOffset > prefixStart) {
        pushHighlightToken(tokens, prefixStart, openOffset - prefixStart, 'class', 'selector.class', ['selector'])
    }
    pushHighlightToken(tokens, openOffset, 1, 'operator', 'selector.punctuation', ['selector'])
    for (let cursor = openOffset + 1; cursor < start + close;) {
        cursor = skipCSSWhitespace(source, cursor)
        const char = source[cursor]
        if (char === '|') {
            pushHighlightToken(tokens, cursor, 1, 'operator', 'selector.punctuation', ['selector'])
            cursor++
            continue
        }
        const value = readManagedPatternValue(source, cursor)
        if (value.value) {
            pushHighlightToken(tokens, value.start, value.value.length, 'enumMember', 'selector.class', ['selector'])
            cursor = value.end
            continue
        }
        cursor++
    }
    pushHighlightToken(tokens, start + close, 1, 'operator', 'selector.punctuation', ['selector'])
}

function tokenizeManagedDynamicPatternName(source: string, start: number, end: number, tokens: HighlightTokenItem[]) {
    const pattern = source.slice(start, end)
    const open = pattern.indexOf('<')
    const close = pattern.lastIndexOf('>')
    if (open === -1 || close === -1 || close < open) {
        tokenizeSelectorPrelude(source, start, end, tokens)
        return
    }

    const keyStart = skipCSSWhitespace(source, start)
    const openOffset = start + open
    const closeOffset = start + close
    const colonOffset = source.lastIndexOf(':', openOffset)
    if (colonOffset <= keyStart) {
        tokenizeManagedEnumPatternName(source, start, end, tokens)
        return
    }

    pushHighlightToken(tokens, keyStart, colonOffset - keyStart, 'property', 'declaration.property')
    pushHighlightToken(tokens, colonOffset, 1, 'operator', 'declaration.separator')
    pushHighlightToken(tokens, openOffset, 1, 'operator', 'directive.parameter', ['directive'])

    for (let cursor = openOffset + 1; cursor < closeOffset;) {
        cursor = skipCSSWhitespace(source, cursor)
        const char = source[cursor]
        if (char === '|' || char === '~' || char === '=' || char === '*') {
            pushHighlightToken(tokens, cursor, 1, 'operator', 'directive.parameter', ['directive'])
            cursor++
            if (char === '~' || char === '=') {
                const namespace = readManagedPatternValue(source, cursor)
                if (namespace.value) {
                    pushHighlightToken(tokens, namespace.start, namespace.value.length, 'variable', 'directive.parameter', ['directive'])
                    cursor = namespace.end
                }
            }
            continue
        }
        const value = readManagedPatternValue(source, cursor)
        if (value.value) {
            pushHighlightToken(tokens, value.start, value.value.length, 'enumMember', 'directive.parameter', ['directive'])
            cursor = value.end
            continue
        }
        cursor++
    }

    pushHighlightToken(tokens, closeOffset, 1, 'operator', 'directive.parameter', ['directive'])
}

function tokenizeManagedEntryName(source: string, start: number, end: number, tokens: HighlightTokenItem[]) {
    const name = source.slice(start, end)
    if (name.includes('<') || name.includes('>')) {
        if (name.slice(0, name.indexOf('<')).includes(':')) {
            tokenizeManagedDynamicPatternName(source, start, end, tokens)
        } else {
            tokenizeManagedEnumPatternName(source, start, end, tokens)
        }
        return
    }

    const nameStart = skipCSSWhitespace(source, start)
    if (end > nameStart) {
        pushHighlightToken(tokens, nameStart, end - nameStart, 'class', 'selector.class', ['selector'])
    }
}

function tokenizeManagedEntryBody(source: string, start: number, end: number, tokens: HighlightTokenItem[]) {
    for (let index = start; index < end; index++) {
        const char = source[index]
        const next = source[index + 1]
        if (/\s/.test(char)) continue
        if (char === '/' && next === '*') {
            const close = source.indexOf('*/', index + 2)
            index = close === -1 ? end : close + 1
            continue
        }
        if (char === '"' || char === '\'') {
            index = findCSSClosingQuote(source, index, char, end)
            continue
        }

        const statementEnd = findCSSStatementEnd(source, index)
        if (statementEnd.end > end) break

        if (char === '@') {
            const atName = readCSSIdent(source, index + 1)
            if (statementEnd.reason === 'block' && statementEnd.delimiterRange) {
                const blockStart = statementEnd.delimiterRange.start
                const blockEnd = findCSSBlockEnd(source, blockStart)
                const contentEnd = blockEnd === -1 ? end : Math.min(blockEnd, end)
                const isManagedDirective = MANAGED_BODY_DIRECTIVES.has(atName.value)
                if (!isManagedDirective) {
                    tokens.push(...tokenizeAtQuery(source.slice(index, blockStart), index))
                    pushHighlightToken(tokens, blockStart, 1, 'operator', 'block.brace')
                }
                tokenizeManagedEntryBody(source, blockStart + 1, contentEnd, tokens)
                if (!isManagedDirective && blockEnd !== -1 && blockEnd < end) {
                    pushHighlightToken(tokens, blockEnd, 1, 'operator', 'block.brace')
                }
                index = blockEnd === -1 ? end : blockEnd
                continue
            }
            if (!MANAGED_BODY_DIRECTIVES.has(atName.value)) {
                const preludeEnd = Math.min(statementEnd.reason === 'semicolon' ? statementEnd.end - 1 : statementEnd.end, end)
                tokens.push(...tokenizeAtQuery(source.slice(index, preludeEnd), index))
            }
            index = Math.max(index, Math.min(statementEnd.end, end) - 1)
            continue
        }

        if (statementEnd.reason === 'block' && statementEnd.delimiterRange) {
            const blockStart = statementEnd.delimiterRange.start
            const blockEnd = findCSSBlockEnd(source, blockStart)
            const contentEnd = blockEnd === -1 ? end : Math.min(blockEnd, end)
            tokenizeSelectorPrelude(source, index, blockStart, tokens)
            pushHighlightToken(tokens, blockStart, 1, 'operator', 'block.brace')
            tokenizeManagedEntryBody(source, blockStart + 1, contentEnd, tokens)
            if (blockEnd !== -1 && blockEnd < end) {
                pushHighlightToken(tokens, blockEnd, 1, 'operator', 'block.brace')
            }
            index = blockEnd === -1 ? end : blockEnd
            continue
        }

        tokenizeDeclarations(source, index, Math.min(statementEnd.end, end), tokens)
        index = Math.max(index, Math.min(statementEnd.end, end) - 1)
    }
}

function tokenizeManagedDefinitionBlock(source: string, start: number, end: number, tokens: HighlightTokenItem[]) {
    for (let index = start; index < end; index++) {
        const char = source[index]
        const next = source[index + 1]
        if (char === '/' && next === '*') {
            const close = source.indexOf('*/', index + 2)
            index = close === -1 ? end : close + 1
            continue
        }
        if (char === '"' || char === '\'') {
            index = findCSSClosingQuote(source, index, char, end)
            continue
        }
        if (char === '@') {
            const atName = readCSSIdent(source, index + 1)
            const statementEnd = findCSSStatementEnd(source, atName.end)
            if (statementEnd.reason === 'block') {
                const blockStart = statementEnd.end
                const blockEnd = findCSSBlockEnd(source, blockStart)
                if (blockEnd === -1) {
                    tokenizeManagedDefinitionBlock(source, blockStart + 1, end, tokens)
                    break
                }
                tokenizeManagedDefinitionBlock(source, blockStart + 1, blockEnd, tokens)
                index = blockEnd
            } else {
                index = statementEnd.end - 1
            }
            continue
        }
        if (isCSSIdentStart(char)) {
            const ident = readCSSIdent(source, index)
            const statementEnd = findCSSStatementEnd(source, index)
            const blockStart = statementEnd.reason === 'block' ? statementEnd.delimiterRange?.start : -1
            if (blockStart !== undefined && blockStart !== -1) {
                let nameEnd = blockStart
                while (nameEnd > ident.start && /\s/.test(source[nameEnd - 1] || '')) nameEnd--
                tokenizeManagedEntryName(source, ident.start, nameEnd, tokens)
                const blockEnd = findCSSBlockEnd(source, blockStart)
                tokenizeManagedEntryBody(source, blockStart + 1, blockEnd === -1 ? end : Math.min(blockEnd, end), tokens)
                index = blockEnd === -1 ? end : blockEnd
                continue
            }
            const blockStartAfterIdent = skipCSSWhitespace(source, ident.end)
            if (source[blockStartAfterIdent] === '{') {
                tokenizeManagedEntryName(source, ident.start, ident.end, tokens)
                const blockEnd = findCSSBlockEnd(source, blockStartAfterIdent)
                tokenizeManagedEntryBody(source, blockStartAfterIdent + 1, blockEnd === -1 ? end : Math.min(blockEnd, end), tokens)
                index = blockEnd === -1 ? end : blockEnd
                continue
            }
            index = ident.end - 1
        }
    }
}

function tokenizeDirectiveRule(source: string, directive: CSSDirectiveRuleRange, tokens: HighlightTokenItem[], css: MasterCSS, options: ScanOptions) {
    if (!containsPosition(directive, options)) return

    pushHighlightToken(tokens, directive.keywordRange.start, directive.keywordRange.end - directive.keywordRange.start, 'keyword', 'directive.keyword', ['directive'])

    const preludeStart = directive.preludeRange.start
    const preludeEnd = directive.preludeRange.end
    switch (directive.name) {
        case 'source':
            tokenizeSourcePrelude(source, preludeStart, preludeEnd, tokens)
            break
        case 'safelist':
            tokenizeClassListPrelude(source, preludeStart, preludeEnd, tokens, css)
            break
        case 'blocklist':
        case 'reference':
            tokenizeQuotedStringPrelude(source, preludeStart, preludeEnd, tokens)
            break
        case 'preserve':
            tokenizePreservePrelude(source, preludeStart, preludeEnd, tokens)
            break
        case 'settings':
        case 'theme':
            tokenizeThemePrelude(source, preludeStart, preludeEnd, tokens)
            break
        case 'custom-variant':
            tokenizeCustomVariantPrelude(source, preludeStart, preludeEnd, tokens)
            break
        case 'compose':
            tokenizeComposePrelude(source, preludeStart, preludeEnd, tokens, css)
            break
        case 'variant':
            tokenizeVariantPrelude(source, preludeStart, preludeEnd, tokens)
            break
    }

    if (directive.blockRange && directive.blockContentRange) {
        pushHighlightToken(tokens, directive.blockRange.start, 1, 'operator', 'block.brace', ['directive'])
        if (directive.name === 'settings' || directive.name === 'theme') {
            tokenizeDeclarations(source, directive.blockContentRange.start, directive.blockContentRange.end, tokens, directive.name)
        } else if (directive.name === 'custom-variant') {
            tokenizeCustomVariantBlock(source, directive.blockContentRange.start, directive.blockContentRange.end, tokens)
        } else if (MANAGED_DEFINITION_DIRECTIVES.has(directive.name)) {
            tokenizeManagedDefinitionBlock(source, directive.blockContentRange.start, directive.blockContentRange.end, tokens)
        }
        if (directive.blockCloseRange) {
            pushHighlightToken(tokens, directive.blockCloseRange.start, 1, 'operator', 'block.brace', ['directive'])
        }
    } else if (directive.semicolonRange) {
        pushHighlightToken(tokens, directive.semicolonRange.start, 1, 'operator', 'directive.terminator', ['directive'])
    }
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
        if (char === '.' && isCSSIdentStart(next)) {
            const ident = readCSSIdent(source, i + 1)
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
    for (const directive of collectCSSDirectiveRanges(source)) {
        tokenizeDirectiveRule(source, directive, tokens, css, options)
    }

    tokenizeCSSClassSelectors(source, tokens, options)
    return tokens
}

export function collectCSSSemanticTokenItems(source: string, css: MasterCSS, languageId: string, options: ScanOptions = {}) {
    return toSemanticTokenItems(collectCSSHighlightTokenItems(source, css, languageId, options))
}
