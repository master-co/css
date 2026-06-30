import { createCSSWithNativeDeclarations } from '@master/css-validator'
import {
    collectCSSDirectiveRanges,
    type CSSDirectiveRuleRange,
    type SourceRange
} from '@master/css-lexer'
import {
    createCanonicalComposeDirectiveReport,
    createClassListLintReport,
    createConflictingClassesReport,
    createInvalidClassesReport,
    createSortClassesReport,
    createUnapprovedRawValueClassesReport,
    type MasterCSSLintDiagnostic,
    type MasterCSSLintFix,
    type MasterCSSLintRuleId
} from '@master/css-lint'
import { getClassPositions, languageSettings } from '@master/css-language'
import { loadProjectManifest } from '@master/css-project/manifest'
import fg from 'fast-glob'
import fs from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

const REPORT_VERSION = 1
const DEFAULT_SOURCE_PATTERNS = ['**/*.{html,htm,js,jsx,cjs,ts,tsx,mts,cts,svelte,astro,vue,md,mdx,pug,php,css,scss,less}']
const DEFAULT_IGNORE_PATTERNS = ['**/node_modules/**', 'node_modules']
const MAX_FIX_PASSES = 10

const ruleIds: MasterCSSLintRuleId[] = [
    'sort-classes',
    'no-invalid-classes',
    'no-conflicting-classes',
    'prefer-canonical-classes',
    'no-unapproved-raw-values'
]

const defaultRules: Record<MasterCSSLintRuleId, boolean> = {
    'sort-classes': true,
    'no-invalid-classes': true,
    'no-conflicting-classes': true,
    'prefer-canonical-classes': true,
    'no-unapproved-raw-values': false
}

export interface LintOptions {
    fix?: boolean
    fixDryRun?: boolean
    fixDirectives?: boolean
    format?: 'stylish' | 'json'
    maxWarnings?: string | number
    cwd?: string
    stdin?: boolean
    stdinFilepath?: string
    exitCode?: 'diagnostics' | 'never'
    rules?: string
}

interface SourceLocation {
    line: number
    column: number
}

interface SourceLocationRange {
    start: SourceLocation
    end: SourceLocation
}

type CLIDiagnosticSeverity = 'error' | 'warning'
type CLIFileSourceKind = 'source' | 'stylesheet' | 'manifest'
type CLIDiagnosticSourceKind = 'class-attribute' | 'class-expression' | 'compose-directive' | 'manifest'
type CLIFixKind = 'class-list' | 'directive'
type CLIFixSafety = 'safe' | 'structural'

interface CLILintFix {
    kind: CLIFixKind
    safety: CLIFixSafety
    range: SourceRange
    text: string
    description: string
    requiresFormatting: boolean
}

interface CLILintDiagnostic {
    ruleId?: MasterCSSLintRuleId | 'manifest'
    code: string
    severity: CLIDiagnosticSeverity
    message: string
    range: SourceRange
    loc: SourceLocationRange
    source: 'Master CSS'
    sourceKind: CLIDiagnosticSourceKind
    data?: MasterCSSLintDiagnostic['data']
    fixes?: CLILintFix[]
}

interface CLILintFileResult {
    filePath: string
    languageId: string
    sourceKind: CLIFileSourceKind
    diagnostics: CLILintDiagnostic[]
}

interface CLILintReport {
    version: typeof REPORT_VERSION
    cwd: string
    manifest: {
        status: 'loaded' | 'error'
        entries: string[]
        diagnostics: CLILintDiagnostic[]
    }
    files: CLILintFileResult[]
    summary: {
        files: number
        diagnostics: number
        errors: number
        warnings: number
        fixable: number
        safeFixes: number
        structuralFixes: number
    }
}

interface ClassListContext {
    range: SourceRange
    text: string
    sourceKind: Exclude<CLIDiagnosticSourceKind, 'manifest'>
    unescape?: string | false
    directive?: CSSDirectiveRuleRange
}

interface TextDocumentLike {
    uri: string
    languageId: string
    version: number
    getText(): string
}

interface SourceInput {
    filePath: string
    content: string
    stdin?: boolean
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

const stylesheetLanguageIds = new Set(['css', 'scss', 'less'])

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

function getFileSourceKind(languageId: string): CLIFileSourceKind {
    return stylesheetLanguageIds.has(languageId) ? 'stylesheet' : 'source'
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

function findComposeDirective(directives: CSSDirectiveRuleRange[], range: SourceRange) {
    return directives.find((directive) => {
        if (directive.name !== 'compose') return false
        if (directive.blockRange || directive.quotedStringRanges.length) return false
        return range.start >= directive.preludeRange.start && range.end <= directive.preludeRange.end
    })
}

function inferClassSourceKind(content: string, range: SourceRange): Exclude<CLIDiagnosticSourceKind, 'compose-directive' | 'manifest'> {
    const prefix = content.slice(Math.max(0, range.start - 80), range.start)
    return /(?:^|[\s{<])(?:class|className|class:list|:class|v-bind:class|\[class\]|\[className\]|\[ngClass\])\s*=\s*(?:"|'|`|\{[^]*$)/.test(prefix)
        ? 'class-attribute'
        : 'class-expression'
}

function collectClassListContexts(content: string, filePath: string): ClassListContext[] {
    const textDocument = createTextDocument(filePath, content)
    const positions = getClassPositions(textDocument as any, languageSettings)
    const contexts = new Map<string, ClassListContext>()
    const directives = collectCSSDirectiveRanges(content)
    for (const position of positions) {
        const contextRange = position.contextRange
        const key = `${contextRange.start}:${contextRange.end}`
        if (contexts.has(key)) continue
        const directive = findComposeDirective(directives, contextRange)
        contexts.set(key, {
            range: contextRange,
            text: content.slice(contextRange.start, contextRange.end),
            sourceKind: directive ? 'compose-directive' : inferClassSourceKind(content, contextRange),
            unescape: detectClassListUnescape(content, contextRange),
            ...(directive ? { directive } : {})
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

function toLocationRange(content: string, range: SourceRange): SourceLocationRange {
    return {
        start: offsetToLocation(content, range.start),
        end: offsetToLocation(content, range.end)
    }
}

function resolveRules(option: string | undefined): Record<MasterCSSLintRuleId, boolean> {
    if (!option) return { ...defaultRules }
    const resolved = Object.fromEntries(ruleIds.map((ruleId) => [ruleId, false])) as Record<MasterCSSLintRuleId, boolean>
    for (const rule of option.split(',').map((rule) => rule.trim()).filter(Boolean)) {
        if (rule === 'recommended') {
            Object.assign(resolved, defaultRules)
            continue
        }
        if (rule === 'all') {
            for (const ruleId of ruleIds) resolved[ruleId] = true
            continue
        }
        if (!ruleIds.includes(rule as MasterCSSLintRuleId)) {
            throw new Error(`Unknown Master CSS lint rule "${rule}".`)
        }
        resolved[rule as MasterCSSLintRuleId] = true
    }
    return resolved
}

function createComposeDirectiveLintDiagnostics(
    context: ClassListContext,
    css: ReturnType<typeof createCSSWithNativeDeclarations>,
    rules: Record<MasterCSSLintRuleId, boolean>
) {
    return [
        rules['sort-classes'] && createSortClassesReport(context.text, css, { unescape: context.unescape }),
        rules['no-invalid-classes'] && createInvalidClassesReport(context.text, css, { unescape: context.unescape }),
        rules['no-conflicting-classes'] && createConflictingClassesReport(context.text, css, { unescape: context.unescape }),
        rules['prefer-canonical-classes'] && createCanonicalComposeDirectiveReport(context.text, css, { unescape: context.unescape }),
        rules['no-unapproved-raw-values'] && createUnapprovedRawValueClassesReport(context.text, css, { unescape: context.unescape })
    ].filter((report): report is { diagnostics: MasterCSSLintDiagnostic[] } => Boolean(report))
        .flatMap((report) => report.diagnostics)
}

function createContextLintDiagnostics(
    context: ClassListContext,
    css: ReturnType<typeof createCSSWithNativeDeclarations>,
    rules: Record<MasterCSSLintRuleId, boolean>
) {
    return context.sourceKind === 'compose-directive'
        ? createComposeDirectiveLintDiagnostics(context, css, rules)
        : createClassListLintReport(context.text, css, {
            unescape: context.unescape,
            rules
        }).diagnostics
}

function toCLIFix(context: ClassListContext, fix: MasterCSSLintFix): CLILintFix | undefined {
    if (fix.scope === 'directive') {
        if (!context.directive) return
        return {
            kind: 'directive',
            safety: 'structural',
            range: {
                start: context.directive.start,
                end: context.directive.end
            },
            text: fix.text,
            description: 'Apply structural @compose rewrite.',
            requiresFormatting: true
        }
    }
    return {
        kind: 'class-list',
        safety: 'safe',
        range: {
            start: context.range.start + fix.range.start,
            end: context.range.start + fix.range.end
        },
        text: fix.text,
        description: 'Replace the class list text.',
        requiresFormatting: false
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
    const fix = diagnostic.fix && toCLIFix(context, diagnostic.fix)

    return {
        ruleId: diagnostic.ruleId,
        code: diagnostic.code,
        severity: diagnostic.severity,
        message: diagnostic.message,
        range,
        loc: toLocationRange(content, range),
        source: 'Master CSS',
        sourceKind: context.sourceKind,
        ...(diagnostic.data ? { data: diagnostic.data } : {}),
        ...(fix ? { fixes: [fix] } : {})
    }
}

function lintContent(
    content: string,
    filePath: string,
    css: ReturnType<typeof createCSSWithNativeDeclarations>,
    rules: Record<MasterCSSLintRuleId, boolean>
): CLILintFileResult {
    const diagnostics: CLILintDiagnostic[] = []
    for (const context of collectClassListContexts(content, filePath)) {
        diagnostics.push(...createContextLintDiagnostics(context, css, rules).map((diagnostic) => toCLIDiagnostic(content, context, diagnostic)))
    }
    const languageId = getLanguageId(filePath)
    return {
        filePath,
        languageId,
        sourceKind: getFileSourceKind(languageId),
        diagnostics
    }
}

function applyReplacement(content: string, range: SourceRange, text: string) {
    return content.slice(0, range.start) + text + content.slice(range.end)
}

function uniqueFixes(fixes: CLILintFix[]) {
    const seen = new Set<string>()
    return fixes.filter((fix) => {
        const key = `${fix.kind}:${fix.range.start}:${fix.range.end}:${fix.text}`
        if (seen.has(key)) return false
        seen.add(key)
        return true
    })
}

function collectStructuralFixes(file: CLILintFileResult) {
    return uniqueFixes(file.diagnostics.flatMap((diagnostic) => diagnostic.fixes ?? []))
        .filter((fix) => fix.kind === 'directive')
        .sort((a, b) => b.range.start - a.range.start || b.range.end - a.range.end)
}

function applyFixes(content: string, fixes: CLILintFix[]) {
    let fixed = content
    for (const fix of fixes) {
        fixed = applyReplacement(fixed, fix.range, fix.text)
    }
    return fixed
}

function parseMaxWarnings(value: string | number | undefined) {
    if (value === undefined) return Number.POSITIVE_INFINITY
    const maxWarnings = Number(value)
    return Number.isFinite(maxWarnings) && maxWarnings >= 0 ? maxWarnings : 0
}

function createManifestDiagnostic(cwd: string, error: unknown): CLILintDiagnostic {
    const range = { start: 0, end: 0 }
    return {
        ruleId: 'manifest',
        code: 'manifest-loading-error',
        severity: 'error',
        message: `Failed to load Master CSS manifest: ${error instanceof Error ? error.message : String(error)}`,
        range,
        loc: {
            start: { line: 1, column: 1 },
            end: { line: 1, column: 1 }
        },
        source: 'Master CSS',
        sourceKind: 'manifest',
        data: {
            cwd
        }
    }
}

function createManifestFileResult(cwd: string, diagnostics: CLILintDiagnostic[]): CLILintFileResult {
    return {
        filePath: cwd,
        languageId: 'manifest',
        sourceKind: 'manifest',
        diagnostics
    }
}

function countDiagnostics(files: CLILintFileResult[]) {
    const diagnostics = files.flatMap((file) => file.diagnostics)
    const fixes = diagnostics.flatMap((diagnostic) => diagnostic.fixes ?? [])
    return {
        files: files.length,
        diagnostics: diagnostics.length,
        errors: diagnostics.filter((diagnostic) => diagnostic.severity === 'error').length,
        warnings: diagnostics.filter((diagnostic) => diagnostic.severity === 'warning').length,
        fixable: diagnostics.filter((diagnostic) => diagnostic.fixes?.length).length,
        safeFixes: fixes.filter((fix) => fix.safety === 'safe').length,
        structuralFixes: fixes.filter((fix) => fix.safety === 'structural').length
    }
}

function createReport(cwd: string, manifest: CLILintReport['manifest'], files: CLILintFileResult[]): CLILintReport {
    return {
        version: REPORT_VERSION,
        cwd,
        manifest,
        files,
        summary: countDiagnostics(files)
    }
}

function formatStylish(report: CLILintReport) {
    const lines: string[] = []
    for (const result of report.files) {
        if (!result.diagnostics.length) continue
        lines.push(result.filePath)
        for (const diagnostic of result.diagnostics) {
            lines.push(`  ${diagnostic.loc.start.line}:${diagnostic.loc.start.column}  ${diagnostic.severity}  ${diagnostic.message}  ${diagnostic.ruleId ? `@master/css/${diagnostic.ruleId}` : diagnostic.code}`)
        }
    }
    return lines.length ? `${lines.join('\n')}\n` : ''
}

function outputReport(report: CLILintReport, format: 'stylish' | 'json') {
    if (format === 'stylish') {
        const output = formatStylish(report)
        if (output) process.stdout.write(output)
    } else {
        console.log(JSON.stringify(report, null, 2))
    }
}

function resolveSourceInputs(cwd: string, specifiedSourcePaths: string[], options: LintOptions): SourceInput[] {
    if (options.stdin) {
        const filePath = path.resolve(cwd, options.stdinFilepath || 'stdin.html')
        return [{
            filePath,
            content: fs.readFileSync(0, 'utf8'),
            stdin: true
        }]
    }
    const sourcePatterns = normalizeSourcePatterns(specifiedSourcePaths)
    return resolveSourcePaths(cwd, sourcePatterns, specifiedSourcePaths.length ? [] : DEFAULT_IGNORE_PATTERNS).map((source) => {
        const filePath = path.resolve(cwd, source)
        return {
            filePath,
            content: fs.readFileSync(filePath, 'utf8')
        }
    })
}

function lintInputs(
    inputs: SourceInput[],
    css: ReturnType<typeof createCSSWithNativeDeclarations>,
    rules: Record<MasterCSSLintRuleId, boolean>
) {
    return inputs.map((input) => lintContent(input.content, input.filePath, css, rules))
        .filter((result) => result.diagnostics.length)
}

function fixClassListText(
    context: ClassListContext,
    css: ReturnType<typeof createCSSWithNativeDeclarations>,
    rules: Record<MasterCSSLintRuleId, boolean>
) {
    let fixed = context.text
    for (let pass = 0; pass < MAX_FIX_PASSES; pass++) {
        const nextContext: ClassListContext = {
            ...context,
            range: { start: 0, end: fixed.length },
            text: fixed
        }
        const fix = createContextLintDiagnostics(nextContext, css, rules)
            .map((diagnostic) => diagnostic.fix)
            .find((fix): fix is MasterCSSLintFix => Boolean(fix && fix.scope !== 'directive'))
        if (!fix) return fixed
        const next = applyReplacement(fixed, fix.range, fix.text)
        if (next === fixed) return fixed
        fixed = next
    }
    return fixed
}

function fixSafeClassLists(
    content: string,
    filePath: string,
    css: ReturnType<typeof createCSSWithNativeDeclarations>,
    rules: Record<MasterCSSLintRuleId, boolean>
) {
    const replacements = collectClassListContexts(content, filePath)
        .map((context) => ({
            range: context.range,
            text: fixClassListText(context, css, rules)
        }))
        .filter((replacement) => content.slice(replacement.range.start, replacement.range.end) !== replacement.text)
        .sort((a, b) => b.range.start - a.range.start || b.range.end - a.range.end)

    return applyFixes(content, replacements.map((replacement) => ({
        kind: 'class-list',
        safety: 'safe',
        range: replacement.range,
        text: replacement.text,
        description: 'Replace the class list text.',
        requiresFormatting: false
    })))
}

function fixContent(
    content: string,
    filePath: string,
    css: ReturnType<typeof createCSSWithNativeDeclarations>,
    rules: Record<MasterCSSLintRuleId, boolean>,
    includeDirectiveFixes: boolean
) {
    let fixed = fixSafeClassLists(content, filePath, css, rules)
    if (!includeDirectiveFixes) return fixed
    const structuralFixes = collectStructuralFixes(lintContent(fixed, filePath, css, rules))
    if (structuralFixes.length) fixed = applyFixes(fixed, structuralFixes)
    return fixed
}

function applyFileFixes(
    inputs: SourceInput[],
    css: ReturnType<typeof createCSSWithNativeDeclarations>,
    rules: Record<MasterCSSLintRuleId, boolean>,
    includeDirectiveFixes: boolean
) {
    for (const input of inputs) {
        if (input.stdin) continue
        const fixed = fixContent(input.content, input.filePath, css, rules, includeDirectiveFixes)
        if (fixed !== input.content) {
            fs.writeFileSync(input.filePath, fixed)
            input.content = fixed
        }
    }
}

export default async function runLint(specifiedSourcePaths: string[] = [], options: LintOptions = {}) {
    const cwd = path.resolve(options.cwd || process.cwd())
    const format = options.format || 'json'
    const exitCode = options.exitCode || 'diagnostics'
    const rules = resolveRules(options.rules)
    const inputs = resolveSourceInputs(cwd, specifiedSourcePaths, options)
    let manifest: CLILintReport['manifest']
    let files: CLILintFileResult[]

    try {
        const manifestResult = await loadProjectManifest(cwd)
        const css = createCSSWithNativeDeclarations(manifestResult.manifest)
        manifest = {
            status: 'loaded',
            entries: manifestResult.entries,
            diagnostics: []
        }
        files = lintInputs(inputs, css, rules)
        if (options.fix && !options.fixDryRun) {
            applyFileFixes(inputs, css, rules, Boolean(options.fixDirectives))
            files = lintInputs(inputs, css, rules)
        }
    } catch (error) {
        const diagnostic = createManifestDiagnostic(cwd, error)
        manifest = {
            status: 'error',
            entries: [],
            diagnostics: [diagnostic]
        }
        files = [createManifestFileResult(cwd, [diagnostic])]
    }

    const report = createReport(cwd, manifest, files)
    outputReport(report, format)

    if (exitCode !== 'never' && (report.summary.errors || report.summary.warnings > parseMaxWarnings(options.maxWarnings))) {
        process.exitCode = 1
    }
    return report
}
