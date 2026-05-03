import type { TextDocument } from 'vscode-languageserver-textdocument'
import type { Position } from 'vscode-languageserver-protocol'
import type { Settings } from '../settings'
import findMatchingPairs from './find-matching-brackets'
import escapeRegexp from 'lodash.escaperegexp'
import type { ClassPosition } from '../core'

export interface GetClassPositionsOptions {
    position?: Position
    lookaroundLines?: number
    includeEmpty?: boolean
}

type ClassMatcher = [string, string, string?]

function unescapeClass(raw: string, escapeCharacter: string) {
    if (!escapeCharacter) return raw
    return raw.replace(new RegExp('\\' + escapeCharacter, 'g'), escapeCharacter)
}

function collectClassPositions(
    className: string,
    classNameStart: number,
    escapeCharacter: string,
    includeEmpty: boolean,
    accept?: (start: number, end: number) => boolean
) {
    const classPositions: ClassPosition[] = []
    /**
     * Matching classes, including empty string after white space.
     * @example <div class="class-a class-b "></div>
     */
    for (const eachClassMatch of className.matchAll(/(?:[^\s]+)?/g)) {
        if (eachClassMatch.index === undefined) continue
        const raw = eachClassMatch[0]
        if (!raw && !includeEmpty) continue
        const classStartIndex = classNameStart + eachClassMatch.index
        const classEndIndex = classStartIndex + raw.length
        if (accept && !accept(classStartIndex, classEndIndex)) continue
        if (!raw && classStartIndex !== classEndIndex) continue
        classPositions.push({
            range: { start: classStartIndex, end: classEndIndex },
            raw,
            token: unescapeClass(raw, escapeCharacter)
        })
    }
    return classPositions
}

export default function getClassPositions(
    textDocument: TextDocument,
    settings: Settings,
    options: GetClassPositionsOptions = {}
): ClassPosition[] {
    const includeEmpty = options.includeEmpty ?? false
    const positionIndex = options.position && textDocument.offsetAt(options.position)
    const lookaroundLines = options.lookaroundLines ?? 100
    const startIndex = options.position
        ? textDocument.offsetAt({ line: options.position.line - lookaroundLines, character: 0 })
        : 0
    const endIndex = options.position
        ? textDocument.offsetAt({ line: options.position.line + lookaroundLines, character: 0 })
        : undefined
    const text = textDocument.getText().substring(startIndex, endIndex)
    const classPositions: ClassPosition[] = []
    const { classAttributeBindings, classAttributes, classDeclarations, classFunctions } = settings
    const acceptsPosition = (start: number, end: number) => {
        if (positionIndex === undefined) return true
        return start <= positionIndex && positionIndex <= end
    }

    if (textDocument.languageId === 'master-css') {
        return collectClassPositions(text, startIndex, '', includeEmpty, acceptsPosition)
    }

    const resolve = (
        classMatchers: ClassMatcher[],
        handle: (eachAttrStart: number, eachClassPositionEnd: number, eachClassMatcher: ClassMatcher) => void
    ) => {
        for (const eachClassMatcher of classMatchers) {
            let [eachPattern, start, end] = eachClassMatcher
            end = end ?? start
            for (const eachClassPositionMatch of text.matchAll(new RegExp(`(?:\\s|\\.)${eachPattern}${escapeRegexp(start)}`, 'g'))) {
                if (eachClassPositionMatch.index === undefined) continue
                const eachClassAttributeString = eachClassPositionMatch[0]
                const eachAttrStart = startIndex + eachClassPositionMatch.index + eachClassAttributeString.length
                const localAttrStart = eachAttrStart - startIndex
                const eachClassPositionEnd = findMatchingPairs(text, localAttrStart, start, end)
                if (!eachClassPositionEnd) continue
                const absoluteClassPositionEnd = startIndex + eachClassPositionEnd
                if (positionIndex !== undefined) {
                    if (eachAttrStart <= positionIndex && absoluteClassPositionEnd >= positionIndex) {
                        handle(eachAttrStart, absoluteClassPositionEnd, eachClassMatcher)
                    } else if (eachClassPositionMatch.index > positionIndex - startIndex) {
                        break
                    }
                } else {
                    handle(eachAttrStart, absoluteClassPositionEnd, eachClassMatcher)
                }
            }
        }
    }

    const stringExpressions: ClassMatcher[] = []
    const assignmentExpressions: ClassMatcher[] = []

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
        stringExpressions.push(
            [eachClassFunction, '`', '`'],
        )

        assignmentExpressions.push(
            [eachClassFunction, '(', ')'],
        )
    })

    if (stringExpressions.length) {
        resolve(stringExpressions, (eachAttrStart, eachClassPositionEnd, [, pair]) => {
            const eachClassName = textDocument.getText().substring(eachAttrStart, eachClassPositionEnd)
            classPositions.push(...collectClassPositions(eachClassName, eachAttrStart, pair, includeEmpty, acceptsPosition))
        })
    }

    if (classAttributeBindings) {
        for (const eachClassAttribute in classAttributeBindings) {
            const eachClassAttributeBinding = classAttributeBindings[eachClassAttribute]
            if (eachClassAttributeBinding === false) continue
            assignmentExpressions.push([eachClassAttribute + '=', eachClassAttributeBinding[0], eachClassAttributeBinding[1]])
        }
    }

    if (assignmentExpressions.length) {
        resolve(assignmentExpressions, (eachAttrStart, eachClassPositionEnd) => {
            const eachClassPositionExpression = textDocument.getText().substring(eachAttrStart, eachClassPositionEnd)
            if (['""', '\'\'', '``'].includes(eachClassPositionExpression)) {
                if (includeEmpty && acceptsPosition(eachAttrStart + 1, eachAttrStart + 1)) {
                    classPositions.push({
                        range: { start: eachAttrStart + 1, end: eachAttrStart + 1 },
                        raw: '',
                        token: ''
                    })
                }
                return
            }

            for (const classExpressionMatch of eachClassPositionExpression.matchAll(/(?<!\\)"([\s\S]*?)(?<!\\)"/g)) {
                if (classExpressionMatch.index === undefined) continue
                const eachClassName = classExpressionMatch[1]
                const classNameStart = eachAttrStart + classExpressionMatch.index + 1
                classPositions.push(...collectClassPositions(eachClassName, classNameStart, '"', includeEmpty, acceptsPosition))
            }

            for (const classExpressionMatch of eachClassPositionExpression.matchAll(/(?<!\\)'([\s\S]*?)(?<!\\)'/g)) {
                if (classExpressionMatch.index === undefined) continue
                const eachClassName = classExpressionMatch[1]
                const classNameStart = eachAttrStart + classExpressionMatch.index + 1
                classPositions.push(...collectClassPositions(eachClassName, classNameStart, '\'', includeEmpty, acceptsPosition))
            }

            for (const classExpressionMatch of eachClassPositionExpression.matchAll(/(?<!\\)`([\s\S]*?)(?<!\\)`/g)) {
                if (classExpressionMatch.index === undefined) continue
                const eachClassName = classExpressionMatch[1]
                const classNameStart = eachAttrStart + classExpressionMatch.index + 1
                classPositions.push(...collectClassPositions(eachClassName, classNameStart, '`', includeEmpty, acceptsPosition))
            }
        })
    }

    const seen = new Set<string>()
    return classPositions
        .sort((a, b) => a.range.start - b.range.start || a.range.end - b.range.end)
        .filter((classPosition) => {
            const id = `${classPosition.range.start}:${classPosition.range.end}`
            if (seen.has(id)) return false
            seen.add(id)
            return true
        })
}
