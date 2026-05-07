import type { SelectorTokenDefinitions } from '../types/config'

const IDENTIFIER_CHAR_RE = /[a-zA-Z0-9_-]/
const PREFIXED_TOKEN_RE = /^[:.#]/

function isIdentifierChar(value: string | undefined) {
    return !!value && IDENTIFIER_CHAR_RE.test(value)
}

function isBareTokenBoundary(selector: string, index: number) {
    const previous = selector[index - 1]
    return !previous || (!isIdentifierChar(previous) && previous !== ':' && previous !== '.' && previous !== '#')
}

function isSelectorTokenMatch(selector: string, index: number, token: string) {
    if (!selector.startsWith(token, index)) return false
    if (isIdentifierChar(selector[index + token.length])) return false
    return PREFIXED_TOKEN_RE.test(token) || isBareTokenBoundary(selector, index)
}

function replaceSelectorToken(selector: string, token: string, value: string) {
    let result = ''
    let index = 0

    while (index < selector.length) {
        const matchIndex = selector.indexOf(token, index)
        if (matchIndex === -1) {
            result += selector.slice(index)
            break
        }

        result += selector.slice(index, matchIndex)
        if (isSelectorTokenMatch(selector, matchIndex, token)) {
            result += value
            index = matchIndex + token.length
        } else {
            result += token
            index = matchIndex + token.length
        }
    }

    return result
}

export default function resolveSelectorTokens(selector: string, selectorTokens?: SelectorTokenDefinitions) {
    if (!selectorTokens) return selector
    let resolvedSelector = selector
    for (const token of Object.keys(selectorTokens).sort((a, b) => b.length - a.length)) {
        resolvedSelector = replaceSelectorToken(resolvedSelector, token, selectorTokens[token])
    }
    return resolvedSelector
}
