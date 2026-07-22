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
import type { MasterCSSLanguageClassIR } from '../rust-session'

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

function tokenizeGroupedClassToken(
  css: MasterCSS,
  token: string,
  offset: number,
  classifications?: ReadonlyMap<string, MasterCSSLanguageClassIR>
): HighlightTokenItem[] | undefined {
  const tokens = tokenizeMasterCSSGroupedClassToken(
    token,
    offset,
    (partText, partOffset) => tokenizeClassToken(css, partText, partOffset, classifications) as MasterCSSLexicalTokenItem[]
  )
  return tokens && toHighlightTokenItems(tokens)
}

export function tokenizeClassToken(
  css: MasterCSS,
  token: string,
  offset: number,
  classifications?: ReadonlyMap<string, MasterCSSLanguageClassIR>
): HighlightTokenItem[] {
  const groupedTokens = tokenizeGroupedClassToken(css, token, offset, classifications)
  if (groupedTokens) return groupedTokens

  if (token.startsWith('@')) {
    return tokenizeAtQuery(token, offset)
  }

  const tokens: HighlightTokenItem[] = []
  const classification = classifications?.get(token)
  if (classification) {
    if (classification.kind === 'unknown') return tokens
    if (classification.kind === 'component') {
      const stateStart = token.length - (classification.stateToken?.length ?? 0)
      pushHighlightToken(tokens, offset, stateStart, 'class', 'utility.component', ['declaration', 'component'])
      tokens.push(...tokenizeState(token, stateStart, offset))
      return tokens
    }
    if (classification.kind === 'semantic' || classification.kind === 'pattern') {
      const stateStart = token.length - (classification.stateToken?.length ?? 0)
      pushHighlightToken(tokens, offset, stateStart, 'enumMember', 'utility.semantic')
      tokens.push(...tokenizeState(token, stateStart, offset))
      return tokens
    }

    tokenizeKey(tokens, token, offset, classification.keyToken)
    const valueStart = classification.keyToken?.length
      ?? Math.max(0, token.indexOf(classification.valueToken ?? ''))
    if (classification.valueToken) {
      tokens.push(...tokenizeUtilityValue(
        token.slice(valueStart, valueStart + classification.valueToken.length),
        offset + valueStart,
        css
      ))
    }
    let stateStart = valueStart + (classification.valueToken?.length ?? 0)
    if (classification.important && token[stateStart] === '!') {
      pushHighlightToken(tokens, offset + stateStart, 1, 'operator', 'value.important', ['important'])
      stateStart++
    }
    tokens.push(...tokenizeState(token, stateStart, offset))
    return tokens
  }

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
