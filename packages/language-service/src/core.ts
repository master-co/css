import { MasterCSS, createCSS } from '@master/css'
import extend from '@techor/extend'
import EventEmitter from 'node:events'
import type { Position } from 'vscode-languageserver-protocol'
import settings, { type Settings } from './settings'
import { minimatch } from 'minimatch'
import inspectSyntax from './features/inspect-syntax'
import renderSyntaxColors from './features/render-syntax-colors'
import editSyntaxColors from './features/edit-syntax-colors'
import suggestSyntax from './features/suggest-syntax'
import { TextDocument } from 'vscode-languageserver-textdocument'
import findMatchingPairs from './utils/find-matching-brackets'
import escapeRegexp from 'lodash.escaperegexp'

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

    suggestSyntax(...params: Parameters<typeof suggestSyntax>) {
        if (this.settings.suggestSyntax && this.isDocumentAccepted(params[0]))
            return suggestSyntax?.call(this, ...params)
    }

    getClassPosition(textDocument: TextDocument, position: Position): ClassPosition | undefined {
        const positionIndex = textDocument.offsetAt(position)
        const startIndex = textDocument.offsetAt({ line: position.line - 100, character: 0 }) ?? 0
        const endIndex = textDocument.offsetAt({ line: position.line + 100, character: 0 }) ?? undefined
        const text = textDocument.getText().substring(startIndex, endIndex)
        const { classAttributeBindings, classAttributes, classDeclarations, classFunctions } = this.settings
        const normalizeClassNamePosition = (className: string, attrStart: number, escapeCharacter: string) => {
            /**
             * Matching classes, including empty string after white space
             * @example <div class="class-a class-b "></div>
             * @url https://regex101.com/r/LnBLAV/1
             */
            for (const eachClassMatch of className.matchAll(/(?:[^\s]+)?/g)) {
                if (eachClassMatch.index === undefined) continue
                const raw = eachClassMatch[0]
                const classStartIndex = attrStart + eachClassMatch.index
                const classEndIndex = classStartIndex + raw.length
                if (classStartIndex <= positionIndex - startIndex && positionIndex - startIndex <= classEndIndex) {
                    return {
                        range: { start: classStartIndex, end: startIndex + classEndIndex },
                        raw,
                        token: raw.replace(new RegExp('\\' + escapeCharacter, 'g'), escapeCharacter)
                    }
                } else if (attrStart === classEndIndex) {
                    return {
                        range: { start: attrStart, end: attrStart },
                        raw: '',
                        token: ''
                    }
                }
            }
        }

        const resolve = (
            classMatchers: [string, string, string?][],
            handle: (eachAttrStart: number, eachClassPositionEnd: number, eachClassMatcher: [string, string, string?]) => ClassPosition | undefined
        ) => {
            for (const eachClassMatcher of classMatchers) {

                let [eachPattern, start, end] = eachClassMatcher
                end = end ?? start
                for (const eachClassPostioinMatch of text.matchAll(new RegExp(`(?:\\s|\\.)${eachPattern}${(escapeRegexp(start))}`, 'g'))) {
                    if (eachClassPostioinMatch.index === undefined) continue
                    const eachClassAttributeString = eachClassPostioinMatch[0]
                    const eachAttrStart = eachClassPostioinMatch.index + eachClassAttributeString.length
                    const eachClassPositionEnd = findMatchingPairs(text, eachAttrStart, start, end)
                    if (!eachClassPositionEnd) continue
                    if ((eachAttrStart <= (positionIndex - startIndex) && eachClassPositionEnd >= (positionIndex - startIndex)) === true) {
                        const classPosition = handle(eachAttrStart, eachClassPositionEnd, eachClassMatcher)
                        if (classPosition) return classPosition
                    } else if (eachClassPostioinMatch.index > (positionIndex - startIndex)) {
                        break
                    }
                }
            }
        }

        const stringExpressions: [string, string, string][] = []
        const assignmentExpressions: [string, string, string][] = []

        classAttributes?.forEach((eachClassAttribute) => {
            stringExpressions.push(
                [eachClassAttribute + '=', '"', '"'],
                [eachClassAttribute + '=', '\'', '\''],
            )
        })

        classDeclarations?.forEach((eachClassDeclaration) => {
            stringExpressions.push(
                [eachClassDeclaration + '(?:\\s+)?(?::|=)(?:\\s+)?', '"', '"'],
                [eachClassDeclaration + '(?:\\s+)?(?::|=)(?:\\s+)?', '`', '`'],
                [eachClassDeclaration + '(?:\\s+)?(?::|=)(?:\\s+)?', '\'', '\''],
            )

            assignmentExpressions.push(
                [eachClassDeclaration + '(?:\\s+)?(?::|=)(?:\\s+)?', '{', '}'],
            )
        })

        classFunctions?.forEach((eachClassFunction) => {
            /**
             * @example clsx`class-a class-b`
             */
            stringExpressions.push(
                [eachClassFunction, '`', '`'],
            )

            /**
             * @example clsx('class-a class-b')
             */
            assignmentExpressions.push(
                [eachClassFunction, '(', ')'],
            )
        })

        /**
         * @example <div class=""></div>
         * */
        if (stringExpressions?.length) {
            const classPosition = resolve(stringExpressions, (eachAttrStart, eachClassPositionEnd, [eachPattern, pair]) => {
                const eachClassName = text.substring(eachAttrStart, eachClassPositionEnd)
                /**
                 * @example <div class=""></div>
                 */
                if (eachClassName === undefined) {
                    return {
                        range: { start: eachAttrStart, end: eachAttrStart },
                        token: '',
                        raw: ''
                    }
                }
                const classNameStart = eachAttrStart
                const classPosition = normalizeClassNamePosition(eachClassName, classNameStart, pair)
                if (classPosition) return classPosition
            })
            if (classPosition) return classPosition
        }

        if (classAttributeBindings) {
            for (const eachClassAttribute in classAttributeBindings) {
                const eachClassAttributeBinding = classAttributeBindings[eachClassAttribute]
                if (eachClassAttributeBinding === false) continue
                assignmentExpressions.push([eachClassAttribute + '=', eachClassAttributeBinding[0], eachClassAttributeBinding[1]])
            }
        }

        /**
         * attribute binding
         * @example <div className={''}></div>
         * @example <div :class="isActive ? 'block' : 'hidden'"></div>
         * */
        if (assignmentExpressions?.length) {
            const classPosition = resolve(assignmentExpressions, (eachAttrStart, eachClassPositionEnd, eachClassMatcher) => {
                const eachClassPositionExpression = text.substring(eachAttrStart, eachClassPositionEnd)
                /**
                 * @example <div className={""}></div>
                 */
                if (['""', '\'\'', '``'].includes(eachClassPositionExpression)) {
                    return {
                        range: { start: eachAttrStart + 1, end: eachAttrStart + 1 },
                        raw: '',
                        token: ''
                    }
                }

                // 1. "
                for (const classExpressionMatch of eachClassPositionExpression.matchAll(/(?<!\\)"([\s\S]*?)(?<!\\)"/g)) {
                    if (classExpressionMatch.index === undefined) continue
                    const eachClassName = classExpressionMatch[1]
                    const classNameStart = eachAttrStart + classExpressionMatch.index + 1 // " length
                    const classPosition = normalizeClassNamePosition(eachClassName, classNameStart, '"')
                    if (classPosition) return classPosition
                }

                // 2. '
                for (const classExpressionMatch of eachClassPositionExpression.matchAll(/(?<!\\)'([\s\S]*?)(?<!\\)'/g)) {
                    if (classExpressionMatch.index === undefined) continue
                    const eachClassName = classExpressionMatch[1]
                    const classNameStart = eachAttrStart + classExpressionMatch.index + 1 // ' length
                    const classPosition = normalizeClassNamePosition(eachClassName, classNameStart, '\'')
                    if (classPosition) return classPosition
                }

                // 3. `
                for (const classExpressionMatch of eachClassPositionExpression.matchAll(/(?<!\\)`([\s\S]*?)(?<!\\)`/g)) {
                    if (classExpressionMatch.index === undefined) continue
                    const eachClassName = classExpressionMatch[1]
                    const classNameStart = eachAttrStart + classExpressionMatch.index + 1 // ` length
                    const classPosition = normalizeClassNamePosition(eachClassName, classNameStart, '`')
                    if (classPosition) return classPosition
                }
            })
            if (classPosition) return classPosition
        }
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