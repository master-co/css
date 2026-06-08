import {
    findCSSBlockEnd,
    findCSSClosingQuote,
    findCSSStatementEnd,
    isCSSIdentStart,
    readCSSIdent,
    skipCSSWhitespace,
    type SourceRange
} from './source'

export type { CSSStatementEnd, SourceLocation, SourceRange } from './source'

export type CSSDirectiveRangeName =
    | 'master'
    | 'settings'
    | 'source'
    | 'safelist'
    | 'blocklist'
    | 'preserve'
    | 'theme'
    | 'defaults'
    | 'components'
    | 'utilities'
    | 'custom-at'
    | 'custom-selector'
    | 'compose'
    | 'at'

export interface CSSQuotedStringRange extends SourceRange {
    quote: '"' | '\''
    contentRange: SourceRange
}

export interface CSSDeclarationRange extends SourceRange {
    propertyRange: SourceRange
    separatorRange: SourceRange
    valueRange: SourceRange
    terminatorRange?: SourceRange
}

export interface CSSDirectiveRuleRange extends SourceRange {
    name: CSSDirectiveRangeName
    keywordRange: SourceRange
    preludeRange: SourceRange
    blockRange?: SourceRange
    blockContentRange?: SourceRange
    blockCloseRange?: SourceRange
    semicolonRange?: SourceRange
    quotedStringRanges: CSSQuotedStringRange[]
    depth: number
    origin: 'source-scan'
}

export const CSS_DIRECTIVE_RANGE_NAMES = [
    'master',
    'settings',
    'source',
    'safelist',
    'blocklist',
    'preserve',
    'theme',
    'defaults',
    'components',
    'utilities',
    'custom-at',
    'custom-selector',
    'compose',
    'at'
] as const

const CSS_DIRECTIVE_RANGE_NAME_SET = new Set<string>(CSS_DIRECTIVE_RANGE_NAMES)

export function collectCSSQuotedStringRanges(source: string, start = 0, end = source.length) {
    const ranges: CSSQuotedStringRange[] = []
    let comment = false
    for (let index = start; index < end; index++) {
        const char = source[index]
        const next = source[index + 1]
        if (comment) {
            if (char === '*' && next === '/') {
                comment = false
                index++
            }
            continue
        }
        if (char === '/' && next === '*') {
            comment = true
            index++
            continue
        }
        if (char === '"' || char === '\'') {
            const close = findCSSClosingQuote(source, index, char, end)
            ranges.push({
                start: index,
                end: close + 1,
                quote: char,
                contentRange: {
                    start: index + 1,
                    end: Math.max(index + 1, close)
                }
            })
            index = close
        }
    }
    return ranges
}

export function collectCSSDeclarationRanges(source: string, start: number, end: number) {
    const ranges: CSSDeclarationRange[] = []
    let quote = ''
    let comment = false
    let depth = 0
    let propertyStart = -1
    let colon = -1

    const flushDeclaration = (declarationEnd: number, terminatorRange?: SourceRange) => {
        if (propertyStart === -1 || colon === -1) return
        const propertyText = source.slice(propertyStart, colon)
        const propertyLeading = propertyText.search(/\S/)
        if (propertyLeading === -1) return
        const propertyRangeStart = propertyStart + propertyLeading
        const propertyRangeEnd = propertyStart + propertyText.search(/\s*$/)
        const valueStart = skipCSSWhitespace(source, colon + 1)
        const rawValueEnd = source.slice(valueStart, declarationEnd).search(/\s*$/)
        const valueEnd = rawValueEnd === -1 ? declarationEnd : valueStart + rawValueEnd
        ranges.push({
            start: propertyRangeStart,
            end: terminatorRange?.end ?? valueEnd,
            propertyRange: {
                start: propertyRangeStart,
                end: propertyRangeEnd
            },
            separatorRange: {
                start: colon,
                end: colon + 1
            },
            valueRange: {
                start: valueStart,
                end: valueEnd
            },
            ...(terminatorRange ? { terminatorRange } : {})
        })
    }

    for (let index = start; index < end; index++) {
        const char = source[index]
        const next = source[index + 1]
        if (comment) {
            if (char === '*' && next === '/') {
                comment = false
                index++
            }
            continue
        }
        if (quote) {
            if (char === '\\') {
                index++
            } else if (char === quote) {
                quote = ''
            }
            continue
        }
        if (char === '/' && next === '*') {
            comment = true
            index++
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
        if (propertyStart === -1 && isCSSIdentStart(char)) {
            propertyStart = index
        }
        if (char === ':' && colon === -1 && propertyStart !== -1) {
            colon = index
            continue
        }
        if (char === ';') {
            flushDeclaration(index, { start: index, end: index + 1 })
            propertyStart = -1
            colon = -1
        } else if (char === '{' || char === '}') {
            propertyStart = -1
            colon = -1
        }
    }
    flushDeclaration(end)
    return ranges
}

export function collectCSSDirectiveRanges(source: string) {
    const ranges: CSSDirectiveRuleRange[] = []
    let quote = ''
    let comment = false
    let depth = 0
    for (let index = 0; index < source.length; index++) {
        const char = source[index]
        const next = source[index + 1]
        if (comment) {
            if (char === '*' && next === '/') {
                comment = false
                index++
            }
            continue
        }
        if (quote) {
            if (char === '\\') {
                index++
            } else if (char === quote) {
                quote = ''
            }
            continue
        }
        if (char === '/' && next === '*') {
            comment = true
            index++
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
            depth = Math.max(0, depth - 1)
            continue
        }
        if (char !== '@') continue

        const name = readCSSIdent(source, index + 1)
        if (!CSS_DIRECTIVE_RANGE_NAME_SET.has(name.value)) continue

        const statementEnd = findCSSStatementEnd(source, name.end)
        if (
            name.value === 'master'
            && (
                statementEnd.reason !== 'semicolon'
                || source.slice(name.end, statementEnd.end - 1).trim()
            )
        ) {
            continue
        }
        const blockStart = statementEnd.reason === 'block' ? statementEnd.end : -1
        const blockEnd = blockStart === -1 ? -1 : findCSSBlockEnd(source, blockStart)
        const end = blockStart === -1
            ? statementEnd.end
            : blockEnd === -1
                ? source.length
                : blockEnd + 1
        const preludeEnd = blockStart === -1
            ? statementEnd.reason === 'semicolon'
                ? statementEnd.end - 1
                : statementEnd.end
            : blockStart
        const semicolonRange = statementEnd.reason === 'semicolon'
            ? statementEnd.delimiterRange
            : undefined
        ranges.push({
            start: index,
            end,
            name: name.value as CSSDirectiveRangeName,
            keywordRange: {
                start: index,
                end: name.end
            },
            preludeRange: {
                start: name.end,
                end: preludeEnd
            },
            ...(blockStart !== -1
                ? {
                    blockRange: {
                        start: blockStart,
                        end
                    },
                    blockContentRange: {
                        start: blockStart + 1,
                        end: blockEnd === -1 ? end : blockEnd
                    },
                    ...(blockEnd === -1
                        ? {}
                        : {
                            blockCloseRange: {
                                start: blockEnd,
                                end: blockEnd + 1
                            }
                        })
                }
                : {}),
            ...(semicolonRange ? { semicolonRange } : {}),
            quotedStringRanges: collectCSSQuotedStringRanges(source, name.end, preludeEnd),
            depth,
            origin: 'source-scan'
        })

        if (blockStart === -1) {
            index = Math.max(index, end - 1)
        }
    }
    return ranges
}
