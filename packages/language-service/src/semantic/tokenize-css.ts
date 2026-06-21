import { pushHighlightToken, toSemanticTokenItems, type HighlightTokenItem } from './highlight'
import { tokenizeCustomVariantBlock } from './css/custom-variant'
import { MANAGED_DEFINITION_DIRECTIVES, tokenizeManagedDefinitionBlock } from './css/managed'
import { tokenizeDeclarations } from './css/native'
import {
    tokenizeClassListPrelude,
    tokenizeComposePrelude,
    tokenizeCustomVariantPrelude,
    tokenizePreservePrelude,
    tokenizeSourcePrelude,
    tokenizeThemePrelude,
    tokenizeVariantPrelude
} from './css/prelude'
import { containsPosition, type ScanOptions } from './css/shared'
import type { MasterCSS } from '../master-css'
import {
    collectCSSDirectiveRanges,
    type CSSDirectiveRuleRange
} from '@master/css-lexer'

const CSS_LANGUAGE_IDS = new Set(['css', 'scss', 'less'])

function tokenizeDirectivePrelude(source: string, directive: CSSDirectiveRuleRange, tokens: HighlightTokenItem[], css: MasterCSS) {
    const preludeStart = directive.preludeRange.start
    const preludeEnd = directive.preludeRange.end
    switch (directive.name) {
        case 'source':
            tokenizeSourcePrelude(source, preludeStart, preludeEnd, tokens)
            break
        case 'safelist':
            tokenizeClassListPrelude(source, preludeStart, preludeEnd, tokens, css)
            break
        case 'preserve':
            tokenizePreservePrelude(source, preludeStart, preludeEnd, tokens)
            break
        case 'settings':
        case 'theme':
            tokenizeThemePrelude(source, preludeStart, preludeEnd, tokens)
            break
        case 'custom-variant':
            tokenizeCustomVariantPrelude(source, preludeStart, preludeEnd, tokens)
            break
        case 'compose':
            tokenizeComposePrelude(source, preludeStart, preludeEnd, tokens, css)
            break
        case 'variant':
            tokenizeVariantPrelude(source, preludeStart, preludeEnd, tokens)
            break
    }
}

function tokenizeDirectiveBody(source: string, directive: CSSDirectiveRuleRange, tokens: HighlightTokenItem[]) {
    if (!directive.blockRange || !directive.blockContentRange) return

    if (directive.name === 'settings') {
        tokenizeDeclarations(source, directive.blockContentRange.start, directive.blockContentRange.end, tokens, { declarationProperties: 'settings' })
    } else if (directive.name === 'theme') {
        tokenizeDeclarations(source, directive.blockContentRange.start, directive.blockContentRange.end, tokens, { declarationProperties: 'theme' })
    } else if (directive.name === 'custom-variant') {
        tokenizeCustomVariantBlock(source, directive.blockContentRange.start, directive.blockContentRange.end, tokens)
    } else if (MANAGED_DEFINITION_DIRECTIVES.has(directive.name)) {
        tokenizeManagedDefinitionBlock(source, directive.blockContentRange.start, directive.blockContentRange.end, tokens)
    }
}

function tokenizeDirectiveRule(source: string, directive: CSSDirectiveRuleRange, tokens: HighlightTokenItem[], css: MasterCSS, options: ScanOptions) {
    if (!containsPosition(directive, options)) return

    pushHighlightToken(tokens, directive.keywordRange.start, directive.keywordRange.end - directive.keywordRange.start, 'keyword', 'directive.keyword', ['directive'])
    tokenizeDirectivePrelude(source, directive, tokens, css)

    if (directive.blockRange && directive.blockContentRange) {
        tokenizeDirectiveBody(source, directive, tokens)
    }

    if (directive.semicolonRange) {
        pushHighlightToken(tokens, directive.semicolonRange.start, directive.semicolonRange.end - directive.semicolonRange.start, 'operator', 'directive.terminator', ['directive'])
    }
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
