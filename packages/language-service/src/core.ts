import { MasterCSS } from '@master/css'
import extend from '@techor/extend'
import EventEmitter from 'node:events'
import type { Position, TextDocument } from 'vscode-languageserver-textdocument'
import settings, { type Settings } from './settings'
import { minimatch } from 'minimatch'
import { fileURLToPath } from 'node:url'
import inspectSyntax from './features/inspect-syntax'
import renderSyntaxColors from './features/render-syntax-colors'
import editSyntaxColors from './features/edit-syntax-colors'
import hintSyntaxCompletions from './features/hint-syntax-completions'

export default class CSSLanguageService extends EventEmitter {
    css: MasterCSS
    settings: Settings

    constructor(
        public customSettings?: Settings
    ) {
        super()
        this.settings = extend(settings, customSettings)
        this.css = new MasterCSS(this.settings.config)
    }

    inspectSyntax(...params: Parameters<typeof inspectSyntax>) {
        if (this.settings.inspectSyntax && this.isDocumentAllowed(params[0]))
            return inspectSyntax?.call(this, ...params)
    }

    renderSyntaxColors(...params: Parameters<typeof renderSyntaxColors>) {
        if (this.settings.renderSyntaxColors && this.isDocumentAllowed(params[0]))
            return renderSyntaxColors?.call(this, ...params)
    }

    editSyntaxColors(...params: Parameters<typeof editSyntaxColors>) {
        if (this.settings.renderSyntaxColors && this.isDocumentAllowed(params[0]))
            return editSyntaxColors?.call(this, ...params)
    }

    hintSyntaxCompletions(...params: Parameters<typeof hintSyntaxCompletions>) {
        if (this.settings.hintSyntaxCompletions && this.isDocumentAllowed(params[0]))
            return hintSyntaxCompletions?.call(this, ...params)
    }

    // todo unit tests
    getClassPosition(textDocument: TextDocument, position: Position): { range: { start: number, end: number }, token: string } | undefined {
        const positionIndex = textDocument.offsetAt(position)
        const startIndex = textDocument.offsetAt({ line: position.line - 100, character: 0 }) ?? 0
        const endIndex = textDocument.offsetAt({ line: position.line + 100, character: 0 }) ?? undefined
        const text = textDocument.getText().substring(startIndex, endIndex)
        const classAttributes = this.settings.classAttributes
        if (!classAttributes?.length) throw new Error('classAttributes is not defined')
        const regex = new RegExp(`\\b(?:${classAttributes.join('|')})\\s?=\\s?(['"\`])(.*?)\\1`, 'g')
        let match: RegExpExecArray | null
        let attrIndex
        while ((match = regex.exec(text)) !== null) {
            attrIndex = match.index + match[0].indexOf(match[2])
            if (attrIndex <= positionIndex - startIndex && positionIndex - startIndex <= attrIndex + match[2].length) {
                return {
                    range: { start: startIndex + attrIndex, end: startIndex + attrIndex + match[2].length },
                    token: match[2]
                }
            } else if (attrIndex === attrIndex + match[2].length) {
                return {
                    range: { start: positionIndex - startIndex, end: positionIndex - startIndex },
                    token: ''
                }
            }
        }
        return undefined
    }


    isDocumentAllowed(doc: TextDocument): boolean {
        if (!this.settings.exclude) return true
        for (const exclude of this.settings.exclude) {
            if (minimatch(fileURLToPath(doc.uri), exclude)) {
                return false
            }
        }
        return true
    }
}