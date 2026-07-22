import {
  type LanguageClassPositionIR as ClassPosition,
  type LanguageSession
} from '@master/css-language'
import { defu } from 'defu'
import EventEmitter from 'node:events'
import { minimatch } from 'minimatch'
import type { Position } from 'vscode-languageserver-protocol'
import type { TextDocument } from 'vscode-languageserver-textdocument'
import settings, { type Settings } from './settings'
import inspectSyntax from './features/inspect-syntax'
import renderSyntaxColors from './features/render-syntax-colors'
import editSyntaxColors from './features/edit-syntax-colors'
import formatDirectives from './features/format-directives'
import renderSemanticTokens, { renderSemanticTokensAtPosition } from './features/render-semantic-tokens'
import suggestSyntax from './features/suggest-syntax'

export type { ClassPosition }

export interface CSSLanguageServiceOptions {
  session: LanguageSession
}

export default class CSSLanguageService extends EventEmitter {
  readonly settings: Settings
  readonly session: LanguageSession

  constructor(public customSettings: Settings | undefined, options: CSSLanguageServiceOptions) {
    super()
    if (!options?.session) {
      throw new TypeError('CSSLanguageService requires a Rust language session.')
    }
    this.settings = defu(customSettings, settings) as Settings
    this.session = options.session
  }

  dispose() {
    this.session.dispose()
    this.removeAllListeners()
  }

  inspectSyntax(...params: Parameters<typeof inspectSyntax>) {
    if (this.settings.inspectSyntax && this.isDocumentAccepted(params[0]))
      return inspectSyntax.call(this, ...params)
  }

  renderSyntaxColors(...params: Parameters<typeof renderSyntaxColors>) {
    if (this.settings.renderSyntaxColors && this.isDocumentAccepted(params[0]))
      return renderSyntaxColors.call(this, ...params)
  }

  editSyntaxColors(...params: Parameters<typeof editSyntaxColors>) {
    if (this.settings.editSyntaxColors && this.isDocumentAccepted(params[0]))
      return editSyntaxColors.call(this, ...params)
  }

  formatDirectives(...params: Parameters<typeof formatDirectives>) {
    if (this.settings.formatDirectives && this.isDocumentAccepted(params[0]))
      return formatDirectives.call(this, ...params)
  }

  renderSemanticTokens(...params: Parameters<typeof renderSemanticTokens>) {
    if (this.isDocumentAccepted(params[0])) return renderSemanticTokens.call(this, ...params)
  }

  renderSemanticTokensAtPosition(...params: Parameters<typeof renderSemanticTokensAtPosition>) {
    if (this.isDocumentAccepted(params[0])) return renderSemanticTokensAtPosition.call(this, ...params)
  }

  suggestSyntax(...params: Parameters<typeof suggestSyntax>) {
    if (this.settings.suggestSyntax && this.isDocumentAccepted(params[0]))
      return suggestSyntax.call(this, ...params)
  }

  getClassPositions(document: TextDocument): ClassPosition[] {
    return this.analyzeDocumentClassPositions(document)
  }

  getClassPosition(document: TextDocument, position: Position): ClassPosition | undefined {
    const offset = document.offsetAt(position)
    return this.analyzeDocumentClassPositions(document)
      .find(({ range }) => offset >= range.start && offset <= range.end)
  }

  getClassContextPositions(document: TextDocument, position: Position): ClassPosition[] {
    const offset = document.offsetAt(position)
    return this.analyzeDocumentClassPositions(document)
      .filter(({ contextRange }) => offset >= contextRange.start && offset <= contextRange.end)
  }

  private analyzeDocumentClassPositions(document: TextDocument): ClassPosition[] {
    return this.session.analyzeDocument({
      source: document.getText(),
      languageId: document.languageId,
      settings: {
        classAttributes: this.settings.classAttributes,
        classFunctions: this.settings.classFunctions,
        classDeclarations: this.settings.classDeclarations
      }
    }).classPositions
  }

  isDocumentAccepted(document: TextDocument): boolean {
    return !this.settings.exclude?.some((pattern) => minimatch(document.uri, pattern))
  }
}
