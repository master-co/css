import type { TextDocument } from 'vscode-languageserver-textdocument'
import type { Position } from 'vscode-languageserver-protocol'
import type { Settings } from '../settings'
import findMatchingPairs from './find-matching-brackets'
import escapeRegexp from 'lodash.escaperegexp'
import type { ClassPosition } from '../core'
import { parseSync, visitorKeys } from 'oxc-parser'

export interface GetClassPositionsOptions {
    position?: Position
    lookaroundLines?: number
    includeEmpty?: boolean
    provider?: ClassPositionProvider
    oxcMode?: OxcClassPositionMode
    cache?: ClassPositionCache
}

type ClassMatcher = [string, string, string?]
type ClassPositionProvider = 'all' | 'regex' | 'oxc'
type OxcClassPositionMode = 'auto' | 'cache-only' | false

interface CachedOxcClassPositions {
    version: number
    languageId: string
    parseFailed: boolean
    positions: ClassPosition[]
}

interface OxcClassPositionsResult {
    authoritative: boolean
    positions: ClassPosition[]
}

interface OxcNode {
    type: string
    start?: number
    end?: number
    range?: [number, number]
    value?: unknown
    raw?: string
    name?: unknown
    key?: unknown
    id?: unknown
    left?: unknown
    right?: unknown
    init?: unknown
    callee?: unknown
    tag?: unknown
    quasi?: unknown
    arguments?: unknown[]
    expressions?: unknown[]
    quasis?: OxcTemplateElement[]
    [key: string]: unknown
}

interface OxcTemplateElement extends OxcNode {
    value?: {
        raw?: string
        cooked?: string | null
    }
    tail?: boolean
}

const JS_LANGUAGE_IDS = new Set([
    'javascript',
    'typescript',
    'javascriptreact',
    'typescriptreact'
])

const OXC_CACHE_LIMIT = 20

const OXC_SOURCE_BY_LANGUAGE_ID: Record<string, string> = {
    javascript: 'document.js',
    typescript: 'document.ts',
    javascriptreact: 'document.jsx',
    typescriptreact: 'document.tsx'
}

export class ClassPositionCache {
    private oxc = new Map<string, CachedOxcClassPositions>()

    getOxc(textDocument: TextDocument): CachedOxcClassPositions | undefined {
        const key = getOxcCacheKey(textDocument)
        const cached = this.oxc.get(key)
        if (!cached || cached.version !== textDocument.version || cached.languageId !== textDocument.languageId) {
            if (cached) this.oxc.delete(key)
            return
        }
        this.oxc.delete(key)
        this.oxc.set(key, cached)
        return cached
    }

    setOxc(textDocument: TextDocument, cached: CachedOxcClassPositions) {
        const key = getOxcCacheKey(textDocument)
        this.oxc.set(key, cached)
        while (this.oxc.size > OXC_CACHE_LIMIT) {
            const oldestKey = this.oxc.keys().next().value
            if (oldestKey === undefined) break
            this.oxc.delete(oldestKey)
        }
    }
}

function unescapeClass(raw: string, escapeCharacter: string) {
    if (!escapeCharacter) return raw
    return raw.replace(new RegExp('\\' + escapeCharacter, 'g'), escapeCharacter)
}

function getOxcCacheKey(textDocument: TextDocument) {
    return `${textDocument.languageId}:${textDocument.uri}`
}

function isJavaScriptDocument(textDocument: TextDocument) {
    return JS_LANGUAGE_IDS.has(textDocument.languageId)
}

function isOxcNode(value: unknown): value is OxcNode {
    return !!value && typeof value === 'object' && typeof (value as { type?: unknown }).type === 'string'
}

function getNodeRange(node: OxcNode): [number, number] | undefined {
    if (Array.isArray(node.range) && node.range.length === 2) return node.range
    if (typeof node.start === 'number' && typeof node.end === 'number') return [node.start, node.end]
}

function getNodeSource(source: string, node: unknown) {
    if (!isOxcNode(node)) return
    const range = getNodeRange(node)
    if (!range) return
    return source.slice(range[0], range[1])
}

function getIdentifierName(node: unknown): string | undefined {
    if (!isOxcNode(node)) return
    if (node.type === 'Identifier' || node.type === 'JSXIdentifier') {
        return typeof node.name === 'string' ? node.name : undefined
    }
    if (node.type === 'Literal') {
        return typeof node.value === 'string' ? node.value : undefined
    }
}

function getJSXAttributeName(node: unknown): string | undefined {
    if (!isOxcNode(node)) return
    const directName = getIdentifierName(node)
    if (directName) return directName
    if (node.type === 'JSXNamespacedName') {
        const namespace = getJSXAttributeName(node.namespace)
        const name = getJSXAttributeName(node.name)
        if (namespace && name) return `${namespace}:${name}`
    }
    if (node.type === 'JSXMemberExpression') {
        const object = getJSXAttributeName(node.object)
        const property = getJSXAttributeName(node.property)
        if (object && property) return `${object}.${property}`
    }
}

function createExactMatchers(patterns: string[] | undefined) {
    return (patterns ?? []).flatMap((pattern) => {
        try {
            return [new RegExp(`^(?:${pattern})$`)]
        } catch {
            return []
        }
    })
}

function matchesAny(source: string | undefined, matchers: RegExp[]) {
    if (!source) return false
    const trimmedSource = source.trim()
    return matchers.some((matcher) => matcher.test(trimmedSource))
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

function sortAndDeduplicate(classPositions: ClassPosition[]) {
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

function filterClassPositions(
    classPositions: ClassPosition[],
    includeEmpty: boolean,
    accept?: (start: number, end: number) => boolean
) {
    return classPositions.filter(({ range, raw }) => {
        if (!raw && !includeEmpty) return false
        return !accept || accept(range.start, range.end)
    })
}

function getOxcSource(textDocument: TextDocument) {
    const sourceByLanguageId = OXC_SOURCE_BY_LANGUAGE_ID[textDocument.languageId]
    if (sourceByLanguageId) return sourceByLanguageId
    return textDocument.uri.split(/[?#]/)[0] || 'document.js'
}

function hasClassPositionLookaround(text: string, settings: Settings) {
    for (const eachClassAttribute of settings.classAttributes ?? []) {
        if (new RegExp(`${escapeRegexp(eachClassAttribute)}\\s*=`).test(text)) return true
    }

    for (const eachClassAttribute in settings.classAttributeBindings ?? {}) {
        const eachClassAttributeBinding = settings.classAttributeBindings?.[eachClassAttribute]
        if (eachClassAttributeBinding === false) continue
        if (new RegExp(`${escapeRegexp(eachClassAttribute)}\\s*=`).test(text)) return true
    }

    for (const eachClassDeclaration of settings.classDeclarations ?? []) {
        try {
            if (new RegExp(`(?:^|[\\s{,])${eachClassDeclaration}\\s*(?::|=)`).test(text)) return true
        } catch {
            continue
        }
    }

    for (const eachClassFunction of settings.classFunctions ?? []) {
        try {
            if (new RegExp(`(?:^|[\\s.])${eachClassFunction}\\s*(?:\\(|\`)`).test(text)) return true
        } catch {
            continue
        }
    }

    return false
}

function collectOxcStringLiteral(
    source: string,
    node: OxcNode,
    includeEmpty: boolean,
    accept?: (start: number, end: number) => boolean
) {
    if (typeof node.value !== 'string') return []
    const range = getNodeRange(node)
    if (!range) return []
    const quote = source[range[0]]
    if (quote !== '"' && quote !== '\'') return []
    const classNameStart = range[0] + 1
    const classNameEnd = range[1] - 1
    if (classNameEnd < classNameStart) return []
    return collectClassPositions(
        source.slice(classNameStart, classNameEnd),
        classNameStart,
        quote,
        includeEmpty,
        accept
    )
}

function collectOxcTemplateLiteral(
    source: string,
    node: OxcNode,
    includeEmpty: boolean,
    accept?: (start: number, end: number) => boolean
) {
    const classPositions: ClassPosition[] = []
    for (const eachQuasi of node.quasis ?? []) {
        const range = getNodeRange(eachQuasi)
        const raw = eachQuasi.value?.raw
        if (!range || raw === undefined) continue
        const classNameStart = range[0] + 1
        classPositions.push(...collectClassPositions(
            source.slice(classNameStart, classNameStart + raw.length),
            classNameStart,
            '`',
            includeEmpty,
            accept
        ))
    }
    return classPositions
}

function collectOxcClassStrings(
    source: string,
    node: unknown,
    includeEmpty: boolean,
    accept?: (start: number, end: number) => boolean
) {
    const classPositions: ClassPosition[] = []
    const visit = (eachNode: unknown) => {
        if (!isOxcNode(eachNode)) return
        if (eachNode.type === 'Literal') {
            classPositions.push(...collectOxcStringLiteral(source, eachNode, includeEmpty, accept))
            return
        }
        if (eachNode.type === 'TemplateLiteral') {
            classPositions.push(...collectOxcTemplateLiteral(source, eachNode, includeEmpty, accept))
            for (const expression of eachNode.expressions ?? []) {
                visit(expression)
            }
            return
        }
        const keys = visitorKeys[eachNode.type] || []
        for (const key of keys) {
            const value = eachNode[key]
            if (Array.isArray(value)) {
                for (const child of value) visit(child)
            } else {
                visit(value)
            }
        }
    }
    visit(node)
    return classPositions
}

function createOxcClassPositions(
    textDocument: TextDocument,
    settings: Settings
): CachedOxcClassPositions {
    const source = textDocument.getText()
    let parseResult: ReturnType<typeof parseSync>
    try {
        parseResult = parseSync(getOxcSource(textDocument), source, {
            range: true,
            sourceType: 'unambiguous'
        })
    } catch {
        return {
            version: textDocument.version,
            languageId: textDocument.languageId,
            parseFailed: true,
            positions: []
        }
    }

    if (parseResult.errors.length) {
        return {
            version: textDocument.version,
            languageId: textDocument.languageId,
            parseFailed: true,
            positions: []
        }
    }

    const classPositions: ClassPosition[] = []
    const classAttributes = new Set(settings.classAttributes ?? [])
    const classAttributeBindings = new Set(Object
        .entries(settings.classAttributeBindings ?? {})
        .filter(([, value]) => value !== false)
        .map(([key]) => key))
    const classFunctionMatchers = createExactMatchers(settings.classFunctions)
    const classDeclarationMatchers = createExactMatchers(settings.classDeclarations)

    const collect = (node: unknown) => {
        classPositions.push(...collectOxcClassStrings(source, node, true))
    }

    const visit = (node: unknown) => {
        if (!isOxcNode(node)) return

        if (node.type === 'JSXAttribute') {
            const attributeName = getJSXAttributeName(node.name)
            const attributeValue = node.value
            if (attributeName && classAttributes.has(attributeName) && isOxcNode(attributeValue) && attributeValue.type === 'Literal') {
                collect(attributeValue)
            }
            if (attributeName && classAttributeBindings.has(attributeName) && isOxcNode(attributeValue) && attributeValue.type === 'JSXExpressionContainer') {
                collect(attributeValue.expression)
            }
        } else if (node.type === 'CallExpression') {
            if (matchesAny(getNodeSource(source, node.callee), classFunctionMatchers)) {
                for (const eachArgument of node.arguments ?? []) {
                    collect(eachArgument)
                }
            }
        } else if (node.type === 'TaggedTemplateExpression') {
            if (matchesAny(getNodeSource(source, node.tag), classFunctionMatchers)) {
                collect(node.quasi)
            }
        } else if (node.type === 'VariableDeclarator') {
            if (matchesAny(getIdentifierName(node.id), classDeclarationMatchers)) {
                collect(node.init)
            }
        } else if (node.type === 'AssignmentExpression') {
            if (matchesAny(getIdentifierName(node.left), classDeclarationMatchers)) {
                collect(node.right)
            }
        } else if (node.type === 'Property') {
            if (matchesAny(getIdentifierName(node.key), classDeclarationMatchers)) {
                collect(node.value)
            }
        }

        const keys = visitorKeys[node.type] || []
        for (const key of keys) {
            const value = node[key]
            if (Array.isArray(value)) {
                for (const child of value) visit(child)
            } else {
                visit(value)
            }
        }
    }

    visit(parseResult.program)
    return {
        version: textDocument.version,
        languageId: textDocument.languageId,
        parseFailed: false,
        positions: sortAndDeduplicate(classPositions)
    }
}

function getOxcClassPositions(
    textDocument: TextDocument,
    settings: Settings,
    options: GetClassPositionsOptions,
    lookaroundText: string,
    accept?: (start: number, end: number) => boolean
): OxcClassPositionsResult {
    if (!isJavaScriptDocument(textDocument) || options.oxcMode === false) {
        return { authoritative: false, positions: [] }
    }
    if (options.position && !hasClassPositionLookaround(lookaroundText, settings)) {
        return { authoritative: false, positions: [] }
    }

    const cached = options.cache?.getOxc(textDocument)
    if (cached) {
        return cached.parseFailed
            ? { authoritative: false, positions: [] }
            : { authoritative: true, positions: filterClassPositions(cached.positions, options.includeEmpty ?? false, accept) }
    }
    if (options.oxcMode === 'cache-only') {
        return { authoritative: false, positions: [] }
    }

    const created = createOxcClassPositions(textDocument, settings)
    options.cache?.setOxc(textDocument, created)
    return created.parseFailed
        ? { authoritative: false, positions: [] }
        : { authoritative: true, positions: filterClassPositions(created.positions, options.includeEmpty ?? false, accept) }
}

export default function getClassPositions(
    textDocument: TextDocument,
    settings: Settings,
    options: GetClassPositionsOptions = {}
): ClassPosition[] {
    const includeEmpty = options.includeEmpty ?? false
    const provider = options.provider ?? 'all'
    const onlyOxc = provider === 'oxc'
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

    if (provider !== 'regex') {
        const oxcClassPositions = getOxcClassPositions(textDocument, settings, options, text, acceptsPosition)
        if (onlyOxc || oxcClassPositions.authoritative) {
            return sortAndDeduplicate(oxcClassPositions.positions)
        }
    }

    if (onlyOxc) return []

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

    return sortAndDeduplicate(classPositions)
}
