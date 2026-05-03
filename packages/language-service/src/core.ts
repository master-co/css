import { MasterCSS, createCSS } from '@master/css'
import extend from '@techor/extend'
import EventEmitter from 'node:events'
import type { Position } from 'vscode-languageserver-protocol'
import settings, { type Settings } from './settings'
import { minimatch } from 'minimatch'
import inspectSyntax from './features/inspect-syntax'
import renderSyntaxColors from './features/render-syntax-colors'
import editSyntaxColors from './features/edit-syntax-colors'
import renderSemanticTokens from './features/render-semantic-tokens'
import suggestSyntax from './features/suggest-syntax'
import { TextDocument } from 'vscode-languageserver-textdocument'
import getClassPositions from './utils/get-class-positions'

export interface ClassPosition { range: { start: number, end: number }, raw: string, token: string }

export default class CSSLanguageService extends EventEmitter {
    css: MasterCSS
    settings: Settings

    constructor(
        public customSettings?: Settings
    ) {
        super()
        this.settings = extend(settings, customSettings)
        this.css = createCSS(this.settings.config)
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

    renderSemanticTokens(...params: Parameters<typeof renderSemanticTokens>) {
        if (this.settings.renderSemanticTokens && this.isDocumentAccepted(params[0]))
            return renderSemanticTokens?.call(this, ...params)
    }

    suggestSyntax(...params: Parameters<typeof suggestSyntax>) {
        if (this.settings.suggestSyntax && this.isDocumentAccepted(params[0]))
            return suggestSyntax?.call(this, ...params)
    }

    getClassPositions(textDocument: TextDocument): ClassPosition[] {
        return getClassPositions(textDocument, this.settings)
    }

    getClassPosition(textDocument: TextDocument, position: Position): ClassPosition | undefined {
        return getClassPositions(textDocument, this.settings, {
            position,
            includeEmpty: true
        })[0]
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
