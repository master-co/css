import { MASTER_CSS_VALUE_UNITS } from './units'

export type MasterCSSLexicalTokenType =
    | 'class'
    | 'enumMember'
    | 'property'
    | 'variable'
    | 'function'
    | 'number'
    | 'string'
    | 'keyword'
    | 'modifier'
    | 'operator'
    | 'type'

export type MasterCSSLexicalTokenModifier =
    | 'declaration'
    | 'defaultLibrary'
    | 'component'
    | 'directive'
    | 'important'
    | 'pseudoClass'
    | 'pseudoElement'
    | 'query'
    | 'quoted'
    | 'selector'
    | 'unit'

export type MasterCSSLexicalTokenRole =
    | 'block.brace'
    | 'declaration.property'
    | 'declaration.separator'
    | 'declaration.terminator'
    | 'directive.keyword'
    | 'directive.modifier'
    | 'directive.parameter'
    | 'directive.terminator'
    | 'query.keyword'
    | 'query.feature'
    | 'query.operator'
    | 'query.punctuation'
    | 'query.value'
    | 'query.number'
    | 'query.unit'
    | 'selector.attribute'
    | 'selector.class'
    | 'selector.combinator'
    | 'selector.id'
    | 'selector.pseudoClass.delimiter'
    | 'selector.pseudoClass.name'
    | 'selector.pseudoElement.delimiter'
    | 'selector.pseudoElement.name'
    | 'selector.punctuation'
    | 'selector.type'
    | 'theme.variable'
    | 'utility.component'
    | 'utility.semantic'
    | 'value.color'
    | 'value.function.name'
    | 'value.function.punctuation'
    | 'value.important'
    | 'value.keyword'
    | 'value.number'
    | 'value.operator'
    | 'value.separator'
    | 'value.string'
    | 'value.string.quote'
    | 'value.unit'
    | 'value.variable'

export interface MasterCSSLexicalTokenItem {
    start: number
    end: number
    type: MasterCSSLexicalTokenType
    role: MasterCSSLexicalTokenRole
    modifiers?: MasterCSSLexicalTokenModifier[]
}

export interface MasterCSSSplitPart {
    start: number
    end: number
    separatorStart?: number
}

export interface MasterCSSClassListTokenRange {
    start: number
    end: number
    token: string
}

export interface MasterCSSValueTokenizeOptions {
    isKnownVariable?: (name: string) => boolean
}

const IDENTIFIER_RE = /^[A-Za-z_][\w-]*/
const CSS_CUSTOM_FUNCTION_RE = /^--[A-Za-z_][\w-]*/
const HASH_RE = /^#[\w-]+/
const VARIABLE_RE = /^\$[A-Za-z0-9-]+(?:\/[+-]?(?:\d+\.\d+|\.\d+|\d+|[A-Za-z0-9_.%-]+))?/
const NUMERIC_RE = /^([+-]?(?:\d+\.\d+|\.\d+|\d+))([A-Za-z%]+)?/
const SIZE_PAIR_RE = /^([+-]?(?:\d+\.\d+|\.\d+|\d+))x([+-]?(?:\d+\.\d+|\.\d+|\d+))(?![0-9A-Za-z])/

const MASTER_CSS_VALUE_UNIT_SET = new Set<string>(MASTER_CSS_VALUE_UNITS)

export function pushMasterCSSLexicalToken(
    tokens: MasterCSSLexicalTokenItem[],
    start: number,
    length: number,
    type: MasterCSSLexicalTokenType,
    role: MasterCSSLexicalTokenRole,
    modifiers?: MasterCSSLexicalTokenModifier[]
) {
    if (length <= 0) return
    tokens.push({ start, end: start + length, type, role, modifiers })
}

export function findMasterCSSClosingQuote(source: string, start: number, quote: string) {
    for (let i = start + 1; i < source.length; i++) {
        if (source[i] === '\\') {
            i++
            continue
        }
        if (source[i] === quote) return i
    }
    return source.length - 1
}

export function findMasterCSSClosingParen(source: string, open: number) {
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

export function splitMasterCSSTopLevel(source: string, separator: string): MasterCSSSplitPart[] {
    const parts: MasterCSSSplitPart[] = []
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

export function collectMasterCSSClassListTokenRanges(classList: string): MasterCSSClassListTokenRange[] {
    const ranges: MasterCSSClassListTokenRange[] = []
    for (const match of classList.matchAll(/[^\s]+/g)) {
        if (match.index === undefined) continue
        ranges.push({
            start: match.index,
            end: match.index + match[0].length,
            token: match[0]
        })
    }
    return ranges
}

function withUnitModifier(modifiers: MasterCSSLexicalTokenModifier[] = []) {
    return [...modifiers, 'unit' as const]
}

function pushNumberOrKeyword(
    tokens: MasterCSSLexicalTokenItem[],
    absoluteStart: number,
    raw: string,
    modifiers?: MasterCSSLexicalTokenModifier[],
    options?: MasterCSSValueTokenizeOptions
) {
    if (!raw) return
    if (options?.isKnownVariable?.(raw)) {
        pushMasterCSSLexicalToken(tokens, absoluteStart, raw.length, 'variable', 'value.variable', modifiers)
        return
    }

    const numeric = NUMERIC_RE.exec(raw)
    if (!numeric || numeric[0].length !== raw.length) {
        pushMasterCSSLexicalToken(tokens, absoluteStart, raw.length, 'enumMember', raw.startsWith('#') ? 'value.color' : 'value.keyword', modifiers)
        return
    }

    const [, numberText, unit] = numeric
    if (unit && !MASTER_CSS_VALUE_UNIT_SET.has(unit)) {
        pushMasterCSSLexicalToken(tokens, absoluteStart, raw.length, 'enumMember', 'value.keyword', modifiers)
        return
    }

    pushMasterCSSLexicalToken(tokens, absoluteStart, numberText.length, 'number', 'value.number', modifiers)
    if (unit) {
        pushMasterCSSLexicalToken(tokens, absoluteStart + numberText.length, unit.length, 'enumMember', 'value.unit', withUnitModifier(modifiers))
    }
}

function pushQueryNumberOrValue(tokens: MasterCSSLexicalTokenItem[], absoluteStart: number, raw: string) {
    const numeric = NUMERIC_RE.exec(raw)
    if (!numeric || numeric[0].length !== raw.length) {
        pushMasterCSSLexicalToken(tokens, absoluteStart, raw.length, 'enumMember', 'query.value', ['query'])
        return
    }
    const [, numberText, unit] = numeric
    pushMasterCSSLexicalToken(tokens, absoluteStart, numberText.length, 'number', 'query.number', ['query'])
    if (unit) {
        pushMasterCSSLexicalToken(tokens, absoluteStart + numberText.length, unit.length, 'enumMember', 'query.unit', ['query', 'unit'])
    }
}

function pushSlashSeparatedValue(
    tokens: MasterCSSLexicalTokenItem[],
    absoluteStart: number,
    raw: string,
    options?: MasterCSSValueTokenizeOptions
) {
    let segmentStart = 0
    for (let i = 0; i < raw.length; i++) {
        if (raw[i] !== '/') continue
        pushNumberOrKeyword(tokens, absoluteStart + segmentStart, raw.slice(segmentStart, i), undefined, options)
        pushMasterCSSLexicalToken(tokens, absoluteStart + i, 1, 'operator', 'value.separator')
        segmentStart = i + 1
    }
    pushNumberOrKeyword(tokens, absoluteStart + segmentStart, raw.slice(segmentStart), undefined, options)
}

export function tokenizeMasterCSSValue(
    valueText: string,
    valueStart: number,
    options?: MasterCSSValueTokenizeOptions
): MasterCSSLexicalTokenItem[] {
    const tokens: MasterCSSLexicalTokenItem[] = []

    for (let i = 0; i < valueText.length;) {
        const char = valueText[i]

        if (/\s/.test(char)) {
            i++
            continue
        }

        if (char === '"' || char === '\'') {
            const end = findMasterCSSClosingQuote(valueText, i, char)
            pushMasterCSSLexicalToken(tokens, valueStart + i, 1, 'string', 'value.string.quote', ['quoted'])
            if (end > i + 1) {
                pushMasterCSSLexicalToken(tokens, valueStart + i + 1, end - i - 1, 'string', 'value.string', ['quoted'])
            }
            pushMasterCSSLexicalToken(tokens, valueStart + end, 1, 'string', 'value.string.quote', ['quoted'])
            i = end + 1
            continue
        }

        if (char === '$') {
            const match = valueText.slice(i).match(VARIABLE_RE)
            if (match) {
                const variable = match[0]
                const slash = variable.lastIndexOf('/')
                if (slash > 0) {
                    pushMasterCSSLexicalToken(tokens, valueStart + i, slash, 'variable', 'value.variable')
                    pushMasterCSSLexicalToken(tokens, valueStart + i + slash, 1, 'operator', 'value.separator')
                    pushNumberOrKeyword(tokens, valueStart + i + slash + 1, variable.slice(slash + 1))
                } else {
                    pushMasterCSSLexicalToken(tokens, valueStart + i, variable.length, 'variable', 'value.variable')
                }
                i += variable.length
                continue
            }
        }

        if (char === '#') {
            const match = valueText.slice(i).match(HASH_RE)
            if (match) {
                pushMasterCSSLexicalToken(tokens, valueStart + i, match[0].length, 'enumMember', 'value.color')
                i += match[0].length
                continue
            }
        }

        if (char === '-' && valueText[i + 1] === '-') {
            const customFunction = valueText.slice(i).match(CSS_CUSTOM_FUNCTION_RE)
            if (customFunction) {
                const word = customFunction[0]
                const wordEnd = i + word.length
                if (word === '--value' && valueText[wordEnd] === '(') {
                    pushMasterCSSLexicalToken(tokens, valueStart + i, word.length, 'function', 'value.function.name')
                    pushMasterCSSLexicalToken(tokens, valueStart + wordEnd, 1, 'operator', 'value.function.punctuation')
                    i = wordEnd + 1
                    continue
                }
            }
        }

        const pair = valueText.slice(i).match(SIZE_PAIR_RE)
        if (pair) {
            pushMasterCSSLexicalToken(tokens, valueStart + i, pair[1].length, 'number', 'value.number')
            pushMasterCSSLexicalToken(tokens, valueStart + i + pair[1].length, 1, 'operator', 'value.separator', ['unit'])
            pushMasterCSSLexicalToken(tokens, valueStart + i + pair[1].length + 1, pair[2].length, 'number', 'value.number')
            i += pair[0].length
            continue
        }

        if (/[+-]?(?:\d|\.)/.test(char)) {
            const match = valueText.slice(i).match(NUMERIC_RE)
            if (match) {
                const raw = match[0]
                pushNumberOrKeyword(tokens, valueStart + i, raw, undefined, options)
                i += raw.length
                continue
            }
        }

        const identifier = valueText.slice(i).match(IDENTIFIER_RE)
        if (identifier) {
            const word = identifier[0]
            const wordEnd = i + word.length
            if (valueText[wordEnd] === '(') {
                pushMasterCSSLexicalToken(tokens, valueStart + i, word.length, 'function', 'value.function.name')
                pushMasterCSSLexicalToken(tokens, valueStart + wordEnd, 1, 'operator', 'value.function.punctuation')
                if (word === 'url') {
                    const close = findMasterCSSClosingParen(valueText, wordEnd)
                    const innerStart = wordEnd + 1
                    const innerEnd = Math.max(innerStart, close)
                    const inner = valueText.slice(innerStart, innerEnd)
                    if (inner) {
                        if (inner[0] === '"' || inner[0] === '\'') {
                            tokens.push(...tokenizeMasterCSSValue(inner, valueStart + innerStart, options))
                        } else {
                            pushMasterCSSLexicalToken(tokens, valueStart + innerStart, inner.length, 'string', 'value.string')
                        }
                    }
                    if (valueText[close] === ')') {
                        pushMasterCSSLexicalToken(tokens, valueStart + close, 1, 'operator', 'value.function.punctuation')
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
            pushSlashSeparatedValue(tokens, valueStart + i, valueText.slice(i, end), options)
            i = end
            continue
        }

        if (char === '|' || char === '_' || char === ',' || char === '/') {
            pushMasterCSSLexicalToken(tokens, valueStart + i, 1, 'operator', 'value.separator')
            i++
            continue
        }

        if (char === '(' || char === ')') {
            pushMasterCSSLexicalToken(tokens, valueStart + i, 1, 'operator', 'value.function.punctuation')
            i++
            continue
        }

        if (char === '+' || char === '*' || char === '-') {
            pushMasterCSSLexicalToken(tokens, valueStart + i, 1, 'operator', 'value.operator')
            i++
            continue
        }

        if (char === '!') {
            pushMasterCSSLexicalToken(tokens, valueStart + i, 1, 'operator', 'value.important', ['important'])
            i++
            continue
        }

        pushMasterCSSLexicalToken(tokens, valueStart + i, 1, 'enumMember', 'value.keyword')
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

function pushAtWord(tokens: MasterCSSLexicalTokenItem[], start: number, value: string, next: string) {
    if (startsAtFeatureOperator(next)) {
        pushMasterCSSLexicalToken(tokens, start, value.length, 'property', 'query.feature', ['query'])
    } else {
        pushQueryNumberOrValue(tokens, start, value)
    }
}

function startsNamedQueryRange(value: string) {
    return value[0] === '&' || value[0] === ','
}

export function tokenizeMasterCSSAtQuery(queryText: string, queryStart: number): MasterCSSLexicalTokenItem[] {
    const tokens: MasterCSSLexicalTokenItem[] = []
    let i = 0
    const keyword = queryText.match(/^@[A-Za-z0-9-]+/)
    if (keyword) {
        const [keywordText] = keyword
        if (startsNamedQueryRange(queryText.slice(keywordText.length))) {
            pushMasterCSSLexicalToken(tokens, queryStart, 1, 'keyword', 'query.keyword', ['query'])
            pushQueryNumberOrValue(tokens, queryStart + 1, keywordText.slice(1))
        } else {
            pushMasterCSSLexicalToken(tokens, queryStart, keywordText.length, 'keyword', 'query.keyword', ['query'])
        }
        i += keyword[0].length
    } else if (queryText[i] === '@') {
        pushMasterCSSLexicalToken(tokens, queryStart, 1, 'keyword', 'query.keyword', ['query'])
        i++
    }

    while (i < queryText.length) {
        const twoChars = queryText.slice(i, i + 2)
        if (twoChars === '>=' || twoChars === '<=') {
            pushMasterCSSLexicalToken(tokens, queryStart + i, 2, 'operator', 'query.operator', ['query'])
            i += 2
            continue
        }

        const char = queryText[i]
        if (char === '(' || char === ')') {
            pushMasterCSSLexicalToken(tokens, queryStart + i, 1, 'operator', 'query.punctuation', ['query'])
            i++
            continue
        }
        if (char === '&' || char === ',' || char === '!' || char === '>' || char === '<' || char === '=' || char === ':') {
            pushMasterCSSLexicalToken(tokens, queryStart + i, 1, 'operator', 'query.operator', ['query'])
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

export function tokenizeMasterCSSState(token: string, stateStart: number, offset: number): MasterCSSLexicalTokenItem[] {
    const tokens: MasterCSSLexicalTokenItem[] = []
    for (let i = stateStart; i < token.length;) {
        const char = token[i]
        if (char === '!') {
            pushMasterCSSLexicalToken(tokens, offset + i, 1, 'operator', 'value.important', ['important'])
            i++
        } else if (char === '_' || char === '>' || char === '+' || char === '~') {
            pushMasterCSSLexicalToken(tokens, offset + i, 1, 'operator', 'selector.combinator', ['selector'])
            i++
            const match = token.slice(i).match(/^\*?[A-Za-z][\w-]*/)
            if (match) {
                pushMasterCSSLexicalToken(tokens, offset + i, match[0].length, 'type', 'selector.type', ['selector'])
                i += match[0].length
            }
        } else if (char === '.' || char === '#') {
            const role = char === '.' ? 'selector.class' : 'selector.id'
            pushMasterCSSLexicalToken(tokens, offset + i, 1, 'operator', role, ['selector'])
            const nameStart = i + 1
            const match = token.slice(nameStart).match(/^[\w-]+/)
            if (match) {
                pushMasterCSSLexicalToken(tokens, offset + nameStart, match[0].length, char === '.' ? 'class' : 'variable', role, ['selector'])
                i = nameStart + match[0].length
            } else {
                i = nameStart
            }
        } else if (char === '(' || char === ',') {
            pushMasterCSSLexicalToken(tokens, offset + i, 1, 'operator', char === ',' ? 'selector.combinator' : 'selector.punctuation', ['selector'])
            i++
            const match = token.slice(i).match(/^\*?[A-Za-z][\w-]*/)
            if (match) {
                pushMasterCSSLexicalToken(tokens, offset + i, match[0].length, 'type', 'selector.type', ['selector'])
                i += match[0].length
            }
        } else if (char === ')' || char === '[' || char === ']') {
            pushMasterCSSLexicalToken(tokens, offset + i, 1, 'operator', 'selector.punctuation', ['selector'])
            i++
        } else if (char === '@') {
            const nextAt = token.indexOf('@', i + 1)
            const end = nextAt >= 0 ? nextAt : token.length
            tokens.push(...tokenizeMasterCSSAtQuery(token.slice(i, end), offset + i))
            i = end
        } else if (char === ':') {
            const colonLength = token[i + 1] === ':' ? 2 : 1
            const pseudoModifier = colonLength === 2 ? 'pseudoElement' : 'pseudoClass'
            const delimiterRole = colonLength === 2 ? 'selector.pseudoElement.delimiter' : 'selector.pseudoClass.delimiter'
            const nameRole = colonLength === 2 ? 'selector.pseudoElement.name' : 'selector.pseudoClass.name'
            pushMasterCSSLexicalToken(tokens, offset + i, colonLength, 'operator', delimiterRole, ['selector', pseudoModifier])
            const nameStart = i + colonLength
            const match = token.slice(nameStart).match(/^[\w-]+/)
            if (match) {
                pushMasterCSSLexicalToken(tokens, offset + nameStart, match[0].length, 'modifier', nameRole, [pseudoModifier])
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

export function tokenizeMasterCSSGroupedClassToken(
    token: string,
    offset: number,
    tokenizeClassToken: (token: string, offset: number) => MasterCSSLexicalTokenItem[]
): MasterCSSLexicalTokenItem[] | undefined {
    const startsWithGroup = token.startsWith('{')
    const endsWithGroup = token.endsWith('}')
    const bodyStart = startsWithGroup ? 1 : 0
    const bodyEnd = endsWithGroup ? token.length - 1 : token.length
    const body = token.slice(bodyStart, bodyEnd)
    if (!startsWithGroup && !body.includes(';')) return

    const tokens: MasterCSSLexicalTokenItem[] = []
    if (startsWithGroup) pushMasterCSSLexicalToken(tokens, offset, 1, 'operator', 'block.brace')
    for (const part of splitMasterCSSTopLevel(body, ';')) {
        const partText = body.slice(part.start, part.end).trim()
        if (partText) {
            const leadingWhitespace = body.slice(part.start, part.end).search(/\S/)
            tokens.push(...tokenizeClassToken(partText, offset + bodyStart + part.start + Math.max(0, leadingWhitespace)))
        }
        if (part.separatorStart !== undefined) {
            pushMasterCSSLexicalToken(tokens, offset + bodyStart + part.separatorStart, 1, 'operator', 'declaration.terminator')
        }
    }
    if (endsWithGroup) pushMasterCSSLexicalToken(tokens, offset + token.length - 1, 1, 'operator', 'block.brace')
    return tokens
}
