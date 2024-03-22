import { MasterCSS } from '@master/css'
import EventEmitter from 'node:events'
import type { Position, TextDocument } from 'vscode-languageserver-textdocument'
import settings, { type Settings } from './settings'
import { minimatch } from 'minimatch'
import { instancePattern } from './utils/regex'
import { fileURLToPath } from 'node:url'
import type { inspectSyntax, renderSyntaxColors, editSyntaxColors, hintSyntaxCompletions } from './features'
import extend from '@techor/extend'

export declare type Features = typeof inspectSyntax | typeof renderSyntaxColors | typeof editSyntaxColors | typeof hintSyntaxCompletions
export default class CSSLanguageService extends EventEmitter {
    css: MasterCSS
    settings: Settings
    // @ts-expect-error
    features: {
        inspectSyntax: typeof inspectSyntax | undefined,
        renderSyntaxColors: typeof renderSyntaxColors | undefined,
        editSyntaxColors: typeof editSyntaxColors | undefined,
        hintSyntaxCompletions: typeof hintSyntaxCompletions | undefined
    } = {}

    inspectSyntax(document: TextDocument, position: Position) {
        if (!this.isDocumentAllowed(document)) return
        return this.features.inspectSyntax?.call(this, document, position)
    }

    renderSyntaxColors(document: TextDocument) {
        if (!this.isDocumentAllowed(document)) return
        return this.features.renderSyntaxColors?.call(this, document)
    }

    editSyntaxColors(document: TextDocument, color: any, range: any) {
        if (!this.isDocumentAllowed(document)) return
        return this.features.editSyntaxColors?.call(this, document, color, range)
    }

    hintSyntaxCompletions(document: TextDocument, position: Position) {
        if (!this.isDocumentAllowed(document)) return
        return this.features.hintSyntaxCompletions?.call(this, document, position)
    }

    constructor(features: Features[], public customSettings?: Settings) {
        super()
        this.settings = extend(settings, customSettings)
        this.css = new MasterCSS(this.settings.config)
        for (const feature of features) {
            feature.bind(this)
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