import { pushHighlightToken, type HighlightTokenItem } from '../highlight'
import {
    collectCSSDeclarationRanges,
    findCSSClosingQuote,
    skipCSSWhitespace,
    type SourceRange
} from '@master/css-lexer'
import { parse, walk, type CssLocation, type CssNode } from 'css-tree'

type DeclarationPropertyMode = 'none' | 'settings' | 'theme'

interface NativeCSSTokenizeOptions {
    declarationProperties?: DeclarationPropertyMode
    requireCleanParse?: boolean
}

function getNodeRange(node: { loc?: CssLocation }, offset: number, start: number, end: number): SourceRange | undefined {
    if (!node.loc) return
    const range = {
        start: offset + node.loc.start.offset,
        end: offset + node.loc.end.offset
    }
    if (range.start < start || range.end > end || range.end <= range.start) return
    return range
}

function trimRange(source: string, start: number, end: number) {
    while (start < end && /\s/.test(source[start] || '')) start++
    while (end > start && /\s/.test(source[end - 1] || '')) end--
    return { start, end }
}

function pushDeclarationProperty(source: string, start: number, end: number, tokens: HighlightTokenItem[], mode: DeclarationPropertyMode = 'none') {
    if (mode === 'none') return
    const propertyRange = trimRange(source, start, end)
    if (propertyRange.end <= propertyRange.start) return

    const property = source.slice(propertyRange.start, propertyRange.end)
    if (mode === 'theme') {
        if (property.startsWith('--')) {
            pushHighlightToken(tokens, propertyRange.start, property.length, 'variable', 'theme.variable')
        }
        return
    }

    pushHighlightToken(tokens, propertyRange.start, property.length, 'property', 'declaration.property')
}

function isMasterVariableStart(source: string, index: number) {
    return source[index] === '$' && /[_a-zA-Z-]/.test(source[index + 1] || '')
}

function readMasterVariable(source: string, index: number) {
    let end = index + 2
    while (/[_a-zA-Z0-9-]/.test(source[end] || '')) end++
    return end
}

function tokenizeMasterCSSValueSyntax(source: string, start: number, end: number, tokens: HighlightTokenItem[]) {
    for (let cursor = start; cursor < end; cursor++) {
        const char = source[cursor]
        const next = source[cursor + 1]

        if (char === '/' && next === '*') {
            const close = source.indexOf('*/', cursor + 2)
            cursor = close === -1 ? end : close + 1
            continue
        }

        if (char === '"' || char === '\'') {
            cursor = findCSSClosingQuote(source, cursor, char, end)
            continue
        }

        if (isMasterVariableStart(source, cursor)) {
            const variableEnd = readMasterVariable(source, cursor)
            pushHighlightToken(tokens, cursor, variableEnd - cursor, 'variable', 'value.variable')
            cursor = variableEnd - 1
            continue
        }

        if (source.startsWith('--value', cursor) && source[cursor + 7] === '(') {
            pushHighlightToken(tokens, cursor, 7, 'function', 'value.function.name')
            cursor += 6
        }
    }
}

function getDeclarationParts(source: string, range: SourceRange) {
    const propertyStart = skipCSSWhitespace(source, range.start)
    const separator = source.indexOf(':', propertyStart)
    if (separator === -1 || separator >= range.end) return
    let propertyEnd = separator
    while (propertyEnd > propertyStart && /\s/.test(source[propertyEnd - 1] || '')) propertyEnd--
    let valueEnd = range.end
    if (source[valueEnd - 1] === ';') valueEnd--
    return {
        propertyStart,
        propertyEnd,
        valueStart: skipCSSWhitespace(source, separator + 1),
        valueEnd
    }
}

function tokenizeNativeCSSAst(source: string, ast: CssNode, offset: number, start: number, end: number, tokens: HighlightTokenItem[], options: NativeCSSTokenizeOptions) {
    walk(ast, function (node) {
        const range = getNodeRange(node, offset, start, end)
        if (!range) return

        switch (node.type) {
            case 'Declaration': {
                const parts = getDeclarationParts(source, range)
                if (!parts) return
                pushDeclarationProperty(source, parts.propertyStart, parts.propertyEnd, tokens, options.declarationProperties)
                break
            }
            case 'Function': {
                const name = (node as CssNode & { name: string }).name
                if (name === '--value') {
                    pushHighlightToken(tokens, range.start, name.length, 'function', 'value.function.name')
                }
                break
            }
            case 'Identifier':
                if (source[range.start] === '$') {
                    pushHighlightToken(tokens, range.start, range.end - range.start, 'variable', 'value.variable')
                }
                break
            case 'Raw':
                tokenizeMasterCSSValueSyntax(source, range.start, range.end, tokens)
                break
        }
    })
}

export function tokenizeNativeCSSRange(
    source: string,
    start: number,
    end: number,
    tokens: HighlightTokenItem[],
    context: 'stylesheet' | 'declarationList',
    options: NativeCSSTokenizeOptions = {}
) {
    let hasParseError = false
    let ast: CssNode
    try {
        ast = parse(source.slice(start, end), {
            context,
            positions: true,
            parseAtrulePrelude: true,
            parseRulePrelude: true,
            parseValue: true,
            parseCustomProperty: true,
            onParseError() {
                hasParseError = true
            }
        })
    } catch {
        return false
    }
    if (options.requireCleanParse && hasParseError) return false
    tokenizeNativeCSSAst(source, ast, start, start, end, tokens, options)
    return true
}

export function tokenizeDeclarations(source: string, start: number, end: number, tokens: HighlightTokenItem[], options: NativeCSSTokenizeOptions = {}) {
    if (tokenizeNativeCSSRange(source, start, end, tokens, 'declarationList', options)) return

    for (const declaration of collectCSSDeclarationRanges(source, start, end)) {
        pushDeclarationProperty(source, declaration.propertyRange.start, declaration.propertyRange.end, tokens, options.declarationProperties)
        tokenizeMasterCSSValueSyntax(source, declaration.valueRange.start, declaration.valueRange.end, tokens)
    }
}
