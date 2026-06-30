import { createCSSWithNativeDeclarations } from '@master/css-validator'
import {
    createClassListLintReport,
    type MasterCSSLintDiagnostic,
    type MasterCSSLintFix
} from '@master/css-lint'
import { getClassPositions, languageSettings } from '@master/css-language'
import { loadProjectManifest } from '@master/css-project/manifest'
import fg from 'fast-glob'
import fs from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

const DEFAULT_SOURCE_PATTERNS = ['**/*.{html,htm,js,jsx,cjs,ts,tsx,mts,cts,svelte,astro,vue,md,mdx,pug,php}']
const DEFAULT_IGNORE_PATTERNS = ['**/node_modules/**', 'node_modules']
const MAX_FIX_PASSES = 10

export interface LintOptions {
    fix?: boolean
    format?: 'stylish' | 'json'
    maxWarnings?: string | number
    cwd?: string
}

interface SourceRange {
    start: number
    end: number
}

interface SourceLocation {
    line: number
    column: number
}

interface SourceLocationRange {
    start: SourceLocation
    end: SourceLocation
}

interface CLILintFix extends Omit<MasterCSSLintFix, 'range'> {
    range: SourceRange
}

interface CLILintDiagnostic extends Omit<MasterCSSLintDiagnostic, 'range' | 'fix'> {
    range: SourceRange
    loc: SourceLocationRange
    fix?: CLILintFix
}

interface CLILintFileResult {
    filePath: string
    diagnostics: CLILintDiagnostic[]
}

interface ClassListContext {
    range: SourceRange
    text: string
    unescape?: string | false
}

interface TextDocumentLike {
    uri: string
    languageId: string
    version: number
    getText(): string
}

const languageByExtension: Record<string, string> = {
    '.astro': 'astro',
    '.css': 'css',
    '.htm': 'html',
    '.html': 'html',
    '.js': 'javascript',
    '.cjs': 'javascript',
    '.jsx': 'javascriptreact',
    '.less': 'less',
    '.md': 'markdown',
    '.mdx': 'mdx',
    '.mts': 'typescript',
    '.cts': 'typescript',
    '.php': 'html',
    '.pug': 'html',
    '.scss': 'scss',
    '.svelte': 'svelte',
    '.ts': 'typescript',
    '.tsx': 'typescriptreact',
    '.vue': 'vue'
}

function normalizeSourcePatterns(specifiedSourcePaths?: string[]) {
    return specifiedSourcePaths?.length ? specifiedSourcePaths : DEFAULT_SOURCE_PATTERNS
}

function normalizeGlobPatterns(patterns: string[]) {
    return patterns.map((pattern) => pattern.replace(/\\/g, '/'))
}

function resolveSourcePaths(cwd: string, sourcePatterns: string[], ignore: string[] = []) {
    return fg.sync(normalizeGlobPatterns(sourcePatterns), {
        cwd,
        ignore: normalizeGlobPatterns(ignore),
        onlyFiles: true
    }).filter(Boolean)
}

function getLanguageId(filePath: string) {
    return languageByExtension[path.extname(filePath).toLowerCase()] || 'html'
}

function createTextDocument(filePath: string, content: string): TextDocumentLike {
    return {
        uri: pathToFileURL(filePath).href,
        languageId: getLanguageId(filePath),
        version: 0,
        getText: () => content
    }
}

function detectClassListUnescape(content: string, range: SourceRange) {
    const quote = content[range.start - 1]
    return quote === '"' || quote === '\'' || quote === '`' ? quote : false
}

function collectClassListContexts(content: string, filePath: string): ClassListContext[] {
    const textDocument = createTextDocument(filePath, content)
    const positions = getClassPositions(textDocument as any, languageSettings)
    const contexts = new Map<string, ClassListContext>()
    for (const position of positions) {
        const contextRange = position.contextRange
        const key = `${contextRange.start}:${contextRange.end}`
        if (contexts.has(key)) continue
        contexts.set(key, {
            range: contextRange,
            text: content.slice(contextRange.start, contextRange.end),
            unescape: detectClassListUnescape(content, contextRange)
        })
    }
    return [...contexts.values()].sort((a, b) => a.range.start - b.range.start || a.range.end - b.range.end)
}

function offsetToLocation(content: string, offset: number): SourceLocation {
    let line = 1
    let lineStart = 0
    for (let index = 0; index < offset; index++) {
        if (content[index] === '\n') {
            line++
            lineStart = index + 1
        }
    }
    return {
        line,
        column: offset - lineStart + 1
    }
}

function toCLIDiagnostic(
    content: string,
    context: ClassListContext,
    diagnostic: MasterCSSLintDiagnostic
): CLILintDiagnostic {
    const range = {
        start: context.range.start + diagnostic.range.start,
        end: context.range.start + diagnostic.range.end
    }
    const fix = diagnostic.fix?.scope === 'directive'
        ? undefined
        : diagnostic.fix && {
            ...diagnostic.fix,
            range: {
                start: context.range.start + diagnostic.fix.range.start,
                end: context.range.start + diagnostic.fix.range.end
            }
        }

    return {
        ...diagnostic,
        range,
        loc: {
            start: offsetToLocation(content, range.start),
            end: offsetToLocation(content, range.end)
        },
        ...(fix ? { fix } : {})
    }
}

function lintContent(content: string, filePath: string, css: ReturnType<typeof createCSSWithNativeDeclarations>): CLILintFileResult {
    const diagnostics: CLILintDiagnostic[] = []
    for (const context of collectClassListContexts(content, filePath)) {
        const report = createClassListLintReport(context.text, css, {
            unescape: context.unescape
        })
        diagnostics.push(...report.diagnostics.map((diagnostic) => toCLIDiagnostic(content, context, diagnostic)))
    }
    return { filePath, diagnostics }
}

function applyReplacement(content: string, range: SourceRange, text: string) {
    return content.slice(0, range.start) + text + content.slice(range.end)
}

function fixClassList(classList: string, css: ReturnType<typeof createCSSWithNativeDeclarations>, unescape: string | false | undefined) {
    let fixed = classList
    for (let pass = 0; pass < MAX_FIX_PASSES; pass++) {
        const fix = createClassListLintReport(fixed, css, { unescape }).diagnostics
            .map((diagnostic) => diagnostic.fix)
            .find((fix): fix is MasterCSSLintFix => Boolean(fix && fix.scope !== 'directive'))
        if (!fix) return fixed
        const next = applyReplacement(fixed, fix.range, fix.text)
        if (next === fixed) return fixed
        fixed = next
    }
    return fixed
}

function fixContent(content: string, filePath: string, css: ReturnType<typeof createCSSWithNativeDeclarations>) {
    const replacements = collectClassListContexts(content, filePath)
        .map((context) => ({
            range: context.range,
            text: fixClassList(context.text, css, context.unescape)
        }))
        .filter((replacement) => content.slice(replacement.range.start, replacement.range.end) !== replacement.text)
        .sort((a, b) => b.range.start - a.range.start || b.range.end - a.range.end)

    let fixed = content
    for (const replacement of replacements) {
        fixed = applyReplacement(fixed, replacement.range, replacement.text)
    }
    return fixed
}

function parseMaxWarnings(value: string | number | undefined) {
    if (value === undefined) return Number.POSITIVE_INFINITY
    const maxWarnings = Number(value)
    return Number.isFinite(maxWarnings) && maxWarnings >= 0 ? maxWarnings : 0
}

function formatStylish(results: CLILintFileResult[]) {
    const lines: string[] = []
    for (const result of results) {
        if (!result.diagnostics.length) continue
        lines.push(result.filePath)
        for (const diagnostic of result.diagnostics) {
            lines.push(`  ${diagnostic.loc.start.line}:${diagnostic.loc.start.column}  ${diagnostic.severity}  ${diagnostic.message}  @master/css/${diagnostic.ruleId}`)
        }
    }
    return lines.length ? `${lines.join('\n')}\n` : ''
}

function countDiagnostics(results: CLILintFileResult[]) {
    const diagnostics = results.flatMap((result) => result.diagnostics)
    return {
        errors: diagnostics.filter((diagnostic) => diagnostic.severity === 'error').length,
        warnings: diagnostics.filter((diagnostic) => diagnostic.severity === 'warning').length
    }
}

export default async function runLint(specifiedSourcePaths: string[] = [], options: LintOptions = {}) {
    const cwd = path.resolve(options.cwd || process.cwd())
    const sourcePatterns = normalizeSourcePatterns(specifiedSourcePaths)
    const manifestResult = await loadProjectManifest(cwd)
    const css = createCSSWithNativeDeclarations(manifestResult.manifest)
    const sourcePaths = resolveSourcePaths(cwd, sourcePatterns, specifiedSourcePaths.length ? [] : DEFAULT_IGNORE_PATTERNS)

    if (options.fix) {
        for (const source of sourcePaths) {
            const filePath = path.resolve(cwd, source)
            const content = fs.readFileSync(filePath, 'utf8')
            const fixed = fixContent(content, filePath, css)
            if (fixed !== content) fs.writeFileSync(filePath, fixed)
        }
    }

    const results = sourcePaths.map((source) => {
        const filePath = path.resolve(cwd, source)
        return lintContent(fs.readFileSync(filePath, 'utf8'), filePath, css)
    }).filter((result) => result.diagnostics.length)

    if (options.format === 'json') {
        console.log(JSON.stringify(results, null, 2))
    } else {
        const output = formatStylish(results)
        if (output) process.stdout.write(output)
    }

    const { errors, warnings } = countDiagnostics(results)
    if (errors || warnings > parseMaxWarnings(options.maxWarnings)) {
        process.exitCode = 1
    }
    return results
}
