import { toSemanticTokenItems, type HighlightTokenItem } from './highlight'
import {
  tokenizeClassListPrelude,
  tokenizeComposePrelude
} from './css/prelude'
import { containsPosition, type ScanOptions } from './css/shared'
import type { MasterCSS } from '../master-css'
import type { MasterCSSLanguageTokenClassification } from './tokenize-class'
import {
  collectMasterCSSClassListTokenRanges,
  collectCSSDirectiveRanges,
  tokenizeMasterCSSGroupedClassToken,
  type CSSDirectiveRuleRange
} from '@master/css-lexer'

const CSS_LANGUAGE_IDS = new Set(['css', 'scss', 'less'])

function tokenizeDirectiveClassList(
  source: string,
  directive: CSSDirectiveRuleRange,
  tokens: HighlightTokenItem[],
  css: MasterCSS | undefined,
  options: ScanOptions,
  classifications?: ReadonlyMap<string, MasterCSSLanguageTokenClassification>
) {
  const preludeStart = directive.preludeRange.start
  const preludeEnd = directive.preludeRange.end

  switch (directive.name) {
    case 'safelist':
      for (const stringRange of directive.quotedStringRanges) {
        if (containsPosition(stringRange.contentRange, options)) {
          tokenizeClassListPrelude(source, stringRange.start, stringRange.end, tokens, css, classifications)
        }
      }
      break
    case 'compose':
      if (!directive.blockRange && !directive.quotedStringRanges.length && containsPosition(directive.preludeRange, options)) {
        tokenizeComposePrelude(source, preludeStart, preludeEnd, tokens, css, classifications)
      }
      break
  }
}

function tokenizeDirectiveRule(
  source: string,
  directive: CSSDirectiveRuleRange,
  tokens: HighlightTokenItem[],
  css: MasterCSS | undefined,
  options: ScanOptions,
  classifications?: ReadonlyMap<string, MasterCSSLanguageTokenClassification>
) {
  if (!containsPosition(directive, options)) return
  tokenizeDirectiveClassList(source, directive, tokens, css, options, classifications)
}

export function isCSSSemanticTokenDocument(languageId: string) {
  return CSS_LANGUAGE_IDS.has(languageId)
}

function collectClassificationNamesFromToken(token: string, names: Set<string>) {
  const grouped = tokenizeMasterCSSGroupedClassToken(token, 0, (partText) => {
    collectClassificationNamesFromToken(partText, names)
    return []
  })
  if (!grouped && !token.startsWith('@')) names.add(token)
}

function collectClassListClassificationNames(classList: string, names: Set<string>) {
  for (const tokenRange of collectMasterCSSClassListTokenRanges(classList)) {
    collectClassificationNamesFromToken(tokenRange.token, names)
  }
}

export function collectCSSDirectiveClassNames(
  source: string,
  languageId: string,
  options: ScanOptions = {}
) {
  if (!isCSSSemanticTokenDocument(languageId)) return []
  const names = new Set<string>()
  for (const directive of collectCSSDirectiveRanges(source)) {
    if (!containsPosition(directive, options)) continue
    if (directive.name === 'safelist') {
      for (const stringRange of directive.quotedStringRanges) {
        if (containsPosition(stringRange.contentRange, options)) {
          collectClassListClassificationNames(
            source.slice(stringRange.contentRange.start, stringRange.contentRange.end),
            names
          )
        }
      }
      continue
    }
    if (
      directive.name === 'compose'
      && !directive.blockRange
      && !directive.quotedStringRanges.length
      && containsPosition(directive.preludeRange, options)
    ) {
      collectClassListClassificationNames(
        source.slice(directive.preludeRange.start, directive.preludeRange.end),
        names
      )
    }
  }
  return [...names]
}

export function collectCSSHighlightTokenItems(
  source: string,
  css: MasterCSS | undefined,
  languageId: string,
  options: ScanOptions = {},
  classifications?: ReadonlyMap<string, MasterCSSLanguageTokenClassification>
): HighlightTokenItem[] {
  if (!isCSSSemanticTokenDocument(languageId)) return []

  const tokens: HighlightTokenItem[] = []
  for (const directive of collectCSSDirectiveRanges(source)) {
    tokenizeDirectiveRule(source, directive, tokens, css, options, classifications)
  }

  return tokens
}

export function collectCSSSemanticTokenItems(source: string, css: MasterCSS, languageId: string, options: ScanOptions = {}) {
  return toSemanticTokenItems(collectCSSHighlightTokenItems(source, css, languageId, options))
}
