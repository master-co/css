import { toSemanticTokenItems, type HighlightTokenItem } from './highlight'
import {
  tokenizeClassListPrelude,
  tokenizeComposePrelude
} from './css/prelude'
import { containsPosition, type ScanOptions } from './css/shared'
import type { MasterCSS } from '../master-css'
import {
  collectCSSDirectiveRanges,
  type CSSDirectiveRuleRange
} from '@master/css-lexer'

const CSS_LANGUAGE_IDS = new Set(['css', 'scss', 'less'])

function tokenizeDirectiveClassList(source: string, directive: CSSDirectiveRuleRange, tokens: HighlightTokenItem[], css: MasterCSS, options: ScanOptions) {
  const preludeStart = directive.preludeRange.start
  const preludeEnd = directive.preludeRange.end

  switch (directive.name) {
    case 'safelist':
      for (const stringRange of directive.quotedStringRanges) {
        if (containsPosition(stringRange.contentRange, options)) {
          tokenizeClassListPrelude(source, stringRange.start, stringRange.end, tokens, css)
        }
      }
      break
    case 'compose':
      if (!directive.blockRange && !directive.quotedStringRanges.length && containsPosition(directive.preludeRange, options)) {
        tokenizeComposePrelude(source, preludeStart, preludeEnd, tokens, css)
      }
      break
  }
}

function tokenizeDirectiveRule(source: string, directive: CSSDirectiveRuleRange, tokens: HighlightTokenItem[], css: MasterCSS, options: ScanOptions) {
  if (!containsPosition(directive, options)) return
  tokenizeDirectiveClassList(source, directive, tokens, css, options)
}

export function isCSSSemanticTokenDocument(languageId: string) {
  return CSS_LANGUAGE_IDS.has(languageId)
}

export function collectCSSHighlightTokenItems(source: string, css: MasterCSS, languageId: string, options: ScanOptions = {}): HighlightTokenItem[] {
  if (!isCSSSemanticTokenDocument(languageId)) return []

  const tokens: HighlightTokenItem[] = []
  for (const directive of collectCSSDirectiveRanges(source)) {
    tokenizeDirectiveRule(source, directive, tokens, css, options)
  }

  return tokens
}

export function collectCSSSemanticTokenItems(source: string, css: MasterCSS, languageId: string, options: ScanOptions = {}) {
  return toSemanticTokenItems(collectCSSHighlightTokenItems(source, css, languageId, options))
}
