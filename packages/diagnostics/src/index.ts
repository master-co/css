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

export const MASTER_CSS_INSPECTION_REPORT_VERSION = 1

const DEFAULT_SOURCE_PATTERNS = ['**/*.{html,htm,js,jsx,cjs,ts,tsx,mts,cts,svelte,astro,vue,md,mdx,pug,php}']
const DEFAULT_IGNORE_PATTERNS = ['**/node_modules/**', 'node_modules']

export type MasterCSSInspectionDiagnosticSeverity = 'error' | 'warning'
export type MasterCSSInspectionDiagnosticCode =
  | 'invalid-scanner-class'
  | 'missing-css'
  | 'stylesheet-error'
  | 'stylesheet-warning'
  | 'scanner-error'
export type MasterCSSInspectionDiagnosticSourceKind = 'scanner' | 'stylesheet' | 'missing-css'

export interface MasterCSSInspectionDiagnostic {
  code: MasterCSSInspectionDiagnosticCode
  severity: MasterCSSInspectionDiagnosticSeverity
  message: string
  source: 'Master CSS'
  sourceKind: MasterCSSInspectionDiagnosticSourceKind
  filePath?: string
  data?: unknown
}

export interface MasterCSSSourceInspection {
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

export interface MasterCSSStylesheetInspection {
  filePath: string
  masterCSS: boolean
  pruneNativeCSS: boolean
  dependencies: string[]
  sourceDependencies: string[]
  warnings: string[]
  errors: string[]
}

export interface MasterCSSStylesheetError {
  filePath: string
  message: string
}

export interface MasterCSSMissingCSSResult {
  className: string
  status: 'present' | 'missing'
  reason: 'generated' | 'native-css' | 'safelist' | 'invalid' | 'blocklisted' | 'not-detected'
}

export interface MasterCSSInspectionReport {
  version: typeof MASTER_CSS_INSPECTION_REPORT_VERSION
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
    entries: MasterCSSStylesheetInspection[]
    dependencies: string[]
    warnings: string[]
    errors: MasterCSSStylesheetError[]
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
    present: MasterCSSMissingCSSResult[]
    missing: MasterCSSMissingCSSResult[]
  }
  files: MasterCSSSourceInspection[]
  diagnostics: MasterCSSInspectionDiagnostic[]
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

export interface CreateMasterCSSInspectionReportOptions {
  cwd?: string
  patterns?: string[]
  classes?: string[] | string
  includeCss?: boolean
  ignore?: string[]
  resolveExistingFile?: (filePath: string) => string | Promise<string>
  validatePatterns?: (patterns: string[]) => void
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

function parseClassChecks(value: string[] | string | undefined) {
  return Array.isArray(value)
    ? value.map((item) => item.trim()).filter(Boolean)
    : value?.split(/\s+/).map((item) => item.trim()).filter(Boolean) ?? []
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

function createScannerClassDiagnostics(scanner: CSSScanner, firstSourceByClass: Map<string, string>): MasterCSSInspectionDiagnostic[] {
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

function classifyMissingCSS(scanner: CSSScanner, className: string): MasterCSSMissingCSSResult {
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

function createMissingCSSDiagnostics(results: MasterCSSMissingCSSResult[]): MasterCSSInspectionDiagnostic[] {
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

async function resolveFilePath(cwd: string, filePath: string, resolver?: CreateMasterCSSInspectionReportOptions['resolveExistingFile']) {
  return resolver
    ? await resolver(filePath)
    : path.resolve(cwd, filePath)
}

async function registerManagedCSSEntries(
  scanner: CSSScanner,
  styleCSSSources: StyleCSSSources,
  resolveExistingFile?: CreateMasterCSSInspectionReportOptions['resolveExistingFile']
) {
  const entries: MasterCSSStylesheetInspection[] = []
  const warnings: string[] = []
  const errors: MasterCSSStylesheetError[] = []
  styleCSSSources.clear()
  for (const entry of await findCSSManifestEntryFiles(scanner.cwd)) {
    const filePath = await resolveFilePath(scanner.cwd, entry, resolveExistingFile)
    try {
      const result = await registerStyleCSSSource(scanner, styleCSSSources, filePath, fs.readFileSync(filePath, 'utf8'), {
        projectDir: scanner.cwd
      })
      const styleSource = styleCSSSources.get(filePath)
      entries.push({
        filePath,
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
        filePath,
        masterCSS: false,
        pruneNativeCSS: false,
        dependencies: [],
        sourceDependencies: [],
        warnings: [],
        errors: [message]
      })
      errors.push({
        filePath,
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

async function scanSourceFile(
  scanner: CSSScanner,
  source: string,
  filePath: string,
  firstSourceByClass: Map<string, string>
): Promise<MasterCSSSourceInspection> {
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

function createSummary(report: Omit<MasterCSSInspectionReport, 'summary'>): MasterCSSInspectionReport['summary'] {
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

function createEmptyReport(cwd: string, sourcePatterns: string[], classChecks: string[], diagnostics: MasterCSSInspectionDiagnostic[]): MasterCSSInspectionReport {
  const baseReport: Omit<MasterCSSInspectionReport, 'summary'> = {
    version: MASTER_CSS_INSPECTION_REPORT_VERSION,
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
  return {
    ...baseReport,
    summary: createSummary(baseReport)
  }
}

export async function createMasterCSSInspectionReport(options: CreateMasterCSSInspectionReportOptions = {}): Promise<MasterCSSInspectionReport> {
  const cwd = path.resolve(options.cwd || process.cwd())
  const classChecks = parseClassChecks(options.classes)
  const specifiedPatterns = options.patterns
  const sourcePatterns = normalizeSourcePatterns(specifiedPatterns)
  options.validatePatterns?.(sourcePatterns)
  const scanner = new CSSScanner({}, cwd)
  const styleCSSSources: StyleCSSSources = new Map()
  const firstSourceByClass = new Map<string, string>()
  const diagnostics: MasterCSSInspectionDiagnostic[] = []

  scanner.on('init', (scannerOptions: ScannerOptions) => {
    if (!specifiedPatterns?.length) {
      scannerOptions.exclude ??= []
      for (const pattern of DEFAULT_IGNORE_PATTERNS) {
        if (!scannerOptions.exclude.includes(pattern)) scannerOptions.exclude.push(pattern)
      }
    }
    scannerOptions.verbose = 0
  })

  try {
    await scanner.init()
    const stylesheetInspection = await registerManagedCSSEntries(scanner, styleCSSSources, options.resolveExistingFile)
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
      options.ignore ?? (specifiedPatterns?.length ? [] : scanner.options.exclude)
    )
    const resolvedSourcePaths = await Promise.all(sourcePaths.map((source) => resolveFilePath(cwd, source, options.resolveExistingFile)))
    const files = await Promise.all(sourcePaths.map((source, index) => scanSourceFile(scanner, source, resolvedSourcePaths[index], firstSourceByClass)))
    const cssResult = await createExtractedCSSResult({
      scanner,
      styleCSSSources,
      projectDir: scanner.cwd
    })
    const missingResults = classChecks.map((className) => classifyMissingCSS(scanner, className))
    diagnostics.push(...createScannerClassDiagnostics(scanner, firstSourceByClass))
    diagnostics.push(...createMissingCSSDiagnostics(missingResults))

    const baseReport: Omit<MasterCSSInspectionReport, 'summary'> = {
      version: MASTER_CSS_INSPECTION_REPORT_VERSION,
      cwd,
      inputs: {
        patterns: sourcePatterns,
        files: resolvedSourcePaths,
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
    return {
      ...baseReport,
      summary: createSummary(baseReport)
    }
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
    return createEmptyReport(cwd, sourcePatterns, classChecks, diagnostics)
  }
}
