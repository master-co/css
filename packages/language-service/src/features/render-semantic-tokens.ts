import type CSSLanguageService from '../core'
import type { TextDocument } from 'vscode-languageserver-textdocument'
import type { SemanticTokens } from 'vscode-languageserver-protocol'
import {
  renderSemanticTokens as renderLanguageSemanticTokens,
  renderSemanticTokensAtPosition as renderLanguageSemanticTokensAtPosition
} from '@master/css-language'

export function renderSemanticTokensAtPosition(this: CSSLanguageService, document: TextDocument, position: Parameters<CSSLanguageService['getClassPosition']>[1]): SemanticTokens | undefined {
  return renderLanguageSemanticTokensAtPosition(
    this.css,
    document,
    this.getClassContextPositions(document, position),
    position,
    this.settings
  )
}

export default function renderSemanticTokens(this: CSSLanguageService, document: TextDocument): SemanticTokens | undefined {
  return renderLanguageSemanticTokens(
    this.css,
    document,
    this.getClassPositions(document),
    this.settings
  )
}
