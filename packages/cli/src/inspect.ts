import CSSScanner, { type ScannerOptions } from '@master/css-scanner'
import {
    createExtractedCSSResult,
    registerStyleCSSSource,
    type StyleCSSSources
} from '@master/css-stylesheet'
import { findCSSManifestEntryFiles } from '@master/css-project/entries'
import fg from 'fast-glob'
import fs from 'node:fs'
import path from 'node:path'

const REPORT_VERSION = 1
const DEFAULT_SOURCE_PATTERNS = ['**/*.{html,htm,js,jsx,cjs,ts,tsx,mts,cts,svelte,astro,vue,md,mdx,pug,php}']
const DEFAULT_IGNORE_PATTERNS = ['**/node_modules/**', 'node_modules']

export interface InspectOptions {
    cwd?: string
    format?: 'json' | 'stylish'
    classes?: string
    includeCss?: boolean
    exitCode?: 'diagnostics' | 'never'
    maxWarnings?: string | number
}

type DiagnosticSeverity = 'error' | 'warning'
type DiagnosticCode =
    | 'invalid-scanner-class'
    | 'missing-css'
    | 'stylesheet-error'
    | 'stylesheet-warning'
    | 'scanner-error'
type DiagnosticSourceKind = 'scanner' | 'stylesheet' | 'missing-css'

interface Diagnostic {
    code: DiagnosticCode
    severity: DiagnosticSeverity
    message: string
    source: 'Master CSS'
    sourceKind: DiagnosticSourceKind
    filePath?: string
    data?: unknown
}

interface SourceInspection {
    filePath: string
    source: string
    scanned: boolean
    changed: boolean
    discovered: {
        latent: string[]
        valid: string[]
        invalid: string[]
        usedNative: string[]
    }
}

interface StylesheetInspection {
    filePath: string
    masterCSS: boolean
    pruneNativeCSS: boolean
    dependencies: string[]
    sourceDependencies: string[]
    warnings: string[]
    errors: string[]
}

interface StylesheetError {
    filePath: string
    message: string
}

interface MissingCSSResult {
    className: string
    status: 'present' | 'missing'
    reason: 'generated' | 'native-css' | 'safelist' | 'invalid' | 'blocklisted' | 'not-detected'
}

interface InspectReport {
    version: number
    cwd: string
    inputs: {
        patterns: string[]
        files: string[]
        classes: string[]
    }
    scanner: {
        counts: {
            latent: number
            valid: number
            invalid: number
            native: number
            usedNative: number
            safelist: number
            blocklist: number
        }
        classes: {
            latent: string[]
            valid: string[]
            invalid: string[]
            native: string[]
            usedNative: string[]
            safelist: string[]
            blocklist: string[]
        }
        resetDependencies: string[]
    }
    stylesheets: {
        entries: StylesheetInspection[]
        dependencies: string[]
        warnings: string[]
        errors: StylesheetError[]
    }
    css: {
        bytes: number
        included: boolean
        text?: string
        emittedGlobals: {
            variables: number
            animations: number
        }
    }
    missingCSS: {
        checked: string[]
        present: MissingCSSResult[]
        missing: MissingCSSResult[]
    }
    files: SourceInspection[]
    diagnostics: Diagnostic[]
    summary: {
        files: number
        stylesheets: number
        diagnostics: number
        errors: number
        warnings: number
        missingCSS: number
        invalidClasses: number
    }
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

function sortedValues(values: Iterable<string>) {
    return [...new Set(values)].sort()
}

function diffSet(after: Set<string>, before: Set<string>) {
    return sortedValues([...after].filter((value) => !before.has(value)))
}

function parseClassListOption(value: string | undefined) {
    return value?.split(/\s+/).map((item) => item.trim()).filter(Boolean) ?? []
}

function parseMaxWarnings(value: string | number | undefined) {
    if (value === undefined) return Number.POSITIVE_INFINITY
    const maxWarnings = Number(value)
    return Number.isFinite(maxWarnings) && maxWarnings >= 0 ? maxWarnings : 0
}

function isBlocklisted(className: string, blocklist: ScannerOptions['blocklist']) {
    return blocklist?.some((pattern) => {
        if (typeof pattern === 'string') return pattern === className
        pattern.lastIndex = 0
        const matched = pattern.test(className)
        pattern.lastIndex = 0
        return matched
    }) ?? false
}

function createScannerClassDiagnostics(scanner: CSSScanner, firstSourceByClass: Map<string, string>): Diagnostic[] {
    return sortedValues(scanner.invalidClasses).map((className) => ({
        code: 'invalid-scanner-class',
        severity: 'warning',
        message: `Scanner candidate "${className}" did not generate Master CSS rules.`,
        source: 'Master CSS',
        sourceKind: 'scanner',
        filePath: firstSourceByClass.get(className),
        data: {
            className
        }
    }))
}

function classifyMissingCSS(scanner: CSSScanner, className: string): MissingCSSResult {
    const safelist = scanner.options.safelist ?? []
    if (scanner.validClasses.has(className)) {
        return { className, status: 'present', reason: 'generated' }
    }
    if (scanner.usedNativeClasses.has(className)) {
        return { className, status: 'present', reason: 'native-css' }
    }
    if (safelist.includes(className)) {
        return { className, status: 'present', reason: 'safelist' }
    }
    if (scanner.invalidClasses.has(className)) {
        return { className, status: 'missing', reason: 'invalid' }
    }
    if (isBlocklisted(className, scanner.options.blocklist)) {
        return { className, status: 'missing', reason: 'blocklisted' }
    }
    return { className, status: 'missing', reason: 'not-detected' }
}

function createMissingCSSDiagnostics(results: MissingCSSResult[]): Diagnostic[] {
    return results
        .filter((result) => result.status === 'missing')
        .map((result) => ({
            code: 'missing-css',
            severity: 'error',
            message: `No generated CSS found for "${result.className}" (${result.reason}).`,
            source: 'Master CSS',
            sourceKind: 'missing-css',
            data: result
        }))
}

async function registerManagedCSSEntries(scanner: CSSScanner, styleCSSSources: StyleCSSSources) {
    const entries: StylesheetInspection[] = []
    const warnings: string[] = []
    const errors: StylesheetError[] = []
    styleCSSSources.clear()
    for (const entry of await findCSSManifestEntryFiles(scanner.cwd)) {
        try {
            const result = await registerStyleCSSSource(scanner, styleCSSSources, entry, fs.readFileSync(entry, 'utf8'), {
                projectDir: scanner.cwd
            })
            const styleSource = styleCSSSources.get(entry)
            entries.push({
                filePath: entry,
                masterCSS: Boolean(styleSource?.masterCSS),
                pruneNativeCSS: Boolean(styleSource?.pruneNativeCSS),
                dependencies: sortedValues(styleSource?.dependencies ?? []),
                sourceDependencies: sortedValues(styleSource?.sourceDependencies ?? []),
                warnings: result.warnings ?? [],
                errors: []
            })
            warnings.push(...(result.warnings ?? []))
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error)
            entries.push({
                filePath: entry,
                masterCSS: false,
                pruneNativeCSS: false,
                dependencies: [],
                sourceDependencies: [],
                warnings: [],
                errors: [message]
            })
            errors.push({
                filePath: entry,
                message
            })
        }
    }
    scanner.resetDependencies = sortedValues(
        Array.from(styleCSSSources.values()).flatMap((source) => source.dependencies)
    )
    return {
        entries,
        warnings: sortedValues(warnings),
        errors
    }
}

async function scanSourceFile(scanner: CSSScanner, source: string, firstSourceByClass: Map<string, string>): Promise<SourceInspection> {
    const filePath = path.resolve(scanner.cwd, source)
    const beforeLatent = new Set(scanner.latentClasses)
    const beforeValid = new Set(scanner.validClasses)
    const beforeInvalid = new Set(scanner.invalidClasses)
    const beforeUsedNative = new Set(scanner.usedNativeClasses)
    const changed = await scanner.scan(source, fs.readFileSync(filePath, 'utf8'))
    const latent = diffSet(scanner.latentClasses, beforeLatent)
    const valid = diffSet(scanner.validClasses, beforeValid)
    const invalid = diffSet(scanner.invalidClasses, beforeInvalid)
    const usedNative = diffSet(scanner.usedNativeClasses, beforeUsedNative)
    for (const className of [...latent, ...valid, ...invalid, ...usedNative]) {
        if (!firstSourceByClass.has(className)) firstSourceByClass.set(className, filePath)
    }
    return {
        filePath,
        source,
        scanned: true,
        changed,
        discovered: {
            latent,
            valid,
            invalid,
            usedNative
        }
    }
}

function createSummary(report: Omit<InspectReport, 'summary'>): InspectReport['summary'] {
    const errors = report.diagnostics.filter((diagnostic) => diagnostic.severity === 'error').length
    const warnings = report.diagnostics.filter((diagnostic) => diagnostic.severity === 'warning').length
    return {
        files: report.files.length,
        stylesheets: report.stylesheets.entries.length,
        diagnostics: report.diagnostics.length,
        errors,
        warnings,
        missingCSS: report.missingCSS.missing.length,
        invalidClasses: report.scanner.counts.invalid
    }
}

function formatStylish(report: InspectReport) {
    const lines = [
        `Scanned ${report.summary.files} files, ${report.summary.stylesheets} stylesheet entries.`,
        `Classes: ${report.scanner.counts.valid} valid, ${report.scanner.counts.invalid} invalid, ${report.scanner.counts.usedNative} native.`,
        `CSS: ${report.css.bytes} bytes.`
    ]
    if (report.missingCSS.checked.length) {
        lines.push(`Missing CSS: ${report.missingCSS.missing.length}/${report.missingCSS.checked.length}`)
    }
    for (const diagnostic of report.diagnostics) {
        lines.push(`${diagnostic.severity.toUpperCase()} ${diagnostic.code}: ${diagnostic.message}`)
    }
    return `${lines.join('\n')}\n`
}

function outputReport(report: InspectReport, format: 'json' | 'stylish') {
    if (format === 'stylish') {
        process.stdout.write(formatStylish(report))
    } else {
        console.log(JSON.stringify(report, null, 2))
    }
}

export default async function runInspect(specifiedSourcePaths: string[] = [], options: InspectOptions = {}) {
    const cwd = path.resolve(options.cwd || process.cwd())
    const format = options.format || 'json'
    const exitCode = options.exitCode || 'diagnostics'
    const classChecks = parseClassListOption(options.classes)
    const sourcePatterns = normalizeSourcePatterns(specifiedSourcePaths)
    const scanner = new CSSScanner({}, cwd)
    const styleCSSSources: StyleCSSSources = new Map()
    const firstSourceByClass = new Map<string, string>()
    const diagnostics: Diagnostic[] = []

    scanner.on('init', (scannerOptions: ScannerOptions) => {
        if (!specifiedSourcePaths.length) {
            scannerOptions.exclude ??= []
            for (const pattern of DEFAULT_IGNORE_PATTERNS) {
                if (!scannerOptions.exclude.includes(pattern)) scannerOptions.exclude.push(pattern)
            }
        }
        scannerOptions.verbose = 0
    })

    try {
        await scanner.init()
        const stylesheetInspection = await registerManagedCSSEntries(scanner, styleCSSSources)
        diagnostics.push(...stylesheetInspection.entries.flatMap((entry) => entry.warnings.map((warning) => ({
            code: 'stylesheet-warning' as const,
            severity: 'warning' as const,
            message: warning,
            source: 'Master CSS' as const,
            sourceKind: 'stylesheet' as const,
            filePath: entry.filePath
        }))))
        diagnostics.push(...stylesheetInspection.errors.map((error) => ({
            code: 'stylesheet-error' as const,
            severity: 'error' as const,
            message: error.message,
            source: 'Master CSS' as const,
            sourceKind: 'stylesheet' as const,
            filePath: error.filePath
        })))
        const sourcePaths = resolveSourcePaths(
            cwd,
            sourcePatterns,
            specifiedSourcePaths.length ? [] : scanner.options.exclude
        )
        const files = await Promise.all(sourcePaths.map((source) => scanSourceFile(scanner, source, firstSourceByClass)))
        const cssResult = await createExtractedCSSResult({
            scanner,
            styleCSSSources,
            projectDir: scanner.cwd
        })
        const missingResults = classChecks.map((className) => classifyMissingCSS(scanner, className))
        diagnostics.push(...createScannerClassDiagnostics(scanner, firstSourceByClass))
        diagnostics.push(...createMissingCSSDiagnostics(missingResults))

        const baseReport = {
            version: REPORT_VERSION,
            cwd,
            inputs: {
                patterns: sourcePatterns,
                files: sourcePaths.map((source) => path.resolve(cwd, source)),
                classes: classChecks
            },
            scanner: {
                counts: {
                    latent: scanner.latentClasses.size,
                    valid: scanner.validClasses.size,
                    invalid: scanner.invalidClasses.size,
                    native: scanner.nativeClassNames.size,
                    usedNative: scanner.usedNativeClasses.size,
                    safelist: scanner.options.safelist?.length ?? 0,
                    blocklist: scanner.options.blocklist?.length ?? 0
                },
                classes: {
                    latent: sortedValues(scanner.latentClasses),
                    valid: sortedValues(scanner.validClasses),
                    invalid: sortedValues(scanner.invalidClasses),
                    native: sortedValues(scanner.nativeClassNames),
                    usedNative: sortedValues(scanner.usedNativeClasses),
                    safelist: sortedValues(scanner.options.safelist ?? []),
                    blocklist: (scanner.options.blocklist ?? []).map(String).sort()
                },
                resetDependencies: sortedValues(scanner.resetDependencies)
            },
            stylesheets: {
                entries: stylesheetInspection.entries,
                dependencies: sortedValues(stylesheetInspection.entries.flatMap((entry) => entry.dependencies)),
                warnings: stylesheetInspection.warnings,
                errors: stylesheetInspection.errors
            },
            css: {
                bytes: cssResult.css.length,
                included: Boolean(options.includeCss),
                ...(options.includeCss ? { text: cssResult.css } : {}),
                emittedGlobals: {
                    variables: Object.keys(cssResult.emittedGlobals.variables).length,
                    animations: Object.keys(cssResult.emittedGlobals.animations).length
                }
            },
            missingCSS: {
                checked: classChecks,
                present: missingResults.filter((result) => result.status === 'present'),
                missing: missingResults.filter((result) => result.status === 'missing')
            },
            files,
            diagnostics
        }
        const report: InspectReport = {
            ...baseReport,
            summary: createSummary(baseReport)
        }
        outputReport(report, format)
        if (exitCode !== 'never' && (report.summary.errors || report.summary.warnings > parseMaxWarnings(options.maxWarnings))) {
            process.exitCode = 1
        }
        return report
    } catch (error) {
        diagnostics.push({
            code: 'scanner-error',
            severity: 'error',
            message: error instanceof Error ? error.message : String(error),
            source: 'Master CSS',
            sourceKind: 'scanner',
            data: {
                cwd
            }
        })
        const baseReport = {
            version: REPORT_VERSION,
            cwd,
            inputs: {
                patterns: sourcePatterns,
                files: [],
                classes: classChecks
            },
            scanner: {
                counts: {
                    latent: 0,
                    valid: 0,
                    invalid: 0,
                    native: 0,
                    usedNative: 0,
                    safelist: 0,
                    blocklist: 0
                },
                classes: {
                    latent: [],
                    valid: [],
                    invalid: [],
                    native: [],
                    usedNative: [],
                    safelist: [],
                    blocklist: []
                },
                resetDependencies: []
            },
            stylesheets: {
                entries: [],
                dependencies: [],
                warnings: [],
                errors: []
            },
            css: {
                bytes: 0,
                included: false,
                emittedGlobals: {
                    variables: 0,
                    animations: 0
                }
            },
            missingCSS: {
                checked: classChecks,
                present: [],
                missing: []
            },
            files: [],
            diagnostics
        }
        const report: InspectReport = {
            ...baseReport,
            summary: createSummary(baseReport)
        }
        outputReport(report, format)
        if (exitCode !== 'never') process.exitCode = 1
        return report
    }
}
