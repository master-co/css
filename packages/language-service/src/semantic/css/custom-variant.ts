import { pushHighlightToken, type HighlightTokenItem } from '../highlight'
import {
    findCSSBlockEnd,
    findCSSClosingQuote,
    findCSSStatementEnd,
    readCSSIdent,
    skipCSSWhitespace
} from '@master/css-lexer'

export function tokenizeCustomVariantBlock(source: string, start: number, end: number, tokens: HighlightTokenItem[]) {
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
            }
        }

        if (statementEnd.reason !== 'block' || !statementEnd.delimiterRange || statementEnd.delimiterRange.start >= end) {
            cursor = Math.max(cursor + 1, Math.min(statementEnd.end, end))
            continue
        }

        const blockStart = statementEnd.delimiterRange.start
        const blockEnd = findCSSBlockEnd(source, blockStart)
        tokenizeCustomVariantBlock(source, blockStart + 1, blockEnd === -1 ? end : Math.min(blockEnd, end), tokens)
        cursor = blockEnd === -1 ? end : blockEnd + 1
    }
}
