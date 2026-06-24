import { UtilityType, type MasterCSS } from '../master-css'
import { inspectMasterCSSClass } from '@master/css-engine/inspect'
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
        (partText, partOffset) => tokenizeClassToken(css, partText, partOffset) as MasterCSSLexicalTokenItem[]
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
    const inspection = inspectMasterCSSClass(css, token)
    const rules = inspection.rules
    const component = rules.find((rule) => rule.type === UtilityType.Semantic && rule.layerName === 'components')
    if (component) {
        const stateStart = token.length - (component.stateToken?.length ?? 0)
        pushHighlightToken(tokens, offset, stateStart, 'class', 'utility.component', ['declaration', 'component'])
        tokens.push(...tokenizeState(token, stateStart, offset))
        return tokens
    }

    const rule = rules[0]
    if (!rule) return tokens

    if (rule.type === UtilityType.Semantic) {
        const stateStart = token.length - (rule.stateToken?.length ?? 0)
        pushHighlightToken(tokens, offset, stateStart, 'enumMember', 'utility.semantic')
        tokens.push(...tokenizeState(token, stateStart, offset))
        return tokens
    }

    if (inspection.matcherTypes.includes('pattern')) {
        const stateStart = token.length - (rule.stateToken?.length ?? 0)
        pushHighlightToken(tokens, offset, stateStart, 'enumMember', 'utility.semantic')
        tokens.push(...tokenizeState(token, stateStart, offset))
        return tokens
    }

    tokenizeKey(tokens, token, offset, inspection.keyToken)
    const valueStart = inspection.keyToken?.length ?? Math.max(0, token.indexOf(inspection.valueToken ?? ''))
    if (inspection.valueToken) {
        tokens.push(...tokenizeUtilityValue(token.slice(valueStart, valueStart + inspection.valueToken.length), offset + valueStart, css))
    }

    let stateStart = valueStart + (inspection.valueToken?.length ?? 0)
    if (inspection.important && token[stateStart] === '!') {
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
