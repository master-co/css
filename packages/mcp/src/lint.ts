import { createRequire } from 'node:module'
import { extname } from 'node:path'
import { pathToFileURL } from 'node:url'
import { readFile } from 'node:fs/promises'
import { TextDocument } from 'vscode-languageserver-textdocument'
import {
    collectCSSDirectiveRanges,
    parseMasterCSSClassList,
    type CSSDirectiveRuleRange,
    type MasterCSSClassListItem,
    type SourceRange
} from '@master/css-lexer'
import { getClassPositions, languageSettings } from '@master/css-language'
import { createCSSWithNativeDeclarations } from '@master/css-validator/native-declaration'
import {
    defaultCanonicalClassNameOptions,
    findClassConflicts,
    findPartialClassConflicts,
    findUnapprovedRawValueClasses,
    getClassValidationIssues,
    removeClassNamesFromClassList,
    replaceClassGroupInClassList,
    replaceClassNameInClassList,
    sortClassList,
    suggestCanonicalClassGroups,
    suggestCanonicalClassName,
    suggestCanonicalComposeDirective
} from '@master/css-lint'
import type { MasterCSSManifest } from '@master/css-engine'
import type MasterCSSMCPContext from './context'
import { resolveSourceFiles } from './scan'
import { loadWorkspaceManifest } from './project'

const require = createRequire(import.meta.url)
const defaultManifest = require('@master/css-preset/default-manifest.json') as MasterCSSManifest
const MAX_FIX_PASSES = 10
const DEFAULT_LINT_SOURCE_PATTERNS = ['**/*.{html,htm,js,jsx,cjs,ts,tsx,mts,cts,svelte,astro,vue,md,mdx,pug,php,css,scss,less}']
const DEFAULT_IGNORE_PATTERNS = ['**/node_modules/**', 'node_modules']

type DiagnosticSeverity = 'error' | 'warning'
type FileSourceKind = 'source' | 'stylesheet' | 'manifest'
type DiagnosticSourceKind = 'class-attribute' | 'class-expression' | 'compose-directive' | 'manifest'
type FixKind = 'class-list' | 'directive'
type FixSafety = 'safe' | 'structural'
type CSSWithNativeDeclarations = ReturnType<typeof createCSSWithNativeDeclarations>
type MasterCSSLintRuleId =
    | 'sort-classes'
    | 'no-invalid-classes'
    | 'no-conflicting-classes'
    | 'prefer-canonical-classes'
    | 'no-unapproved-raw-values'

type MasterCSSLintDiagnosticData = Record<string, string | number | boolean | string[] | null | undefined>

interface MasterCSSLintFix {
    range: SourceRange
    text: string
    scope?: 'class-list' | 'directive'
}

interface MasterCSSLintDiagnostic {
    ruleId: MasterCSSLintRuleId
    code: string
    message: string
    severity: DiagnosticSeverity
    range: SourceRange
    data?: MasterCSSLintDiagnosticData
    fix?: MasterCSSLintFix
}

export interface LintProjectOptions {
    patterns?: string[]
    rules?: string
}

export interface PreviewFixesOptions extends LintProjectOptions {
    includeDirectiveFixes?: boolean
    ttlMs?: number
}

interface SourceLocation {
    line: number
    column: number
}

interface SourceLocationRange {
    start: SourceLocation
    end: SourceLocation
}

interface LintFix {
    kind: FixKind
    safety: FixSafety
    range: SourceRange
    text: string
    description: string
    requiresFormatting: boolean
}

interface LintDiagnostic {
    ruleId?: MasterCSSLintRuleId | 'manifest'
    code: string
    severity: DiagnosticSeverity
    message: string
    range: SourceRange
    loc: SourceLocationRange
    source: 'Master CSS'
    sourceKind: DiagnosticSourceKind
    data?: MasterCSSLintDiagnostic['data']
    fixes?: LintFix[]
}

interface LintFileResult {
    filePath: string
    languageId: string
    sourceKind: FileSourceKind
    diagnostics: LintDiagnostic[]
}

interface ClassListContext {
    range: SourceRange
    text: string
    sourceKind: Exclude<DiagnosticSourceKind, 'manifest'>
    unescape?: string | false
    directive?: CSSDirectiveRuleRange
}

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

const languageByExtension: Record<string, string> = {
    '.astro': 'astro',
    '.css': 'css',
    '.htm': 'html',
    '.html': 'html',
    '.js': 'javascript',
    '.jsx': 'javascriptreact',
    '.less': 'less',
    '.md': 'markdown',
    '.mdx': 'mdx',
    '.php': 'html',
    '.pug': 'html',
    '.scss': 'scss',
    '.svelte': 'svelte',
    '.ts': 'typescript',
    '.tsx': 'typescriptreact',
    '.vue': 'vue'
}

const stylesheetLanguageIds = new Set(['css', 'scss', 'less'])

function getLanguageId(filePath: string) {
    return languageByExtension[extname(filePath).toLowerCase()] || 'html'
}

function getFileSourceKind(languageId: string): FileSourceKind {
    return stylesheetLanguageIds.has(languageId) ? 'stylesheet' : 'source'
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

function inferClassSourceKind(content: string, range: SourceRange): Exclude<DiagnosticSourceKind, 'compose-directive' | 'manifest'> {
    const prefix = content.slice(Math.max(0, range.start - 80), range.start)
    return /(?:^|[\s{<])(?:class|className|class:list|:class|v-bind:class|\[class\]|\[className\]|\[ngClass\])\s*=\s*(?:"|'|`|\{[^]*$)/.test(prefix)
        ? 'class-attribute'
        : 'class-expression'
}

function collectClassListContexts(content: string, filePath: string): ClassListContext[] {
    const document = TextDocument.create(pathToFileURL(filePath).href, getLanguageId(filePath), 0, content)
    const positions = getClassPositions(document, languageSettings)
    const contexts = new Map<string, ClassListContext>()
    const directives = collectCSSDirectiveRanges(content)
    for (const position of positions) {
        const range = position.contextRange
        const key = `${range.start}:${range.end}`
        if (contexts.has(key)) continue
        const directive = findComposeDirective(directives, range)
        contexts.set(key, {
            range,
            text: content.slice(range.start, range.end),
            sourceKind: directive ? 'compose-directive' : inferClassSourceKind(content, range),
            unescape: detectClassListUnescape(content, range),
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
    for (const rule of option.split(',').map((item) => item.trim()).filter(Boolean)) {
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

function createReport(diagnostics: MasterCSSLintDiagnostic[] = []) {
    return { diagnostics }
}

function wholeClassListRange(classList: string): SourceRange {
    return { start: 0, end: classList.length }
}

function wholeClassListFix(classList: string, text: string): MasterCSSLintFix | undefined {
    return classList === text ? undefined : { range: wholeClassListRange(classList), text, scope: 'class-list' }
}

function parseClassList(classList: string, options: { unescape?: string | false } = {}) {
    return parseMasterCSSClassList(classList, {
        preserveSpaces: true,
        ...options
    })
}

function classItems(items: MasterCSSClassListItem[]) {
    return items.filter((item) => item.type === 'class')
}

function classValues(items: MasterCSSClassListItem[]) {
    return classItems(items).map((item) => item.token)
}

function findClassItem(items: MasterCSSClassListItem[], className: string) {
    return classItems(items).find((item) => item.token === className)
}

function toRange(item: MasterCSSClassListItem | undefined, fallback: SourceRange): SourceRange {
    return item ? { start: item.start, end: item.end } : fallback
}

function createClassItemQueues(items: MasterCSSClassListItem[]) {
    const queues = new Map<string, MasterCSSClassListItem[]>()
    for (const item of classItems(items)) {
        const queue = queues.get(item.token)
        if (queue) {
            queue.push(item)
        } else {
            queues.set(item.token, [item])
        }
    }
    return queues
}

function formatClassName(className: string) {
    return `"${className}"`
}

function formatClassList(classNames: string[]) {
    if (classNames.length <= 2) return classNames.map(formatClassName).join(' and ')
    return `${classNames.slice(0, -1).map(formatClassName).join(', ')}, and ${formatClassName(classNames[classNames.length - 1])}`
}

function createSortClassesReport(classList: string, css: CSSWithNativeDeclarations, options: { unescape?: string | false } = {}) {
    const items = parseClassList(classList, options)
    if (classItems(items).length <= 1) return createReport()
    const fixedText = sortClassList(classList, css, options)
    const fix = wholeClassListFix(classList, fixedText)
    if (!fix) return createReport()
    return createReport([{
        ruleId: 'sort-classes',
        code: 'invalid-class-order',
        message: 'No consistent class order followed.',
        severity: 'warning',
        range: wholeClassListRange(classList),
        fix
    }])
}

function createInvalidClassesReport(classList: string, css: CSSWithNativeDeclarations, options: { unescape?: string | false } = {}) {
    const diagnostics: MasterCSSLintDiagnostic[] = []
    for (const item of classItems(parseClassList(classList, options))) {
        for (const issue of getClassValidationIssues(item.token, css, { displayClassName: item.raw })) {
            diagnostics.push({
                ruleId: 'no-invalid-classes',
                code: issue.kind === 'invalid' ? 'invalid-class' : 'unknown-class',
                message: issue.message,
                severity: 'error',
                range: { start: item.start, end: item.end },
                data: {
                    className: issue.className,
                    kind: issue.kind,
                    message: issue.message
                }
            })
        }
    }
    return createReport(diagnostics)
}

function createConflictingClassesReport(classList: string, css: CSSWithNativeDeclarations, options: { unescape?: string | false } = {}) {
    const items = parseClassList(classList, options)
    const values = classValues(items)
    const fallbackRange = wholeClassListRange(classList)
    const conflicts = findClassConflicts(values, css)
    if (conflicts.length) {
        const classNamesToRemove = conflicts.map(({ className }) => className)
        const keptClassNames = [...new Set(conflicts.flatMap(({ conflicts }) => conflicts))]
        const fixedText = removeClassNamesFromClassList(classList, classNamesToRemove, options)
        return createReport([{
            ruleId: 'no-conflicting-classes',
            code: 'conflicting-class',
            message: `${formatClassList(classNamesToRemove)} ${classNamesToRemove.length === 1 ? 'is' : 'are'} overridden by ${formatClassList(keptClassNames)}.`,
            severity: 'warning',
            range: toRange(findClassItem(items, classNamesToRemove[0]), fallbackRange),
            data: {
                classNames: classNamesToRemove,
                conflicts: keptClassNames
            },
            fix: wholeClassListFix(classList, fixedText)
        }])
    }
    const partialConflicts = findPartialClassConflicts(values, css)
    if (!partialConflicts.length) return createReport()
    let fixedText = classList
    for (const conflict of partialConflicts) {
        fixedText = replaceClassNameInClassList(fixedText, conflict.className, conflict.replacement, options)
    }
    const queues = createClassItemQueues(items)
    return createReport(partialConflicts.map((conflict) => ({
        ruleId: 'no-conflicting-classes',
        code: 'partially-conflicting-class',
        message: `Prefer "${conflict.replacement}" over "${conflict.className}" because "${conflict.conflict}" overrides part of it.`,
        severity: 'warning',
        range: toRange(queues.get(conflict.className)?.shift(), fallbackRange),
        data: {
            actual: conflict.className,
            replacement: conflict.replacement,
            conflict: conflict.conflict
        },
        fix: wholeClassListFix(classList, fixedText)
    })))
}

function createCanonicalClassesReport(classList: string, css: CSSWithNativeDeclarations, options: { unescape?: string | false } = {}) {
    const items = parseClassList(classList, options)
    const values = classValues(items)
    const fallbackRange = wholeClassListRange(classList)
    const groupSuggestions = suggestCanonicalClassGroups(values, css, defaultCanonicalClassNameOptions)
    const coveredClassNames = new Set(groupSuggestions.flatMap((suggestion) => suggestion.classNames))
    const diagnostics: MasterCSSLintDiagnostic[] = []
    let fixedText = classList
    for (const suggestion of groupSuggestions) {
        fixedText = replaceClassGroupInClassList(fixedText, suggestion.classNames, suggestion.recommended, options)
        diagnostics.push({
            ruleId: 'prefer-canonical-classes',
            code: 'prefer-canonical-class',
            message: `Prefer "${suggestion.recommended}" over "${suggestion.classNames.join(' ')}".`,
            severity: 'warning',
            range: toRange(findClassItem(items, suggestion.classNames[0]), fallbackRange),
            data: {
                actual: suggestion.classNames.join(' '),
                recommended: suggestion.recommended
            }
        })
    }
    for (const item of classItems(items)) {
        if (coveredClassNames.has(item.token)) continue
        const recommended = suggestCanonicalClassName(item.token, css, defaultCanonicalClassNameOptions)
        if (!recommended) continue
        fixedText = replaceClassNameInClassList(fixedText, item.token, recommended, options)
        diagnostics.push({
            ruleId: 'prefer-canonical-classes',
            code: 'prefer-canonical-class',
            message: `Prefer "${recommended}" over "${item.token}".`,
            severity: 'warning',
            range: { start: item.start, end: item.end },
            data: {
                actual: item.token,
                recommended
            }
        })
    }
    const fix = wholeClassListFix(classList, fixedText)
    for (const diagnostic of diagnostics) diagnostic.fix = fix
    return createReport(diagnostics)
}

function createCanonicalComposeDirectiveReport(classList: string, css: CSSWithNativeDeclarations, options: { unescape?: string | false } = {}) {
    const result = suggestCanonicalComposeDirective(classList, css, {
        ...defaultCanonicalClassNameOptions,
        ...options
    })
    if (!result) return createReport()
    if (!result.structuralChange) return createCanonicalClassesReport(classList, css, options)
    const items = parseClassList(classList, options)
    const fallbackRange = wholeClassListRange(classList)
    const fix = result.replacement
        ? { range: wholeClassListRange(classList), text: result.replacement, scope: 'directive' as const }
        : undefined
    return createReport(result.suggestions.map((suggestion) => ({
        ruleId: 'prefer-canonical-classes',
        code: suggestion.kind === 'class' ? 'prefer-canonical-class' : `prefer-${suggestion.kind}`,
        message: `Prefer "${suggestion.recommended}" over "${suggestion.actual}".`,
        severity: 'warning',
        range: toRange(findClassItem(items, suggestion.classNames[0]) || classItems(items)[0], fallbackRange),
        data: {
            actual: suggestion.actual,
            recommended: suggestion.recommended,
            kind: suggestion.kind
        },
        fix
    })))
}

function createUnapprovedRawValueClassesReport(classList: string, css: CSSWithNativeDeclarations, options: { unescape?: string | false } = {}) {
    const items = parseClassList(classList, options)
    const issues = findUnapprovedRawValueClasses(classValues(items), css)
    const diagnostics: MasterCSSLintDiagnostic[] = []
    for (const issue of issues) {
        const item = findClassItem(items, issue.className)
        if (!item) continue
        diagnostics.push({
            ruleId: 'no-unapproved-raw-values',
            code: 'unapproved-raw-value',
            message: `Unexpected raw value "${issue.value}" in "${issue.className}". Use a token or allow it explicitly.`,
            severity: 'warning',
            range: { start: item.start, end: item.end },
            data: {
                className: issue.className,
                value: issue.value,
                key: issue.key,
                properties: issue.properties
            }
        })
    }
    return createReport(diagnostics)
}

function createClassListReport(classList: string, css: CSSWithNativeDeclarations, options: { unescape?: string | false, rules: Record<MasterCSSLintRuleId, boolean> }) {
    return createReport([
        options.rules['sort-classes'] && createSortClassesReport(classList, css, options),
        options.rules['no-invalid-classes'] && createInvalidClassesReport(classList, css, options),
        options.rules['no-conflicting-classes'] && createConflictingClassesReport(classList, css, options),
        options.rules['prefer-canonical-classes'] && createCanonicalClassesReport(classList, css, options),
        options.rules['no-unapproved-raw-values'] && createUnapprovedRawValueClassesReport(classList, css, options)
    ].filter((report): report is { diagnostics: MasterCSSLintDiagnostic[] } => Boolean(report))
        .flatMap((report) => report.diagnostics))
}

function createComposeDirectiveDiagnostics(
    context: ClassListContext,
    css: CSSWithNativeDeclarations,
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

function createContextDiagnostics(
    context: ClassListContext,
    css: CSSWithNativeDeclarations,
    rules: Record<MasterCSSLintRuleId, boolean>
) {
    return context.sourceKind === 'compose-directive'
        ? createComposeDirectiveDiagnostics(context, css, rules)
        : createClassListReport(context.text, css, { unescape: context.unescape, rules }).diagnostics
}

function toLintFix(context: ClassListContext, fix: MasterCSSLintFix): LintFix | undefined {
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

function toLintDiagnostic(content: string, context: ClassListContext, diagnostic: MasterCSSLintDiagnostic): LintDiagnostic {
    const range = {
        start: context.range.start + diagnostic.range.start,
        end: context.range.start + diagnostic.range.end
    }
    const fix = diagnostic.fix && toLintFix(context, diagnostic.fix)
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

function lintContent(content: string, filePath: string, css: CSSWithNativeDeclarations, rules: Record<MasterCSSLintRuleId, boolean>): LintFileResult {
    const diagnostics: LintDiagnostic[] = []
    for (const context of collectClassListContexts(content, filePath)) {
        diagnostics.push(...createContextDiagnostics(context, css, rules).map((diagnostic) => toLintDiagnostic(content, context, diagnostic)))
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

function fixClassListText(context: ClassListContext, css: CSSWithNativeDeclarations, rules: Record<MasterCSSLintRuleId, boolean>) {
    let fixed = context.text
    for (let pass = 0; pass < MAX_FIX_PASSES; pass++) {
        const nextContext: ClassListContext = {
            ...context,
            range: { start: 0, end: fixed.length },
            text: fixed
        }
        const fix = createContextDiagnostics(nextContext, css, rules)
            .map((diagnostic) => diagnostic.fix)
            .find((fix): fix is MasterCSSLintFix => Boolean(fix && fix.scope !== 'directive'))
        if (!fix) return fixed
        const next = applyReplacement(fixed, fix.range, fix.text)
        if (next === fixed) return fixed
        fixed = next
    }
    return fixed
}

function applyFixes(content: string, fixes: LintFix[]) {
    let fixed = content
    for (const fix of fixes) {
        fixed = applyReplacement(fixed, fix.range, fix.text)
    }
    return fixed
}

function uniqueFixes(fixes: LintFix[]) {
    const seen = new Set<string>()
    return fixes.filter((fix) => {
        const key = `${fix.kind}:${fix.range.start}:${fix.range.end}:${fix.text}`
        if (seen.has(key)) return false
        seen.add(key)
        return true
    })
}

function collectStructuralFixes(file: LintFileResult) {
    return uniqueFixes(file.diagnostics.flatMap((diagnostic) => diagnostic.fixes ?? []))
        .filter((fix) => fix.kind === 'directive')
        .sort((a, b) => b.range.start - a.range.start || b.range.end - a.range.end)
}

function fixSafeClassLists(content: string, filePath: string, css: CSSWithNativeDeclarations, rules: Record<MasterCSSLintRuleId, boolean>) {
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
    css: CSSWithNativeDeclarations,
    rules: Record<MasterCSSLintRuleId, boolean>,
    includeDirectiveFixes: boolean
) {
    let fixed = fixSafeClassLists(content, filePath, css, rules)
    if (!includeDirectiveFixes) return fixed
    const structuralFixes = collectStructuralFixes(lintContent(fixed, filePath, css, rules))
    if (structuralFixes.length) fixed = applyFixes(fixed, structuralFixes)
    return fixed
}

function createManifestDiagnostic(context: MasterCSSMCPContext, message: string): LintDiagnostic {
    const range = { start: 0, end: 0 }
    return {
        ruleId: 'manifest',
        code: 'manifest-loading-error',
        severity: 'error',
        message,
        range,
        loc: {
            start: { line: 1, column: 1 },
            end: { line: 1, column: 1 }
        },
        source: 'Master CSS',
        sourceKind: 'manifest',
        data: {
            cwd: context.root
        }
    }
}

function summarize(files: LintFileResult[]) {
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

async function loadLintState(context: MasterCSSMCPContext, options: LintProjectOptions = {}) {
    const rules = resolveRules(options.rules)
    const manifest = await loadWorkspaceManifest(context)
    const css = createCSSWithNativeDeclarations(manifest.status === 'loaded' ? manifest.manifest : defaultManifest)
    const files = await resolveSourceFiles(
        context,
        options.patterns ?? DEFAULT_LINT_SOURCE_PATTERNS,
        options.patterns ? [] : DEFAULT_IGNORE_PATTERNS
    )
    const inputs = await Promise.all(files.map(async (filePath) => ({
        filePath,
        content: await readFile(filePath, 'utf8')
    })))
    return { rules, manifest, css, inputs }
}

export async function lintProject(context: MasterCSSMCPContext, options: LintProjectOptions = {}) {
    const state = await loadLintState(context, options)
    const files = state.manifest.status === 'error'
        ? [{
            filePath: context.root,
            languageId: 'manifest',
            sourceKind: 'manifest' as const,
            diagnostics: [createManifestDiagnostic(context, `Failed to load Master CSS manifest: ${state.manifest.error}`)]
        }]
        : state.inputs
            .map((input) => lintContent(input.content, input.filePath, state.css, state.rules))
            .filter((result) => result.diagnostics.length)

    return {
        root: context.root,
        manifest: {
            status: state.manifest.status,
            entries: state.manifest.entries,
            diagnostics: state.manifest.status === 'error' ? files[0].diagnostics : []
        },
        files,
        summary: summarize(files)
    }
}

export async function previewLintFixes(context: MasterCSSMCPContext, options: PreviewFixesOptions = {}) {
    const state = await loadLintState(context, options)
    if (state.manifest.status === 'error') {
        return {
            mode: 'lint-fixes',
            preview: await context.createPreview([], options.ttlMs),
            lint: await lintProject(context, options)
        }
    }
    const changes = []
    for (const input of state.inputs) {
        const fixed = fixContent(input.content, input.filePath, state.css, state.rules, Boolean(options.includeDirectiveFixes))
        if (fixed !== input.content) {
            changes.push({
                filePath: input.filePath,
                beforeText: input.content,
                afterText: fixed
            })
        }
    }
    const preview = await context.createPreview(changes, options.ttlMs)
    return {
        mode: 'lint-fixes',
        preview,
        lint: await lintProject(context, options)
    }
}
