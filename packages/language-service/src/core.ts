import { Config, MasterCSS } from '@master/css'
import EventEmitter from 'node:events'
import type { Position, TextDocument } from 'vscode-languageserver-textdocument'
import settings, { type Settings } from './settings'
import { minimatch } from 'minimatch'
import { instancePattern } from './utils/regex'
import { fileURLToPath } from 'node:url'
import inspectSyntax from './features/inspect-syntax'
import renderSyntaxColors from './features/render-syntax-colors'
import editSyntaxColors from './features/edit-syntax-colors'
import { ColorPresentationParams } from 'vscode-languageserver'
import hintSyntaxCompletions from './features/hint-syntax-completions'
import extend from '@techor/extend'

export default class CSSLanguageService extends EventEmitter {
    css: MasterCSS
    settings: Settings

    constructor(public customSettings?: Settings) {
        super()
        this.settings = extend(settings, customSettings)
        this.css = new MasterCSS(this.settings.config)
    }

    onCompletion(textDocument: TextDocument, position: Position) {
        if (this.settings.hintSyntaxCompletions && this.isDocAllowed(textDocument)) {
            return hintSyntaxCompletions.call(this, textDocument, position)
        }
    }

    onHover(textDocument: TextDocument, position: Position) {
        if (this.settings.inspectSyntax && this.isDocAllowed(textDocument)) {
            return inspectSyntax.call(this, textDocument, position)
        }
    }

    onDocumentColor(textDocument: TextDocument) {
        if (this.settings.renderSyntaxColors && this.isDocAllowed(textDocument)) {
            return renderSyntaxColors.call(this, textDocument)
        }
    }

    onColorPresentation(textDocument: TextDocument, color: ColorPresentationParams['color'], range: ColorPresentationParams['range']) {
        if (this.settings.renderSyntaxColors && this.isDocAllowed(textDocument)) {
            return editSyntaxColors.call(this, textDocument, color, range)
        }
    }

    getPosition(textDocument: TextDocument, position: Position, patterns?: string[]): {
        index: { start: number, end: number },
        instanceContent: string
    } | undefined {
        const positionIndex = textDocument.offsetAt(position) ?? 0
        const startIndex = textDocument.offsetAt({ line: position.line - 100, character: 0 }) ?? 0
        const endIndex = textDocument.offsetAt({ line: position.line + 100, character: 0 }) ?? undefined
        const text = textDocument.getText().substring(startIndex, endIndex)
        let result
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
                            result = {
                                index: {
                                    start: instanceStartIndex,
                                    end: instanceEndIndex
                                },
                                instanceContent: instanceMatch[0]
                            }
                            return result
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

    isDocAllowed(doc: TextDocument): boolean {
        if (!this.settings.exclude) return true
        for (const exclude of this.settings.exclude) {
            if (minimatch(fileURLToPath(doc.uri), exclude)) {
                return false
            }
        }
        return true
    }
}