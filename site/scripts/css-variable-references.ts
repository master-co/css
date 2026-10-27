function findCSSCommentEnd(source: string, start: number) {
    const end = source.indexOf('*/', start + 2)
    return end === -1 ? source.length : end + 2
}

function findCSSClosingQuote(source: string, start: number, quote: string) {
    for (let index = start + 1; index < source.length; index++) {
        if (source[index] === '\\') {
            index++
        } else if (source[index] === quote) {
            return index
        }
    }
    return source.length - 1
}

function isCSSIdentifierCharacter(character = '') {
    return /[-_a-zA-Z0-9]/.test(character) || Boolean(character && character.charCodeAt(0) >= 0x80)
}

function readCSSVariableReference(source: string, start: number) {
    if (
        isCSSIdentifierCharacter(source[start - 1])
        || source.slice(start, start + 4).toLowerCase() !== 'var('
    ) {
        return
    }
    let cursor = start + 4
    while (/\s/.test(source[cursor] || '')) cursor++
    if (source.slice(cursor, cursor + 2) !== '--') return
    cursor += 2
    const nameStart = cursor
    while (/[-_a-zA-Z0-9]/.test(source[cursor] || '')) cursor++
    const name = source.slice(nameStart, cursor)
    if (!name) return

    let depth = 1
    let quote = ''
    for (let index = cursor; index < source.length; index++) {
        const character = source[index]
        if (quote) {
            if (character === '\\') index++
            else if (character === quote) quote = ''
            continue
        }
        if (character === '"' || character === '\'') {
            quote = character
        } else if (character === '/' && source[index + 1] === '*') {
            index = findCSSCommentEnd(source, index) - 1
        } else if (character === '(') {
            depth++
        } else if (character === ')') {
            depth--
            if (depth === 0) return { name, end: index + 1 }
        }
    }
}

export function collectCSSVariableReferences(source: string) {
    const references = new Set<string>()
    for (let index = 0; index < source.length; index++) {
        const character = source[index]
        if (character === '"' || character === '\'') {
            index = findCSSClosingQuote(source, index, character)
            continue
        }
        if (character === '/' && source[index + 1] === '*') {
            index = findCSSCommentEnd(source, index) - 1
            continue
        }
        const reference = readCSSVariableReference(source, index)
        if (reference) references.add(reference.name)
    }
    return [...references]
}
