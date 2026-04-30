import { SyntaxRule } from '../syntax-rule'

/**
 * Transformer for CSS math comparison functions (clamp/min/max).
 *
 * Each top-level comma-separated argument is itself a `<calc-sum>` per
 * CSS Values Module Level 4. Browsers reject bare arithmetic like
 * `clamp(1.5rem, 2vw+1rem, 2.25rem)`; the middle arg must be wrapped in
 * `calc()`. This transformer auto-wraps any argument that contains an
 * infix arithmetic operator and isn't already a calc()/min()/max()/clamp()/var().
 *
 * The function name is passed via the transformer data tuple, e.g.
 * `clamp: { transformer: ['core.math-fn', { name: 'clamp' }] }`.
 */
export default function coreMathFn(
    this: SyntaxRule,
    value: string,
    _bypassVariableNames: string[],
    data?: { name: string }
) {
    const fnName = data?.name ?? ''

    // Walk top-level commas, preserving the exact original substring of each
    // argument (including its surrounding whitespace) and the comma separators.
    const tokens: string[] = []
    let depth = 0
    let start = 0
    for (let i = 0; i < value.length; i++) {
        const c = value[i]
        if (c === '(') depth++
        else if (c === ')') depth--
        else if (c === ',' && depth === 0) {
            tokens.push(value.slice(start, i))
            tokens.push(',')
            start = i + 1
        }
    }
    tokens.push(value.slice(start))

    const out = tokens.map((part) => {
        if (part === ',') return part
        const trimmed = part.trim()
        if (!trimmed) return part
        if (/^(?:calc|clamp|min|max|var)\(/.test(trimmed)) return part
        if (/[a-zA-Z0-9%)]\s*[+\-*/]\s*[a-zA-Z0-9(.]/.test(trimmed)) {
            // CSS calc() requires whitespace around `+` and `-` (per the spec);
            // `*` and `/` allow no whitespace. Normalize unary signs first
            // (e.g. leading `-1rem`) before inserting spaces.
            const spaced = trimmed.replace(
                /([a-zA-Z0-9%)])\s*([+\-])\s*([a-zA-Z0-9(.])/g,
                '$1 $2 $3'
            )
            const leadingWs = part.match(/^\s*/)![0]
            const trailingWs = part.match(/\s*$/)![0]
            return `${leadingWs}calc(${spaced})${trailingWs}`
        }
        return part
    })

    return `${fnName}(${out.join('')})`
}
