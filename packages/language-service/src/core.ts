import {
  type MasterCSSLanguageClassPosition,
  type MasterCSSToolingSession
} from '@master/css-tooling'
import { defu } from 'defu'
import EventEmitter from 'node:events'
import { minimatch } from 'minimatch'
import type { Position } from 'vscode-languageserver-protocol'
import type { TextDocument } from 'vscode-languageserver-textdocument'
import {
  defaultLanguageServiceSettings,
  type MasterCSSLanguageServiceSettings
} from './settings'
import inspectSyntax from './features/inspect-syntax'
import renderSyntaxColors from './features/render-syntax-colors'
import editSyntaxColors from './features/edit-syntax-colors'
import formatDirectives from './features/format-directives'
import renderSemanticTokens, { renderSemanticTokensAtPosition } from './features/render-semantic-tokens'
import suggestSyntax from './features/suggest-syntax'

export interface MasterCSSLanguageServiceOptions {
  session: MasterCSSToolingSession
}

export class MasterCSSLanguageService extends EventEmitter implements Disposable {
  readonly settings: MasterCSSLanguageServiceSettings
  readonly session: MasterCSSToolingSession

  constructor(
    public customSettings: MasterCSSLanguageServiceSettings | undefined,
    options: MasterCSSLanguageServiceOptions
  ) {
    super()
    if (!options?.session) {
      throw new TypeError('MasterCSSLanguageService requires a MasterCSSToolingSession.')
    }
    this.settings = defu(
      customSettings,
      defaultLanguageServiceSettings
    ) as MasterCSSLanguageServiceSettings
    this.session = options.session
  }

  dispose() {
    this.session.dispose()
    this.removeAllListeners()
  }

  [Symbol.dispose]() {
    this.dispose()
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

  getClassPositions(document: TextDocument): MasterCSSLanguageClassPosition[] {
    return this.analyzeDocumentClassPositions(document)
  }

  getClassPosition(
    document: TextDocument,
    position: Position
  ): MasterCSSLanguageClassPosition | undefined {
    const offset = document.offsetAt(position)
    return this.analyzeDocumentClassPositions(document)
      .find(({ range }) => offset >= range.start && offset <= range.end)
  }

  getClassContextPositions(
    document: TextDocument,
    position: Position
  ): MasterCSSLanguageClassPosition[] {
    const offset = document.offsetAt(position)
    return this.analyzeDocumentClassPositions(document)
      .filter(({ contextRange }) => offset >= contextRange.start && offset <= contextRange.end)
  }

  private analyzeDocumentClassPositions(
    document: TextDocument
  ): MasterCSSLanguageClassPosition[] {
    return [...this.session.analyzeDocument({
      source: document.getText(),
      languageId: document.languageId,
      settings: {
        classAttributes: this.settings.classAttributes,
        classFunctions: this.settings.classFunctions,
        classDeclarations: this.settings.classDeclarations
      }
    }).classPositions]
  }

  isDocumentAccepted(document: TextDocument): boolean {
    return !this.settings.exclude?.some((pattern) => minimatch(document.uri, pattern))
  }
}
