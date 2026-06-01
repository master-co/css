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
    const reference = createCSSVariableReference(variable.name)
    if (!unit) return reference
    if (unit === 'rem' || unit === 'em') {
        return `calc(${reference} / ${rootSize} * 1${unit})`
    }
    return `calc(${reference} * 1${unit})`
}

export function collectCSSVariableReferences(value: string) {
    const references = new Set<string>()
    for (const match of value.matchAll(CSS_VARIABLE_REFERENCE)) {
        references.add(match[1])
    }
    return references
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
