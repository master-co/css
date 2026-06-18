import { UtilityType, type MasterCSS } from '../master-css'
import {
    collectMasterCSSClassListTokenRanges,
    tokenizeMasterCSSAtQuery,
    tokenizeMasterCSSGroupedClassToken,
    tokenizeMasterCSSState,
    tokenizeMasterCSSValue,
    type MasterCSSLexicalTokenItem
} from '@master/css-lexer'
import { pushHighlightToken, toSemanticTokenItems, type HighlightTokenItem } from './highlight'

function toHighlightTokenItems(tokens: MasterCSSLexicalTokenItem[]): HighlightTokenItem[] {
    return tokens as HighlightTokenItem[]
}

export function tokenizeUtilityValue(valueText: string, valueStart: number, css?: MasterCSS): HighlightTokenItem[] {
    return toHighlightTokenItems(tokenizeMasterCSSValue(valueText, valueStart, {
        isKnownVariable: (name) => css?.variables.has(name) ?? false
    }))
}

export function tokenizeAtQuery(queryText: string, queryStart: number): HighlightTokenItem[] {
    return toHighlightTokenItems(tokenizeMasterCSSAtQuery(queryText, queryStart))
}

export function tokenizeState(token: string, stateStart: number, offset: number): HighlightTokenItem[] {
    return toHighlightTokenItems(tokenizeMasterCSSState(token, stateStart, offset))
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
    const tokens = tokenizeMasterCSSGroupedClassToken(
        token,
        offset,
        (partText, partOffset) => tokenizeClassToken(css, partText, partOffset)
    )
    return tokens && toHighlightTokenItems(tokens)
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

    if (rule.registeredUtility.matchers.some((matcher) => matcher.type === 'pattern')) {
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
    for (const range of collectMasterCSSClassListTokenRanges(classList)) {
        tokens.push(...tokenizeClassToken(css, range.token, offset + range.start))
    }
    return tokens
}

export function collectClassListSemanticTokenItems(css: MasterCSS, classList: string, offset = 0) {
    return toSemanticTokenItems(collectClassListHighlightTokenItems(css, classList, offset))
}
