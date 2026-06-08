import type CSSLanguageService from '../core'
import type { TextDocument } from 'vscode-languageserver-textdocument'
import type { SemanticTokens } from 'vscode-languageserver-protocol'
import { encodeSemanticTokens } from '../semantic/encode'
import { toSemanticTokenItems, type HighlightTokenItem } from '../semantic/highlight'
import { collectCSSHighlightTokenItems } from '../semantic/tokenize-css'
import { tokenizeClassToken } from '../semantic/tokenize-class'
import type { SemanticTokenItem } from '../semantic/types'

export { encodeSemanticTokens }
export type { HighlightTokenItem, SemanticTokenItem }

export function collectHighlightTokenItems(this: CSSLanguageService, document: TextDocument, classPositions = this.getClassPositions(document)): HighlightTokenItem[] {
    const semanticTokens: HighlightTokenItem[] = []
    for (const classPosition of classPositions) {
        if (!classPosition.raw) continue
        semanticTokens.push(...tokenizeClassToken(this.css, classPosition.token, classPosition.range.start))
    }
    semanticTokens.push(...collectCSSHighlightTokenItems(document.getText(), this.css, document.languageId))
    return semanticTokens
}

export function collectSemanticTokenItems(this: CSSLanguageService, document: TextDocument, classPositions = this.getClassPositions(document)): SemanticTokenItem[] {
    return toSemanticTokenItems(collectHighlightTokenItems.call(this, document, classPositions))
}

export function renderSemanticTokensAtPosition(this: CSSLanguageService, document: TextDocument, position: Parameters<CSSLanguageService['getClassPosition']>[1]): SemanticTokens {
    const classPosition = this.getClassPosition(document, position)
    if (classPosition) {
        return encodeSemanticTokens(document, collectSemanticTokenItems.call(this, document, [classPosition]))
    }
    return encodeSemanticTokens(document, toSemanticTokenItems(collectCSSHighlightTokenItems(document.getText(), this.css, document.languageId, {
        positionOffset: document.offsetAt(position)
    })))
}

export default function renderSemanticTokens(this: CSSLanguageService, document: TextDocument): SemanticTokens {
    return encodeSemanticTokens(document, collectSemanticTokenItems.call(this, document))
}
