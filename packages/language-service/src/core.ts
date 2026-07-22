import {
  defaultCSSLanguageRuntime,
  getClassPositions,
  type CSSLanguageRuntime,
  type MasterCSS,
  type ClassPosition,
  type RustLanguageAnalyzer,
  ClassPositionCache
} from '@master/css-language'
import { defu } from 'defu'
import EventEmitter from 'node:events'
import type { Position } from 'vscode-languageserver-protocol'
import settings, { type Settings } from './settings'
import { minimatch } from 'minimatch'
import inspectSyntax from './features/inspect-syntax'
import renderSyntaxColors from './features/render-syntax-colors'
import editSyntaxColors from './features/edit-syntax-colors'
import formatDirectives from './features/format-directives'
import renderSemanticTokens, { renderSemanticTokensAtPosition } from './features/render-semantic-tokens'
import suggestSyntax from './features/suggest-syntax'
import { TextDocument } from 'vscode-languageserver-textdocument'
import { createCompletionIndex, type CompletionIndex } from './utils/completion-index'

export type { ClassPosition }

export interface CSSLanguageServiceOptions {
  runtime?: CSSLanguageRuntime
  analyzer?: RustLanguageAnalyzer
}

export default class CSSLanguageService extends EventEmitter {
  css: MasterCSS
  runtime: CSSLanguageRuntime
  settings: Settings
  private completionIndex?: CompletionIndex
  private classPositionCache = new ClassPositionCache()
  readonly analyzer?: RustLanguageAnalyzer

  constructor(
    public customSettings?: Settings,
    options: CSSLanguageServiceOptions = {}
  ) {
    super()
    this.runtime = options.runtime ?? defaultCSSLanguageRuntime
    this.analyzer = options.analyzer
    this.settings = defu(customSettings, settings) as Settings
    this.css = this.runtime.MasterCSS.create({
      manifest: this.settings.manifest || this.runtime.defaultManifest,
      nativeDeclarationMatcher: this.runtime.nativeDeclarationMatcher
    })
  }

  private getCompletionIndex() {
    this.completionIndex ??= createCompletionIndex(this.css, this.runtime)
    return this.completionIndex
  }

  inspectSyntax(...params: Parameters<typeof inspectSyntax>) {
    if (this.settings.inspectSyntax && this.isDocumentAccepted(params[0]))
      return inspectSyntax?.call(this, ...params)
  }

  renderSyntaxColors(...params: Parameters<typeof renderSyntaxColors>) {
    if (this.settings.renderSyntaxColors && this.isDocumentAccepted(params[0]))
      return renderSyntaxColors?.call(this, ...params)
  }

  editSyntaxColors(...params: Parameters<typeof editSyntaxColors>) {
    if (this.settings.editSyntaxColors && this.isDocumentAccepted(params[0]))
      return editSyntaxColors?.call(this, ...params)
  }

  formatDirectives(...params: Parameters<typeof formatDirectives>) {
    if (this.settings.formatDirectives && this.isDocumentAccepted(params[0]))
      return formatDirectives?.call(this, ...params)
  }

  renderSemanticTokens(...params: Parameters<typeof renderSemanticTokens>) {
    if (this.isDocumentAccepted(params[0]))
      return renderSemanticTokens?.call(this, ...params)
  }

  renderSemanticTokensAtPosition(...params: Parameters<typeof renderSemanticTokensAtPosition>) {
    if (this.isDocumentAccepted(params[0]))
      return renderSemanticTokensAtPosition?.call(this, ...params)
  }

  suggestSyntax(
    document: Parameters<typeof suggestSyntax>[0],
    position: Parameters<typeof suggestSyntax>[1],
    context: Parameters<typeof suggestSyntax>[2]
  ) {
    if (this.settings.suggestSyntax && this.isDocumentAccepted(document))
      return suggestSyntax?.call(this, document, position, context, this.getCompletionIndex())
  }

  getClassPositions(textDocument: TextDocument): ClassPosition[] {
    return getClassPositions(textDocument, this.settings, {
      cache: this.classPositionCache,
      analyzer: this.analyzer
    })
  }

  getClassPosition(textDocument: TextDocument, position: Position): ClassPosition | undefined {
    const cachedOxcClassPosition = getClassPositions(textDocument, this.settings, {
      position,
      includeEmpty: true,
      provider: 'oxc',
      oxcMode: 'cache-only',
      cache: this.classPositionCache,
      analyzer: this.analyzer
    })[0]
    if (cachedOxcClassPosition) return cachedOxcClassPosition

    const regexClassPosition = getClassPositions(textDocument, this.settings, {
      position,
      includeEmpty: true,
      provider: 'regex',
      analyzer: this.analyzer
    })[0]
    if (regexClassPosition && !regexClassPosition.raw.includes('${')) {
      return regexClassPosition
    }

    return getClassPositions(textDocument, this.settings, {
      position,
      includeEmpty: true,
      provider: 'oxc',
      cache: this.classPositionCache,
      analyzer: this.analyzer
    })[0] ?? regexClassPosition
  }

  getClassContextPositions(textDocument: TextDocument, position: Position): ClassPosition[] {
    const cachedOxcClassPositions = getClassPositions(textDocument, this.settings, {
      position,
      provider: 'oxc',
      oxcMode: 'cache-only',
      positionMatch: 'context',
      cache: this.classPositionCache,
      analyzer: this.analyzer
    })
    if (cachedOxcClassPositions.length) return cachedOxcClassPositions

    const regexClassPositions = getClassPositions(textDocument, this.settings, {
      position,
      provider: 'regex',
      positionMatch: 'context',
      analyzer: this.analyzer
    })
    if (regexClassPositions.length && regexClassPositions.every(({ raw }) => !raw.includes('${'))) {
      return regexClassPositions
    }

    const oxcClassPositions = getClassPositions(textDocument, this.settings, {
      position,
      provider: 'oxc',
      positionMatch: 'context',
      cache: this.classPositionCache,
      analyzer: this.analyzer
    })
    return oxcClassPositions.length ? oxcClassPositions : regexClassPositions
  }

  isDocumentAccepted(doc: TextDocument): boolean {
    if (!this.settings.exclude) return true
    for (const exclude of this.settings.exclude) {
      if (minimatch(doc.uri, exclude)) {
        return false
      }
    }
    return true
  }
}
