import { pushHighlightToken, type HighlightTokenItem } from '../highlight'
import { findCSSClosingQuote, isCSSIdentStart, readCSSIdent } from '@master/css-lexer'

export function tokenizeSelectorPrelude(source: string, start: number, end: number, tokens: HighlightTokenItem[]) {
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
