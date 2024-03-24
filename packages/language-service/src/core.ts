import { MasterCSS } from '@master/css'
import extend from '@techor/extend'
import EventEmitter from 'node:events'
import type { Position, TextDocument } from 'vscode-languageserver-textdocument'
import settings, { type Settings } from './settings'
import { minimatch } from 'minimatch'
import { instancePattern } from './utils/regex'
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

    getPosition(textDocument: TextDocument, position: Position, patterns?: string[]): {
        range: { start: number, end: number },
        token: string
    } | undefined {
        const positionIndex = textDocument.offsetAt(position) ?? 0
        const startIndex = textDocument.offsetAt({ line: position.line - 100, character: 0 }) ?? 0
        const endIndex = textDocument.offsetAt({ line: position.line + 100, character: 0 }) ?? undefined
        const text = textDocument.getText().substring(startIndex, endIndex)
        let instanceMatch: RegExpExecArray | null
        let classMatch: RegExpExecArray | null
        if (!patterns) patterns = this.settings.classMatch
        if (!patterns) return
        for (const classRegexString of patterns) {
            const classPattern = new RegExp(classRegexString, 'g')
            while ((classMatch = classPattern.exec(text)) !== null) {
                if ((classMatch.index <= (positionIndex - startIndex) && classMatch.index + classMatch[0].length >= (positionIndex - startIndex)) == true) {
                    const classContentStartIndex = classMatch.index + classMatch[1].length
                    instancePattern.lastIndex = 0
                    while ((instanceMatch = instancePattern.exec(classMatch[2])) !== null) {
                        const instanceStartIndex = classContentStartIndex + instanceMatch.index
                        const instanceEndIndex = classContentStartIndex + instanceMatch.index + instanceMatch[0].length
                        if (instanceStartIndex <= (positionIndex - startIndex) && instanceEndIndex >= (positionIndex - startIndex)) {
                            return {
                                range: {
                                    start: instanceStartIndex,
                                    end: instanceEndIndex
                                },
                                token: instanceMatch[0]
                            }
                        }
                    }
                }
                else if (classMatch.index > (positionIndex - startIndex)) {
                    break
                }
            }
        }
        return
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