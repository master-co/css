export interface SourceRange {
    start: number
    end: number
}

export interface SourceLocation {
    line: number
    column: number
}

export interface CSSStatementEnd {
    end: number
    reason: 'semicolon' | 'block' | 'eof'
    delimiterRange?: SourceRange
}

export function escapeRegExp(source: string) {
    return source.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export function isCSSIdentChar(char: string | undefined) {
    return Boolean(char && /[-_a-zA-Z0-9]/.test(char))
}

export function isCSSIdentStart(char: string | undefined) {
    return Boolean(char && /[_a-zA-Z-]/.test(char))
}

export function skipCSSWhitespace(source: string, index: number) {
    while (/\s/.test(source[index] || '')) index++
    return index
}

export function readCSSIdent(source: string, index: number) {
    const start = index
    while (isCSSIdentChar(source[index])) index++
    return {
        start,
        end: index,
        value: source.slice(start, index)
    }
}

export function createSourceLocationResolver(source: string) {
    const lineStarts = [0]
    for (let index = 0; index < source.length; index++) {
        if (source[index] === '\n') {
            lineStarts.push(index + 1)
        }
    }

    return (loc: SourceLocation | undefined) => {
        if (!loc) return -1
        const lineStart = lineStarts[loc.line]
        if (lineStart === undefined) return -1
        return lineStart + Math.max(0, loc.column - 1)
    }
}

export function findCSSStatementEnd(source: string, start: number): CSSStatementEnd {
    let quote = ''
    let comment = false
    let depth = 0
    for (let index = start; index < source.length; index++) {
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
        if (depth === 0 && char === ';') {
            return {
                end: index + 1,
                reason: 'semicolon',
                delimiterRange: { start: index, end: index + 1 }
            }
        }
        if (depth === 0 && char === '{') {
            return {
                end: index,
                reason: 'block',
                delimiterRange: { start: index, end: index + 1 }
            }
        }
    }
    return {
        end: source.length,
        reason: 'eof'
    }
}

export function findCSSClosingQuote(source: string, start: number, quote: string, limit = source.length) {
    for (let index = start + 1; index < limit; index++) {
        if (source[index] === '\\') {
            index++
            continue
        }
        if (source[index] === quote) return index
    }
    return Math.max(start, limit - 1)
}

export function findCSSBlockEnd(source: string, open: number) {
    if (source[open] !== '{') return -1
    let quote = ''
    let comment = false
    let depth = 0
    for (let index = open; index < source.length; index++) {
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
            depth--
            if (depth === 0) return index
        }
    }
    return -1
}

export function removeSourceRanges(source: string, ranges: SourceRange[]) {
    if (!ranges.length) return source
    let output = ''
    let offset = 0
    for (const range of ranges) {
        output += source.slice(offset, range.start)
        offset = range.end
    }
    return output + source.slice(offset)
}

export function replaceSourceRanges(source: string, ranges: (SourceRange & { replacement: string })[]) {
    if (!ranges.length) return source
    let output = ''
    let offset = 0
    for (const range of ranges) {
        output += source.slice(offset, range.start)
        output += range.replacement
        offset = range.end
    }
    return output + source.slice(offset)
}
