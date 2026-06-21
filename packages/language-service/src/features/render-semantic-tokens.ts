import type CSSLanguageService from '../core'
import type { TextDocument } from 'vscode-languageserver-textdocument'
import type { SemanticTokens } from 'vscode-languageserver-protocol'
import { encodeSemanticTokens } from '../semantic/encode'
import { toSemanticTokenItems, type HighlightTokenItem } from '../semantic/highlight'
import { collectCSSHighlightTokenItems, isCSSSemanticTokenDocument } from '../semantic/tokenize-css'
import { tokenizeClassToken } from '../semantic/tokenize-class'
import type { SemanticTokenItem } from '../semantic/types'

export { encodeSemanticTokens }
export type { HighlightTokenItem, SemanticTokenItem }

function encodeHighlightTokens(document: TextDocument, highlightTokens: HighlightTokenItem[]): SemanticTokens | undefined {
    if (!highlightTokens.length) return
    return encodeSemanticTokens(document, toSemanticTokenItems(highlightTokens))
}

export function collectEmbeddedHighlightTokenItems(this: CSSLanguageService, document: TextDocument, classPositions = this.getClassPositions(document)): HighlightTokenItem[] {
    const semanticTokens: HighlightTokenItem[] = []
    for (const classPosition of classPositions) {
        if (!classPosition.raw) continue
        semanticTokens.push(...tokenizeClassToken(this.css, classPosition.token, classPosition.range.start))
    }
    return semanticTokens
}

export function collectCSSDocumentHighlightTokenItems(this: CSSLanguageService, document: TextDocument, options: Parameters<typeof collectCSSHighlightTokenItems>[3] = {}): HighlightTokenItem[] {
    return collectCSSHighlightTokenItems(document.getText(), this.css, document.languageId, options)
}

export function collectHighlightTokenItems(this: CSSLanguageService, document: TextDocument, classPositions = this.getClassPositions(document)): HighlightTokenItem[] {
    if (isCSSSemanticTokenDocument(document.languageId)) {
        return collectCSSDocumentHighlightTokenItems.call(this, document)
    }

    return [
        ...collectEmbeddedHighlightTokenItems.call(this, document, classPositions),
        ...collectCSSDocumentHighlightTokenItems.call(this, document)
    ]
}

export function collectSemanticTokenItems(this: CSSLanguageService, document: TextDocument, classPositions = this.getClassPositions(document)): SemanticTokenItem[] {
    return toSemanticTokenItems(collectHighlightTokenItems.call(this, document, classPositions))
}

export function collectDocumentHighlightTokenItems(this: CSSLanguageService, document: TextDocument): HighlightTokenItem[] {
    const semanticTokens = collectCSSDocumentHighlightTokenItems.call(this, document)
    if (this.settings.embeddedSyntaxHighlighting === 'always' && !isCSSSemanticTokenDocument(document.languageId)) {
        semanticTokens.push(...collectEmbeddedHighlightTokenItems.call(this, document))
    }
    return semanticTokens
}

export function collectDocumentSemanticTokenItems(this: CSSLanguageService, document: TextDocument): SemanticTokenItem[] {
    return toSemanticTokenItems(collectDocumentHighlightTokenItems.call(this, document))
}

export function collectActiveHighlightTokenItems(this: CSSLanguageService, document: TextDocument, position: Parameters<CSSLanguageService['getClassPosition']>[1]): HighlightTokenItem[] {
    if (this.settings.embeddedSyntaxHighlighting !== 'off' && !isCSSSemanticTokenDocument(document.languageId)) {
        const classPositions = this.getClassContextPositions(document, position)
        if (classPositions.length) {
            return collectEmbeddedHighlightTokenItems.call(this, document, classPositions)
        }
    }
    return collectCSSDocumentHighlightTokenItems.call(this, document, {
        positionOffset: document.offsetAt(position)
    })
}

export function renderSemanticTokensAtPosition(this: CSSLanguageService, document: TextDocument, position: Parameters<CSSLanguageService['getClassPosition']>[1]): SemanticTokens | undefined {
    return encodeHighlightTokens(document, collectActiveHighlightTokenItems.call(this, document, position))
}

export default function renderSemanticTokens(this: CSSLanguageService, document: TextDocument): SemanticTokens | undefined {
    return encodeHighlightTokens(document, collectDocumentHighlightTokenItems.call(this, document))
}
