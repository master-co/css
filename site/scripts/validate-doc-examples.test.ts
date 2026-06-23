import assert from 'node:assert/strict'
import { readdir, readFile } from 'node:fs/promises'
import path from 'node:path'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'
import { extractClassCandidates } from '@master/css-source'
import { validate } from '@master/css-validator'

const siteRoot = fileURLToPath(new URL('../', import.meta.url))
const appRoot = path.join(siteRoot, 'app/[locale]')
const docSections = new Set(['blog', 'guide', 'messages', 'reference'])
const visibleSourceFiles = [
    'app/[locale]/examples/layout-system/page.tsx',
    'app/[locale]/guide/installation/(main)/cdn/components/CDNCodes.tsx'
]

interface ExampleCandidate {
    candidate: string
    context: string
    file: string
    kind: string
    line: number
}

interface PageCategory {
    name: string
}

test('overview category references resolve to generated categories', async () => {
    const failures: string[] = []
    const entries = await readdir(appRoot, { withFileTypes: true })

    for (const eachEntry of entries) {
        if (!eachEntry.isDirectory()) continue

        const contentFile = path.join(appRoot, eachEntry.name, 'content.mdx')
        let content: string
        try {
            content = await readFile(contentFile, 'utf8')
        } catch (error) {
            if (isNotFoundError(error)) continue
            throw error
        }

        const categoryNames = await readGeneratedCategoryNames(eachEntry.name)
        for (const eachReference of extractOverviewCategoryReferences(content)) {
            if (!categoryNames.has(eachReference.name)) {
                failures.push(`${formatFileLine(contentFile, eachReference.line)} | ${eachReference.name}`)
            }
        }
    }

    assert.deepEqual(failures, [])
})

test('docs example classes are valid default preset classes or locally defined custom classes', async () => {
    const files = [
        ...await collectMdxDocs(),
        ...visibleSourceFiles.map((eachFile) => path.join(siteRoot, eachFile))
    ]
    const failures: string[] = []

    for (const file of files) {
        const content = await readFile(file, 'utf8')
        for (const eachCandidate of extractExampleCandidates(file, content)) {
            const result = validate(eachCandidate.candidate)
            if (result.matched && result.errors.length === 0) continue
            if (isAllowedPresetValidatorGap(eachCandidate.candidate, result)) continue
            if (isAllowedInvalidCandidate(eachCandidate)) continue

            failures.push([
                formatFileLine(eachCandidate.file, eachCandidate.line),
                eachCandidate.kind,
                eachCandidate.candidate,
                result.errors.map((eachError) => eachError.rawMessage ?? eachError.message).join('; ')
            ].join(' | '))
        }
    }

    assert.deepEqual(failures, [])
})

async function collectMdxDocs(): Promise<string[]> {
    const files: string[] = []
    await walk(appRoot, files)
    return files.filter((eachFile) => {
        if (!eachFile.endsWith('.mdx')) return false
        const section = path.relative(appRoot, eachFile).split(path.sep)[0]
        return docSections.has(section)
    })
}

async function walk(dir: string, out: string[]) {
    for (const eachEntry of await readdir(dir, { withFileTypes: true })) {
        const fullPath = path.join(dir, eachEntry.name)
        if (eachEntry.isDirectory()) {
            await walk(fullPath, out)
        } else {
            out.push(fullPath)
        }
    }
}

async function readGeneratedCategoryNames(section: string): Promise<Set<string>> {
    const categoryFile = path.join(siteRoot, '.categories', `${section}.json`)
    try {
        const categories = JSON.parse(await readFile(categoryFile, 'utf8')) as PageCategory[]
        return new Set(categories.map((eachCategory) => eachCategory.name))
    } catch (error) {
        if (isNotFoundError(error)) return new Set()
        throw error
    }
}

function extractOverviewCategoryReferences(content: string): { line: number, name: string }[] {
    const references: { line: number, name: string }[] = []
    const pattern = /(?:props\.pageCategories|categories)\.find\(\s*category\s*=>\s*category\.name\s*===\s*['"]([^'"]+)['"]\s*\)\??\.pages/g
    for (const match of content.matchAll(pattern)) {
        references.push({
            line: lineAt(content, match.index),
            name: match[1]
        })
    }
    return references
}

function isNotFoundError(error: unknown): boolean {
    return typeof error === 'object' && error !== null && 'code' in error && error.code === 'ENOENT'
}

function extractExampleCandidates(file: string, content: string): ExampleCandidate[] {
    const candidates: ExampleCandidate[] = []
    const fencedRanges: [number, number][] = []
    const fencePattern = /^```([^\n]*)\n([\s\S]*?)^```/gm
    let fenceMatch: RegExpExecArray | null

    while ((fenceMatch = fencePattern.exec(content))) {
        const info = fenceMatch[1]
        const body = fenceMatch[2]
        const bodyIndex = fenceMatch.index + fenceMatch[0].indexOf(body)
        fencedRanges.push([fenceMatch.index, fencePattern.lastIndex])
        candidates.push(...extractCandidatesFromSnippet({
            content,
            file,
            index: bodyIndex,
            kind: `fenced:${info.trim().split(/\s+/)[0] || 'text'}`,
            scanClassAttributes: true,
            text: body
        }))
    }

    const unfenced = blankRanges(content, fencedRanges)
    candidates.push(...extractCandidatesFromSnippet({
        content,
        file,
        index: 0,
        kind: 'mdx',
        scanClassAttributes: !file.endsWith('.mdx'),
        text: unfenced
    }))

    return candidates
}

function extractCandidatesFromSnippet(input: {
    content: string
    file: string
    index: number
    kind: string
    scanClassAttributes: boolean
    text: string
}): ExampleCandidate[] {
    const candidates: ExampleCandidate[] = []
    const add = (value: string, offset: number, kind = input.kind) => {
        if (value.includes('${')) return
        const normalizedValue = stripTemplateExpressions(value)
        const classCandidates = extractClassCandidates(normalizedValue)
        for (const eachCandidate of classCandidates) {
            if ((kind.endsWith(':class') || kind.endsWith(':class2css')) && !isTopLevelClassToken(eachCandidate, normalizedValue)) continue
            candidates.push({
                candidate: eachCandidate,
                context: contextFor(input.content, input.index + offset, value.length),
                file: input.file,
                kind,
                line: lineAt(input.content, input.index + offset)
            })
        }
    }

    for (const each of extractMarkedClasses(input.text)) {
        candidates.push({
            candidate: each.value,
            context: contextFor(input.content, input.index + each.index, each.value.length),
            file: input.file,
            kind: `${input.kind}:mark`,
            line: lineAt(input.content, input.index + each.index)
        })
    }

    if (input.scanClassAttributes) {
        for (const each of extractClassAttributeValues(input.text)) {
            add(each.value, each.index, `${input.kind}:class`)
        }
    }

    for (const each of extractDirectiveValues(input.text, '@compose')) {
        add(each.value, each.index, `${input.kind}:compose`)
    }

    for (const each of extractDirectiveValues(input.text, '@safelist')) {
        add(each.value, each.index, `${input.kind}:safelist`)
    }

    for (const each of extractClass2CSSValues(input.text)) {
        add(each.value, each.index, `${input.kind}:class2css`)
    }

    if (/^fenced:(?:txt|text)$/.test(input.kind)) {
        for (const each of extractClassListLines(input.text)) {
            add(each.value, each.index, `${input.kind}:line`)
        }
    }

    return candidates
}

function extractMarkedClasses(text: string): { index: number, value: string }[] {
    const out: { index: number, value: string }[] = []
    const pattern = /@MARK\s+(.+?)(?=\s*-->)/g
    let match: RegExpExecArray | null
    while ((match = pattern.exec(text))) {
        for (const eachValue of match[1].trim().split(/\s+/)) {
            out.push({ index: match.index, value: eachValue })
        }
    }
    return out
}

function extractDirectiveValues(text: string, directive: '@compose' | '@safelist'): { index: number, value: string }[] {
    const out: { index: number, value: string }[] = []
    const pattern = directive === '@compose'
        ? /@compose\s+([^;\n]+)/g
        : /@safelist\s+(["'])([\s\S]*?)\1/g
    let match: RegExpExecArray | null
    while ((match = pattern.exec(text))) {
        const value = directive === '@compose' ? match[1] : match[2]
        out.push({ index: match.index, value })
    }
    return out
}

function extractClass2CSSValues(text: string): { index: number, value: string }[] {
    const out: { index: number, value: string }[] = []
    const pattern = /<Class2CSS[\s\S]*?<\/Class2CSS>/g
    let match: RegExpExecArray | null
    while ((match = pattern.exec(text))) {
        for (const eachString of extractStringLiteralValues(match[0])) {
            out.push({ index: match.index + eachString.index, value: eachString.value })
        }
    }
    return out
}

function extractClassAttributeValues(text: string): { index: number, value: string }[] {
    const out: { index: number, value: string }[] = []
    const pattern = /\bclass(?:Name)?\s*=/g
    let match: RegExpExecArray | null
    while ((match = pattern.exec(text))) {
        if (!isTagAttribute(text, match.index)) continue
        let index = pattern.lastIndex
        while (/\s/.test(text[index] ?? '')) index++
        const quote = text[index]
        if (quote === '"' || quote === '\'' || quote === '`') {
            const literal = readStringLiteral(text, index)
            if (literal) {
                out.push({ index, value: literal.value })
                pattern.lastIndex = literal.end
            }
            continue
        }

        if (quote === '{') {
            const expression = readBalancedExpression(text, index)
            if (!expression) continue
            for (const eachString of extractStringLiteralValues(expression.value)) {
                out.push({ index: index + eachString.index, value: eachString.value })
            }
            pattern.lastIndex = expression.end
        }
    }
    return out
}

function extractStringLiteralValues(text: string): { index: number, value: string }[] {
    const out: { index: number, value: string }[] = []
    for (let index = 0; index < text.length; index++) {
        const quote = text[index]
        if (quote !== '"' && quote !== '\'' && quote !== '`') continue
        const literal = readStringLiteral(text, index)
        if (!literal) continue
        out.push({ index, value: literal.value })
        index = literal.end - 1
    }
    return out
}

function readStringLiteral(text: string, start: number): { end: number, value: string } | undefined {
    const quote = text[start]
    let value = ''
    for (let index = start + 1; index < text.length; index++) {
        const char = text[index]
        if (char === '\\') {
            value += char + (text[index + 1] ?? '')
            index++
            continue
        }
        if (char === quote) {
            return { end: index + 1, value }
        }
        value += char
    }
}

function readBalancedExpression(text: string, start: number): { end: number, value: string } | undefined {
    let depth = 0
    for (let index = start; index < text.length; index++) {
        const char = text[index]
        if (char === '"' || char === '\'' || char === '`') {
            const literal = readStringLiteral(text, index)
            if (!literal) return
            index = literal.end - 1
            continue
        }
        if (char === '{') {
            depth++
        } else if (char === '}') {
            depth--
            if (depth === 0) {
                return {
                    end: index + 1,
                    value: text.slice(start + 1, index)
                }
            }
        }
    }
}

function extractClassListLines(text: string): { index: number, value: string }[] {
    const out: { index: number, value: string }[] = []
    let offset = 0
    for (const line of text.split('\n')) {
        const value = line.trim()
        if (value && !/\s/.test(value) && /[:@]/.test(value)) {
            out.push({ index: offset + line.indexOf(value), value })
        }
        offset += line.length + 1
    }
    return out
}

function isTopLevelClassToken(candidate: string, value: string): boolean {
    return value.split(/\s+/).some((eachToken) => eachToken === candidate)
}

function isAllowedPresetValidatorGap(candidate: string, result: ReturnType<typeof validate>): boolean {
    if (!result.matched) return false
    if (!/^user-drag:(?:auto|element|none)(?=[:@!]|$)/.test(candidate)) return false
    return result.errors.every((eachError) => 'property' in eachError && eachError.property === 'user-drag')
}

function isAllowedInvalidCandidate(eachCandidate: ExampleCandidate): boolean {
    const candidate = eachCandidate.candidate
    if (eachCandidate.kind.endsWith(':mark') && !/[:@]/.test(candidate)) return true
    if (eachCandidate.kind.endsWith(':mark') && isSelectorMarker(candidate, eachCandidate.file)) return true
    if (/^[:@]/.test(candidate)) return true
    if (candidate.includes('`') || candidate.includes('…') || /[<>]/.test(candidate)) return true
    if (candidate === 'light' || candidate === 'dark') return true
    if (isExpectedDiagnostic(candidate, eachCandidate.file)) return true
    if (isExpectedBareSelectorTarget(candidate, eachCandidate.file)) return true
    if (isLocallyDefinedClass(candidate, eachCandidate.context)) return true
    if (usesLocallyDefinedVariant(candidate, eachCandidate.context)) return true
    if (usesLocallyDefinedToken(candidate, eachCandidate.context)) return true
    return false
}

function isExpectedDiagnostic(candidate: string, file: string): boolean {
    const relativePath = relativeSitePath(file)
    const diagnosticsByPath: [RegExp, Set<string>][] = [
        [/guide\/code-linting\//, new Set(['display:bloc', 'font', 'font:', 'text-align:cente'])],
        [/guide\/introduction\//, new Set(['font', 'font:'])],
        [/guide\/conditional-queries\//, new Set(['hidden@sm<=h', 'hidden@sm<=h<=lg'])],
        [/guide\/scanning-latent-classes\//, new Set(['card'])],
        [/guide\/compatibility\//, new Set(['display:banana', 'float:banana'])]
    ]
    return diagnosticsByPath.some(([pattern, classes]) => pattern.test(relativePath) && classes.has(candidate))
}

function isExpectedBareSelectorTarget(candidate: string, file: string): boolean {
    return /^[a-z][\w-]*$/.test(candidate) && /guide\/state-selectors\//.test(relativeSitePath(file))
}

function isSelectorMarker(candidate: string, file: string): boolean {
    if (/^[.[#>*_+~!,]/.test(candidate)) return true
    if (/^\[.+\]$/.test(candidate)) return true
    if (/[()[\]#.>*_+~!,=]/.test(candidate) && !candidate.includes('@')) return true
    return /guide\/state-selectors\//.test(relativeSitePath(file))
}

function isLocallyDefinedClass(candidate: string, context: string): boolean {
    if (!/^[a-z][\w-]*$/.test(candidate)) return false
    const escapedCandidate = escapeRegExp(candidate)
    return new RegExp(`(?:\\.${escapedCandidate}|(?:^|[\\s{])${escapedCandidate})\\s*\\{`, 'm').test(context)
}

function usesLocallyDefinedVariant(candidate: string, context: string): boolean {
    for (const eachVariant of candidate.match(/@[a-z][\w-]*/g) ?? []) {
        if (!context.includes(`@custom-variant ${eachVariant}`)) return false
    }
    return /@[a-z][\w-]*/.test(candidate)
}

function usesLocallyDefinedToken(candidate: string, context: string): boolean {
    const localTokens = collectLocalTokenNames(context)
    if (!localTokens.size) return false
    const candidateTokens = collectCandidateTokenNames(candidate)
    return candidateTokens.some((eachToken) => localTokens.has(eachToken))
}

function collectLocalTokenNames(context: string): Set<string> {
    const names = new Set<string>()
    for (const match of context.matchAll(/--([a-z][\w-]*)\s*:/g)) {
        const parts = match[1].split('-')
        for (let index = 0; index < parts.length; index++) {
            names.add(parts.slice(index).join('-'))
        }
    }
    return names
}

function collectCandidateTokenNames(candidate: string): string[] {
    const headlessCandidate = candidate
        .replace(/!.*/, '')
        .replace(/@[a-z0-9_()<>=!&|:-]+/gi, '')
    const valueIndex = headlessCandidate.indexOf(':')
    if (valueIndex === -1) return []
    const value = headlessCandidate
        .slice(valueIndex + 1)
        .split(':')[0]
        .replace(/\$([a-z][\w-]*)/gi, '$1')
    const names = new Set<string>()
    for (const part of value.split(/[|/(),\s]+/)) {
        const normalized = part.replace(/^[-+]?\d*\.?\d+[a-z%]*$/i, '').replace(/[^a-z0-9-]/gi, '')
        if (!normalized || ['none', 'solid', 'auto', 'normal', 'inherit', 'initial'].includes(normalized)) continue
        names.add(normalized)
        names.add(normalized.replace(/-\d+$/, ''))
    }
    return [...names]
}

function contextFor(content: string, index: number, length: number): string {
    return content.slice(Math.max(0, index - 12000), Math.min(content.length, index + length + 12000))
}

function isTagAttribute(text: string, index: number): boolean {
    const tagStart = text.lastIndexOf('<', index)
    const tagEnd = text.lastIndexOf('>', index)
    return tagStart !== -1 && tagStart > tagEnd
}

function stripTemplateExpressions(value: string): string {
    return value.replace(/\$\{[^}]*\}/g, ' ')
}

function blankRanges(content: string, ranges: [number, number][]): string {
    const chars = [...content]
    for (const [start, end] of ranges) {
        for (let index = start; index < end; index++) {
            if (chars[index] !== '\n') chars[index] = ' '
        }
    }
    return chars.join('')
}

function lineAt(content: string, index: number): number {
    let line = 1
    for (let position = 0; position < index; position++) {
        if (content[position] === '\n') line++
    }
    return line
}

function relativeSitePath(file: string): string {
    return path.relative(siteRoot, file).split(path.sep).join('/')
}

function formatFileLine(file: string, line: number): string {
    return `${relativeSitePath(file)}:${line}`
}

function escapeRegExp(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
