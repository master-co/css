import { pushHighlightToken, type HighlightTokenItem } from '../highlight'
import {
    collectCSSDeclarationRanges,
    findCSSClosingQuote
} from '@master/css-lexer'

type DeclarationPropertyMode = 'none' | 'settings' | 'theme'

interface NativeCSSTokenizeOptions {
    declarationProperties?: DeclarationPropertyMode
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

export function tokenizeDeclarations(source: string, start: number, end: number, tokens: HighlightTokenItem[], options: NativeCSSTokenizeOptions = {}) {
    for (const declaration of collectCSSDeclarationRanges(source, start, end)) {
        pushDeclarationProperty(source, declaration.propertyRange.start, declaration.propertyRange.end, tokens, options.declarationProperties)
        tokenizeMasterCSSValueSyntax(source, declaration.valueRange.start, declaration.valueRange.end, tokens)
    }
}
