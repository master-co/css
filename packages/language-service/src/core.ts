import { MasterCSS } from '@master/css'
import extend from '@techor/extend'
import EventEmitter from 'node:events'
import type { Position } from 'vscode-languageserver-protocol'
import settings, { type Settings } from './settings'
import { minimatch } from 'minimatch'
import { fileURLToPath } from 'node:url'
import inspectSyntax from './features/inspect-syntax'
import renderSyntaxColors from './features/render-syntax-colors'
import editSyntaxColors from './features/edit-syntax-colors'
import hintSyntaxCompletions from './features/hint-syntax-completions'
import { TextDocument } from 'vscode-languageserver-textdocument'

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

    getClassPosition(textDocument: TextDocument, position: Position): { range: { start: number, end: number }, token: string } | undefined {
        const positionIndex = textDocument.offsetAt(position)
        const startIndex = textDocument.offsetAt({ line: position.line - 100, character: 0 }) ?? 0
        const endIndex = textDocument.offsetAt({ line: position.line + 100, character: 0 }) ?? undefined
        const text = textDocument.getText().substring(startIndex, endIndex)
        const classPositionRegexes: RegExp[] = []
        const classAttributes = this.settings.classAttributes
        if (classAttributes?.length) {
            const classAttributesPatten = classAttributes.join('|')
            classPositionRegexes.push(
                /**
                 * @example <div class=""></div>
                 * */
                new RegExp(`(\\b(?:${classAttributesPatten})\\s?=\\s?)((?:"(?:[^"]+)?")|(?:'(?:[^']+)?')|(?:\`(?:[^\`]+)?\`))`, 'g'),
                /**
                 * @example <div className={''}></div>
                 * */
                new RegExp(`(\\b(?:${classAttributesPatten})=)({[^}]*})`, 'g')
            )
        }
        const classRegex = /[^\s:]+:\w*\(?((?<!\\)["'`])((?:\\\1|(?:(?!\1))\S)*)((?<!\\)\1)\)?|[^\s"'`]+/g
        let eachClassPostioinMatch: RegExpExecArray | null
        let classMatch: RegExpExecArray | null
        for (const eachClassPositionRegex of classPositionRegexes) {
            while ((eachClassPostioinMatch = eachClassPositionRegex.exec(text)) !== null) {
                if ((eachClassPostioinMatch.index <= (positionIndex - startIndex) && eachClassPostioinMatch.index + eachClassPostioinMatch[0].length >= (positionIndex - startIndex)) === true) {
                    const attrStartIndex = eachClassPostioinMatch.index + eachClassPostioinMatch[1].length
                    const eachClassPositionValue = eachClassPostioinMatch[2]
                    /**
                     * @example <div class=""></div>
                     */
                    if (['""', '\'\'', '``'].includes(eachClassPositionValue)) {
                        return {
                            range: { start: attrStartIndex + 1, end: attrStartIndex + 1 },
                            token: ''
                        }
                    }
                    while ((classMatch = classRegex.exec(eachClassPositionValue)) !== null) {
                        const token = classMatch[0]
                        const classStartIndex = attrStartIndex + classMatch.index
                        const classEndIndex = classStartIndex + token.length
                        if (classStartIndex <= positionIndex - startIndex && positionIndex - startIndex <= classEndIndex) {
                            return {
                                range: { start: classStartIndex, end: startIndex + classEndIndex },
                                token
                            }
                        } else if (attrStartIndex === classEndIndex) {
                            return {
                                range: { start: attrStartIndex, end: attrStartIndex },
                                token: ''
                            }
                        }
                    }
                } else if (eachClassPostioinMatch.index > (positionIndex - startIndex)) {
                    break
                }
            }
        }
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