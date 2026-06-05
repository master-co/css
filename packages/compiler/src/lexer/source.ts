import type { Location2 } from 'lightningcss'

export interface SourceRange {
    start: number
    end: number
}

export function createSourceLocationResolver(source: string) {
    const lineStarts = [0]
    for (let index = 0; index < source.length; index++) {
        if (source[index] === '\n') {
            lineStarts.push(index + 1)
        }
    }

    return (loc: Location2 | undefined) => {
        if (!loc) return -1
        const lineStart = lineStarts[loc.line]
        if (lineStart === undefined) return -1
        return lineStart + Math.max(0, loc.column - 1)
    }
}

export function findAtRuleStatementEnd(source: string, start: number) {
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
            depth--
            continue
        }
        if (char === ';' && depth === 0) return index + 1
        if (char === '{' && depth === 0) return -1
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
