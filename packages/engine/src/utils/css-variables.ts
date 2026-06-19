import type { Variable } from 'shared/css-syntax'

export const CSS_VARIABLE_REFERENCE = /var\(\s*--([_a-zA-Z0-9-]+)\b/g

export function createCSSVariableReference(name: string, alpha?: number, fallback?: string) {
    const reference = `var(--${name}${fallback ? ',' + fallback : ''})`
    return alpha !== undefined
        ? createAlphaColorValue(reference, alpha)
        : reference
}

export function createAlphaColorValue(value: string, alpha: number) {
    return `color-mix(in oklab,${value} ${Number(alpha) * 100}%,transparent)`
}

export function createNumberVariableReference(variable: Variable, unit: string, rootSize = 16) {
    void unit
    void rootSize
    return createCSSVariableReference(variable.name)
}

export function createNegativeNumberVariableReference(variable: Variable, unit: string, rootSize = 16) {
    const reference = createCSSVariableReference(variable.name)
    void variable
    void unit
    void rootSize
    return `calc(${reference} * -1)`
}

export function collectCSSVariableReferences(value: string) {
    const references = new Set<string>()
    for (const match of value.matchAll(CSS_VARIABLE_REFERENCE)) {
        references.add(match[1])
    }
    return references
}

export function replaceCSSVariableReferences(value: string, replacer: (name: string, text: string) => string | undefined) {
    let result = ''
    let quote = ''

    for (let i = 0; i < value.length;) {
        const char = value[i]

        if (quote) {
            result += char
            if (char === '\\') {
                result += value[i + 1] || ''
                i += 2
                continue
            }
            if (char === quote) quote = ''
            i++
            continue
        }

        if (char === '"' || char === '\'') {
            quote = char
            result += char
            i++
            continue
        }

        if (value.startsWith('var(', i)) {
            let cursor = i + 4
            while (value[cursor] === ' ') cursor++
            if (value.slice(cursor, cursor + 2) !== '--') {
                result += char
                i++
                continue
            }
            cursor += 2
            const nameStart = cursor
            while (/[_a-zA-Z0-9-]/.test(value[cursor] || '')) cursor++
            const name = value.slice(nameStart, cursor)
            if (!name) {
                result += char
                i++
                continue
            }

            let depth = 1
            let innerQuote = ''
            let closeIndex = -1
            for (let j = cursor; j < value.length; j++) {
                const nextChar = value[j]
                if (innerQuote) {
                    if (nextChar === '\\') {
                        j++
                        continue
                    }
                    if (nextChar === innerQuote) innerQuote = ''
                    continue
                }
                if (nextChar === '"' || nextChar === '\'') {
                    innerQuote = nextChar
                    continue
                }
                if (nextChar === '(') {
                    depth++
                    continue
                }
                if (nextChar === ')') {
                    depth--
                    if (depth === 0) {
                        closeIndex = j
                        break
                    }
                }
            }

            if (closeIndex === -1) {
                result += value.slice(i)
                break
            }

            const text = value.slice(i, closeIndex + 1)
            result += replacer(name, text) ?? text
            i = closeIndex + 1
            continue
        }

        result += char
        i++
    }

    return result
}

function readAliasName(value: string, start: number) {
    if (value[start + 1] === '(') {
        let i = start + 2
        let name = ''
        for (; i < value.length; i++) {
            if (value[i] === ')') break
            name += value[i]
        }
        return name
            ? { name, end: i + 1 }
            : undefined
    }

    let i = start + 1
    let name = ''
    for (; i < value.length; i++) {
        const char = value[i]
        if (!/[a-zA-Z0-9-]/.test(char)) break
        name += char
    }
    return name
        ? { name, end: i }
        : undefined
}

function readAliasAlpha(value: string, start: number) {
    let i = start
    while (value[i] === ' ') i++
    if (value[i] !== '/') return
    i++
    while (value[i] === ' ') i++
    const alphaStart = i
    for (; i < value.length; i++) {
        if (/[\s,);|]/.test(value[i])) break
    }
    const alpha = value.slice(alphaStart, i)
    return alpha
        ? { alpha: Number(alpha), end: i }
        : undefined
}

export function normalizeVariableValue(value: string | number) {
    if (typeof value === 'number') {
        return { value: String(value), dependencies: new Set<string>() }
    }

    let result = ''
    let inSingle = false
    let inDouble = false
    const dependencies = new Set<string>()

    for (let i = 0; i < value.length; i++) {
        const char = value[i]
        const previous = value[i - 1]

        if (char === '\'' && previous !== '\\' && !inDouble) {
            inSingle = !inSingle
            result += char
            continue
        }
        if (char === '"' && previous !== '\\' && !inSingle) {
            inDouble = !inDouble
            result += char
            continue
        }

        if (!inSingle && !inDouble) {
            if (char === '|') {
                result += ' '
                continue
            }

            if (char === '$') {
                const alias = readAliasName(value, i)
                if (alias) {
                    const alpha = readAliasAlpha(value, alias.end)
                    dependencies.add(alias.name)
                    result += createCSSVariableReference(alias.name, alpha?.alpha)
                    i = (alpha?.end ?? alias.end) - 1
                    continue
                }
            }
        }

        result += char
    }

    for (const reference of collectCSSVariableReferences(result)) {
        dependencies.add(reference)
    }

    return { value: result, dependencies }
}
