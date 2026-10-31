import type { TextDocument } from 'vscode-languageserver-textdocument'
import type { MasterCSSDocumentAnalysis } from '@master/css-tooling/language'
import type { MasterCSSLanguageService } from './core'

interface CachedAnalysis {
  version: number
  languageId: string
  settingsKey: string
  result: MasterCSSDocumentAnalysis
}

const documents = new WeakMap<MasterCSSLanguageService, WeakMap<TextDocument, CachedAnalysis>>()

export function clearDocumentAnalyses(service: MasterCSSLanguageService) {
  documents.delete(service)
}

/** The Rust document request for a document under the service's class settings. */
export function documentRequest(service: MasterCSSLanguageService, document: TextDocument) {
  return {
    source: document.getText(),
    languageId: document.languageId,
    settings: {
      classAttributes: service.settings.classAttributes,
      classFunctions: service.settings.classFunctions,
      classDeclarations: service.settings.classDeclarations
    }
  }
}

export function analyzeDocument(service: MasterCSSLanguageService, document: TextDocument) {
  const request = documentRequest(service, document)
  const settingsKey = JSON.stringify(request.settings)
  let cache = documents.get(service)
  const cached = cache?.get(document)
  if (cached && cached.version === document.version
    && cached.languageId === document.languageId && cached.settingsKey === settingsKey) {
    return cached.result
  }
  const result = service.session.analyzeDocument(request)
  if (!cache) documents.set(service, cache = new WeakMap())
  cache.set(document, { version: document.version, languageId: document.languageId, settingsKey, result })
  return result
}
