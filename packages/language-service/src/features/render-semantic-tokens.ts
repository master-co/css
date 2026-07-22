import type CSSLanguageService from '../core'
import type { TextDocument } from 'vscode-languageserver-textdocument'
import type { SemanticTokens } from 'vscode-languageserver-protocol'

function analyzeDocument(service: CSSLanguageService, document: TextDocument): SemanticTokens | undefined {
  const result = service.session.analyzeDocument({
    source: document.getText(),
    languageId: document.languageId,
    settings: {
      classAttributes: service.settings.classAttributes,
      classFunctions: service.settings.classFunctions,
      classDeclarations: service.settings.classDeclarations
    }
  })
  return result.semanticTokenData.length ? { data: result.semanticTokenData } : undefined
}

export function renderSemanticTokensAtPosition(
  this: CSSLanguageService,
  document: TextDocument,
  position: Parameters<CSSLanguageService['getClassPosition']>[1]
): SemanticTokens | undefined {
  void position
  return analyzeDocument(this, document)
}

export default function renderSemanticTokens(
  this: CSSLanguageService,
  document: TextDocument
): SemanticTokens | undefined {
  return analyzeDocument(this, document)
}
