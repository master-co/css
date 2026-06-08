import { UtilityType, VALUE_UNITS, type MasterCSS } from '@master/css'
import type { SemanticTokenModifier } from './types'
import { pushHighlightToken, toSemanticTokenItems, type HighlightTokenItem } from './highlight'

const IDENTIFIER_RE = /^[A-Za-z_][\w-]*/
const HASH_RE = /^#[\w-]+/
const VARIABLE_RE = /^\$[A-Za-z0-9-]+(?:\/[+-]?(?:\d+\.\d+|\.\d+|\d+|[A-Za-z0-9_.%-]+))?/
const NUMERIC_RE = /^([+-]?(?:\d+\.\d+|\.\d+|\d+))([A-Za-z%]+)?/
const SIZE_PAIR_RE = /^([+-]?(?:\d+\.\d+|\.\d+|\d+))x([+-]?(?:\d+\.\d+|\.\d+|\d+))(?![0-9A-Za-z])/

function findClosingQuote(source: string, start: number, quote: string) {
    for (let i = start + 1; i < source.length; i++) {
        if (source[i] === '\\') {
            i++
            continue
        }
        if (source[i] === quote) return i
    }
    return source.length - 1
}

function findClosingParen(source: string, open: number) {
    let quote = ''
    let depth = 0
    for (let i = open; i < source.length; i++) {
        const char = source[i]
        if (quote) {
            if (char === '\\') i++
            else if (char === quote) quote = ''
            continue
        }
        if (char === '"' || char === '\'') {
            quote = char
            continue
        }
        if (char === '(') {
            depth++
            continue
        }
        if (char === ')') {
            depth--
            if (depth === 0) return i
        }
    }
    return source.length - 1
}

function splitTopLevel(source: string, separator: string) {
    const parts: { start: number, end: number, separatorStart?: number }[] = []
    let quote = ''
    let depth = 0
    let start = 0
    for (let i = 0; i < source.length; i++) {
        const char = source[i]
        if (quote) {
            if (char === '\\') i++
            else if (char === quote) quote = ''
            continue
        }
        if (char === '"' || char === '\'') {
            quote = char
            continue
        }
        if (char === '(' || char === '[' || char === '{') {
            depth++
            continue
        }
        if (char === ')' || char === ']' || char === '}') {
            depth = Math.max(0, depth - 1)
            continue
        }
        if (depth === 0 && char === separator) {
            parts.push({ start, end: i, separatorStart: i })
            start = i + 1
        }
    }
    parts.push({ start, end: source.length })
    return parts
}

function withUnitModifier(modifiers: SemanticTokenModifier[] = []) {
    return [...modifiers, 'unit' as const]
}

function pushNumberOrKeyword(
    tokens: HighlightTokenItem[],
    absoluteStart: number,
    raw: string,
    modifiers?: SemanticTokenModifier[],
    css?: MasterCSS
) {
    if (!raw) return
    if (css?.variables.has(raw)) {
        pushHighlightToken(tokens, absoluteStart, raw.length, 'variable', 'value.variable', modifiers)
        return
    }

    const numeric = NUMERIC_RE.exec(raw)
    if (!numeric || numeric[0].length !== raw.length) {
        pushHighlightToken(tokens, absoluteStart, raw.length, 'enumMember', raw.startsWith('#') ? 'value.color' : 'value.keyword', modifiers)
        return
    }

    const [, numberText, unit] = numeric
    if (unit && !VALUE_UNITS.includes(unit)) {
        pushHighlightToken(tokens, absoluteStart, raw.length, 'enumMember', 'value.keyword', modifiers)
        return
    }

    pushHighlightToken(tokens, absoluteStart, numberText.length, 'number', 'value.number', modifiers)
    if (unit) {
        pushHighlightToken(tokens, absoluteStart + numberText.length, unit.length, 'enumMember', 'value.unit', withUnitModifier(modifiers))
    }
}

function pushQueryNumberOrValue(tokens: HighlightTokenItem[], absoluteStart: number, raw: string) {
    const numeric = NUMERIC_RE.exec(raw)
    if (!numeric || numeric[0].length !== raw.length) {
        pushHighlightToken(tokens, absoluteStart, raw.length, 'enumMember', 'query.value', ['query'])
        return
    }
    const [, numberText, unit] = numeric
    pushHighlightToken(tokens, absoluteStart, numberText.length, 'number', 'query.number', ['query'])
    if (unit) {
        pushHighlightToken(tokens, absoluteStart + numberText.length, unit.length, 'enumMember', 'query.unit', ['query', 'unit'])
    }
}

function pushSlashSeparatedValue(tokens: HighlightTokenItem[], absoluteStart: number, raw: string, css?: MasterCSS) {
    let segmentStart = 0
    for (let i = 0; i < raw.length; i++) {
        if (raw[i] !== '/') continue
        pushNumberOrKeyword(tokens, absoluteStart + segmentStart, raw.slice(segmentStart, i), undefined, css)
        pushHighlightToken(tokens, absoluteStart + i, 1, 'operator', 'value.separator')
        segmentStart = i + 1
    }
    pushNumberOrKeyword(tokens, absoluteStart + segmentStart, raw.slice(segmentStart), undefined, css)
}

export function tokenizeUtilityValue(valueText: string, valueStart: number, css?: MasterCSS): HighlightTokenItem[] {
    const tokens: HighlightTokenItem[] = []

    for (let i = 0; i < valueText.length;) {
        const char = valueText[i]

        if (/\s/.test(char)) {
            i++
            continue
        }

        if (char === '"' || char === '\'') {
            const end = findClosingQuote(valueText, i, char)
            pushHighlightToken(tokens, valueStart + i, 1, 'string', 'value.string.quote', ['quoted'])
            if (end > i + 1) {
                pushHighlightToken(tokens, valueStart + i + 1, end - i - 1, 'string', 'value.string', ['quoted'])
            }
            pushHighlightToken(tokens, valueStart + end, 1, 'string', 'value.string.quote', ['quoted'])
            i = end + 1
            continue
        }

        if (char === '$') {
            const match = valueText.slice(i).match(VARIABLE_RE)
            if (match) {
                const variable = match[0]
                const slash = variable.lastIndexOf('/')
                if (slash > 0) {
                    pushHighlightToken(tokens, valueStart + i, slash, 'variable', 'value.variable')
                    pushHighlightToken(tokens, valueStart + i + slash, 1, 'operator', 'value.separator')
                    pushNumberOrKeyword(tokens, valueStart + i + slash + 1, variable.slice(slash + 1))
                } else {
                    pushHighlightToken(tokens, valueStart + i, variable.length, 'variable', 'value.variable')
                }
                i += variable.length
                continue
            }
        }

        if (char === '#') {
            const match = valueText.slice(i).match(HASH_RE)
            if (match) {
                pushHighlightToken(tokens, valueStart + i, match[0].length, 'enumMember', 'value.color')
                i += match[0].length
                continue
            }
        }

        const pair = valueText.slice(i).match(SIZE_PAIR_RE)
        if (pair) {
            pushHighlightToken(tokens, valueStart + i, pair[1].length, 'number', 'value.number')
            pushHighlightToken(tokens, valueStart + i + pair[1].length, 1, 'operator', 'value.separator', ['unit'])
            pushHighlightToken(tokens, valueStart + i + pair[1].length + 1, pair[2].length, 'number', 'value.number')
            i += pair[0].length
            continue
        }

        if (/[+-]?(?:\d|\.)/.test(char)) {
            const match = valueText.slice(i).match(NUMERIC_RE)
            if (match) {
                const raw = match[0]
                pushNumberOrKeyword(tokens, valueStart + i, raw, undefined, css)
                i += raw.length
                continue
            }
        }

        const identifier = valueText.slice(i).match(IDENTIFIER_RE)
        if (identifier) {
            const word = identifier[0]
            const wordEnd = i + word.length
            if (valueText[wordEnd] === '(') {
                pushHighlightToken(tokens, valueStart + i, word.length, 'function', 'value.function.name')
                pushHighlightToken(tokens, valueStart + wordEnd, 1, 'operator', 'value.function.punctuation')
                if (word === 'url') {
                    const close = findClosingParen(valueText, wordEnd)
                    const innerStart = wordEnd + 1
                    const innerEnd = Math.max(innerStart, close)
                    const inner = valueText.slice(innerStart, innerEnd)
                    if (inner) {
                        if (inner[0] === '"' || inner[0] === '\'') {
                            tokens.push(...tokenizeUtilityValue(inner, valueStart + innerStart, css))
                        } else {
                            pushHighlightToken(tokens, valueStart + innerStart, inner.length, 'string', 'value.string')
                        }
                    }
                    if (valueText[close] === ')') {
                        pushHighlightToken(tokens, valueStart + close, 1, 'operator', 'value.function.punctuation')
                        i = close + 1
                    } else {
                        i = innerEnd
                    }
                } else {
                    i = wordEnd + 1
                }
                continue
            }

            let end = wordEnd
            while (end < valueText.length && /[A-Za-z0-9.%/-]/.test(valueText[end])) end++
            pushSlashSeparatedValue(tokens, valueStart + i, valueText.slice(i, end), css)
            i = end
            continue
        }

        if (char === '|' || char === '_' || char === ',' || char === '/') {
            pushHighlightToken(tokens, valueStart + i, 1, 'operator', 'value.separator')
            i++
            continue
        }

        if (char === '(' || char === ')') {
            pushHighlightToken(tokens, valueStart + i, 1, 'operator', 'value.function.punctuation')
            i++
            continue
        }

        if (char === '+' || char === '*' || char === '-') {
            pushHighlightToken(tokens, valueStart + i, 1, 'operator', 'value.operator')
            i++
            continue
        }

        if (char === '!') {
            pushHighlightToken(tokens, valueStart + i, 1, 'operator', 'value.important', ['important'])
            i++
            continue
        }

        pushHighlightToken(tokens, valueStart + i, 1, 'enumMember', 'value.keyword')
        i++
    }

    return tokens
}

function startsAtFeatureOperator(value: string) {
    return value[0] === ':'
        || value.startsWith('>=')
        || value.startsWith('<=')
        || value[0] === '>'
        || value[0] === '<'
        || value[0] === '='
}

function pushAtWord(tokens: HighlightTokenItem[], start: number, value: string, next: string) {
    if (startsAtFeatureOperator(next)) {
        pushHighlightToken(tokens, start, value.length, 'property', 'query.feature', ['query'])
    } else {
        pushQueryNumberOrValue(tokens, start, value)
    }
}

export function tokenizeAtQuery(queryText: string, queryStart: number): HighlightTokenItem[] {
    const tokens: HighlightTokenItem[] = []
    let i = 0
    const keyword = queryText.match(/^@[A-Za-z0-9-]+/)
    if (keyword) {
        pushHighlightToken(tokens, queryStart, keyword[0].length, 'keyword', 'query.keyword', ['query'])
        i += keyword[0].length
    } else if (queryText[i] === '@') {
        pushHighlightToken(tokens, queryStart, 1, 'keyword', 'query.keyword', ['query'])
        i++
    }

    while (i < queryText.length) {
        const twoChars = queryText.slice(i, i + 2)
        if (twoChars === '>=' || twoChars === '<=') {
            pushHighlightToken(tokens, queryStart + i, 2, 'operator', 'query.operator', ['query'])
            i += 2
            continue
        }

        const char = queryText[i]
        if (char === '(' || char === ')') {
            pushHighlightToken(tokens, queryStart + i, 1, 'operator', 'query.punctuation', ['query'])
            i++
            continue
        }
        if (char === '&' || char === ',' || char === '!' || char === '>' || char === '<' || char === '=' || char === ':') {
            pushHighlightToken(tokens, queryStart + i, 1, 'operator', 'query.operator', ['query'])
            i++
            continue
        }
        if (/\s/.test(char)) {
            i++
            continue
        }

        const word = queryText.slice(i).match(/^[#A-Za-z0-9_.%-]+/)
        if (word) {
            const next = queryText.slice(i + word[0].length, i + word[0].length + 2)
            pushAtWord(tokens, queryStart + i, word[0], next)
            i += word[0].length
        } else {
            i++
        }
    }

    return tokens
}

function tokenizeState(token: string, stateStart: number, offset: number): HighlightTokenItem[] {
    const tokens: HighlightTokenItem[] = []
    for (let i = stateStart; i < token.length;) {
        const char = token[i]
        if (char === '!') {
            pushHighlightToken(tokens, offset + i, 1, 'operator', 'value.important', ['important'])
            i++
        } else if (char === '_' || char === '>' || char === '+' || char === '~') {
            pushHighlightToken(tokens, offset + i, 1, 'operator', 'selector.combinator', ['selector'])
            i++
            const match = token.slice(i).match(/^\*?[A-Za-z][\w-]*/)
            if (match) {
                pushHighlightToken(tokens, offset + i, match[0].length, 'type', 'selector.type', ['selector'])
                i += match[0].length
            }
        } else if (char === '.' || char === '#') {
            const role = char === '.' ? 'selector.class' : 'selector.id'
            pushHighlightToken(tokens, offset + i, 1, 'operator', role, ['selector'])
            const nameStart = i + 1
            const match = token.slice(nameStart).match(/^[\w-]+/)
            if (match) {
                pushHighlightToken(tokens, offset + nameStart, match[0].length, char === '.' ? 'class' : 'variable', role, ['selector'])
                i = nameStart + match[0].length
            } else {
                i = nameStart
            }
        } else if (char === '(' || char === ',') {
            pushHighlightToken(tokens, offset + i, 1, 'operator', char === ',' ? 'selector.combinator' : 'selector.punctuation', ['selector'])
            i++
            const match = token.slice(i).match(/^\*?[A-Za-z][\w-]*/)
            if (match) {
                pushHighlightToken(tokens, offset + i, match[0].length, 'type', 'selector.type', ['selector'])
                i += match[0].length
            }
        } else if (char === ')' || char === '[' || char === ']') {
            pushHighlightToken(tokens, offset + i, 1, 'operator', 'selector.punctuation', ['selector'])
            i++
        } else if (char === '@') {
            const nextAt = token.indexOf('@', i + 1)
            const end = nextAt >= 0 ? nextAt : token.length
            tokens.push(...tokenizeAtQuery(token.slice(i, end), offset + i))
            i = end
        } else if (char === ':') {
            const colonLength = token[i + 1] === ':' ? 2 : 1
            const pseudoModifier = colonLength === 2 ? 'pseudoElement' : 'pseudoClass'
            const delimiterRole = colonLength === 2 ? 'selector.pseudoElement.delimiter' : 'selector.pseudoClass.delimiter'
            const nameRole = colonLength === 2 ? 'selector.pseudoElement.name' : 'selector.pseudoClass.name'
            pushHighlightToken(tokens, offset + i, colonLength, 'operator', delimiterRole, ['selector', pseudoModifier])
            const nameStart = i + colonLength
            const match = token.slice(nameStart).match(/^[\w-]+/)
            if (match) {
                pushHighlightToken(tokens, offset + nameStart, match[0].length, 'modifier', nameRole, [pseudoModifier])
                i = nameStart + match[0].length
            } else {
                i = nameStart
            }
        } else {
            i++
        }
    }
    return tokens
}

function tokenizeKey(tokens: HighlightTokenItem[], token: string, offset: number, keyToken?: string) {
    if (!keyToken) return
    const keyNameLength = keyToken.endsWith(':') ? keyToken.length - 1 : keyToken.length
    pushHighlightToken(tokens, offset, keyNameLength, 'property', 'declaration.property')
    if (keyToken.endsWith(':') && token[keyNameLength] === ':') {
        pushHighlightToken(tokens, offset + keyNameLength, 1, 'operator', 'declaration.separator')
    }
}

function tokenizeGroupedClassToken(css: MasterCSS, token: string, offset: number): HighlightTokenItem[] | undefined {
    const startsWithGroup = token.startsWith('{')
    const endsWithGroup = token.endsWith('}')
    const bodyStart = startsWithGroup ? 1 : 0
    const bodyEnd = endsWithGroup ? token.length - 1 : token.length
    const body = token.slice(bodyStart, bodyEnd)
    if (!startsWithGroup && !body.includes(';')) return

    const tokens: HighlightTokenItem[] = []
    if (startsWithGroup) pushHighlightToken(tokens, offset, 1, 'operator', 'block.brace')
    for (const part of splitTopLevel(body, ';')) {
        const partText = body.slice(part.start, part.end).trim()
        if (partText) {
            const leadingWhitespace = body.slice(part.start, part.end).search(/\S/)
            tokens.push(...tokenizeClassToken(css, partText, offset + bodyStart + part.start + Math.max(0, leadingWhitespace)))
        }
        if (part.separatorStart !== undefined) {
            pushHighlightToken(tokens, offset + bodyStart + part.separatorStart, 1, 'operator', 'declaration.terminator')
        }
    }
    if (endsWithGroup) pushHighlightToken(tokens, offset + token.length - 1, 1, 'operator', 'block.brace')
    return tokens
}

export function tokenizeClassToken(css: MasterCSS, token: string, offset: number): HighlightTokenItem[] {
    const groupedTokens = tokenizeGroupedClassToken(css, token, offset)
    if (groupedTokens) return groupedTokens

    if (token.startsWith('@')) {
        return tokenizeAtQuery(token, offset)
    }

    const tokens: HighlightTokenItem[] = []
    const rules = css.generate(token)
    const component = rules.find((rule) => rule.type === UtilityType.Static && rule.layerName === 'components')
    if (component) {
        const stateStart = token.length - (component.stateToken?.length ?? 0)
        pushHighlightToken(tokens, offset, stateStart, 'class', 'utility.component', ['declaration', 'component'])
        tokens.push(...tokenizeState(token, stateStart, offset))
        return tokens
    }

    const rule = rules[0]
    if (!rule) return tokens

    if (rule.type === UtilityType.Static) {
        const stateStart = token.length - (rule.stateToken?.length ?? 0)
        pushHighlightToken(tokens, offset, stateStart, 'class', 'utility.static')
        tokens.push(...tokenizeState(token, stateStart, offset))
        return tokens
    }

    tokenizeKey(tokens, token, offset, rule.keyToken)
    const valueStart = rule.keyToken?.length ?? Math.max(0, token.indexOf(rule.valueToken ?? ''))
    if (rule.valueToken) {
        tokens.push(...tokenizeUtilityValue(token.slice(valueStart, valueStart + rule.valueToken.length), offset + valueStart, css))
    }

    let stateStart = valueStart + (rule.valueToken?.length ?? 0)
    if (rule.important && token[stateStart] === '!') {
        pushHighlightToken(tokens, offset + stateStart, 1, 'operator', 'value.important', ['important'])
        stateStart++
    }
    tokens.push(...tokenizeState(token, stateStart, offset))
    return tokens
}

export function collectClassListHighlightTokenItems(css: MasterCSS, classList: string, offset = 0): HighlightTokenItem[] {
    const tokens: HighlightTokenItem[] = []
    for (const match of classList.matchAll(/[^\s]+/g)) {
        if (match.index === undefined) continue
        tokens.push(...tokenizeClassToken(css, match[0], offset + match.index))
    }
    return tokens
}

export function collectClassListSemanticTokenItems(css: MasterCSS, classList: string, offset = 0) {
    return toSemanticTokenItems(collectClassListHighlightTokenItems(css, classList, offset))
}
