import CSSScanner, {
  serializeScannerBlocklist,
  type ScannerOptions
} from '@master/css-scanner'
import {
  createExtractedCSSResult,
  registerStyleCSSSource,
  type StyleCSSSources
} from '@master/css-stylesheet'
import { findCSSManifestEntryFiles } from '@master/css-project/entries'
import fg from 'fast-glob'
import fs from 'node:fs'
import path from 'node:path'
import { MASTER_CSS_DIAGNOSTICS_REPORT_VERSION } from '@master/css-schema/rust-contract'
import type {
  MasterCSSInspectionDiagnosticIR,
  MasterCSSInspectionReportIR,
  MasterCSSMissingCSSResultIR,
  MasterCSSSourceInspectionIR,
  MasterCSSStylesheetErrorIR,
  MasterCSSStylesheetInspectionIR
} from '@master/css-schema/rust-contract'
import { loadRustInspectionReportCreator } from './rust-report'

export const MASTER_CSS_INSPECTION_REPORT_VERSION = MASTER_CSS_DIAGNOSTICS_REPORT_VERSION

const DEFAULT_SOURCE_PATTERNS = ['**/*.{html,htm,js,jsx,cjs,ts,tsx,mts,cts,svelte,astro,vue,md,mdx,pug,php}']
const DEFAULT_IGNORE_PATTERNS = ['**/node_modules/**', 'node_modules']

export type MasterCSSInspectionDiagnostic = MasterCSSInspectionDiagnosticIR
export type MasterCSSSourceInspection = MasterCSSSourceInspectionIR
export type MasterCSSStylesheetInspection = MasterCSSStylesheetInspectionIR
export type MasterCSSStylesheetError = MasterCSSStylesheetErrorIR
export type MasterCSSMissingCSSResult = MasterCSSMissingCSSResultIR
export type MasterCSSInspectionReport = MasterCSSInspectionReportIR

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

function diffSet(after: Iterable<string>, before: { has(value: string): boolean }) {
  return [...after].filter((value) => !before.has(value))
}

function parseClassChecks(value: string[] | string | undefined) {
  return Array.isArray(value)
    ? value.map((item) => item.trim()).filter(Boolean)
    : value?.split(/\s+/).map((item) => item.trim()).filter(Boolean) ?? []
}

async function resolveFilePath(cwd: string, filePath: string, resolver?: CreateMasterCSSInspectionReportOptions['resolveExistingFile']) {
  return resolver
    ? await resolver(filePath)
    : path.resolve(cwd, filePath)
}

function preserveWorkspacePath(cwd: string, filePath: string) {
  let realCwd: string
  try {
    realCwd = fs.realpathSync.native(cwd)
  } catch {
    return filePath
  }
  if (realCwd === cwd || (filePath !== realCwd && !filePath.startsWith(`${realCwd}${path.sep}`))) return filePath
  return path.join(cwd, path.relative(realCwd, filePath))
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
    const filePath = preserveWorkspacePath(
      scanner.cwd,
      await resolveFilePath(scanner.cwd, entry, resolveExistingFile)
    )
    try {
      const result = await registerStyleCSSSource(scanner, styleCSSSources, filePath, fs.readFileSync(filePath, 'utf8'), {
        projectDir: scanner.cwd
      })
      const styleSource = styleCSSSources.get(filePath)
      entries.push({
        filePath,
        masterCSS: Boolean(styleSource?.masterCSS),
        pruneNativeCSS: Boolean(styleSource?.pruneNativeCSS),
        dependencies: [...(styleSource?.dependencies ?? [])].map((dependency) => preserveWorkspacePath(scanner.cwd, dependency)),
        sourceDependencies: [...(styleSource?.sourceDependencies ?? [])].map((dependency) => preserveWorkspacePath(scanner.cwd, dependency)),
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
  scanner.resetDependencies = Array.from(styleCSSSources.values()).flatMap((source) => source.dependencies)
  return {
    entries,
    warnings,
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

export async function createMasterCSSInspectionReport(options: CreateMasterCSSInspectionReportOptions = {}): Promise<MasterCSSInspectionReport> {
  const cwd = path.resolve(options.cwd || process.cwd())
  const classChecks = parseClassChecks(options.classes)
  const specifiedPatterns = options.patterns
  const sourcePatterns = normalizeSourcePatterns(specifiedPatterns)
  options.validatePatterns?.(sourcePatterns)
  const createReport = await loadRustInspectionReportCreator()
  const scanner = new CSSScanner({}, cwd)
  const styleCSSSources: StyleCSSSources = new Map()
  const firstSourceByClass = new Map<string, string>()
  let reportInput: unknown

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
    const safelist = scanner.options.safelist ?? []
    const blocklist = scanner.options.blocklist ?? []
    reportInput = {
      version: MASTER_CSS_DIAGNOSTICS_REPORT_VERSION,
      cwd,
      patterns: sourcePatterns,
      files,
      classes: classChecks,
      scanner: {
        latent: [...scanner.latentClasses],
        valid: [...scanner.validClasses],
        invalid: [...scanner.invalidClasses],
        native: [...scanner.nativeClassNames],
        usedNative: [...scanner.usedNativeClasses],
        safelist,
        blocklist: serializeScannerBlocklist(blocklist),
        resetDependencies: scanner.resetDependencies
      },
      stylesheets: stylesheetInspection,
      css: {
        included: Boolean(options.includeCss),
        text: cssResult.css,
        variables: Object.keys(cssResult.emittedGlobals.variables),
        animations: Object.keys(cssResult.emittedGlobals.animations)
      },
      firstSourceByClass: Object.fromEntries(firstSourceByClass)
    }
  } catch (error) {
    reportInput = {
      version: MASTER_CSS_DIAGNOSTICS_REPORT_VERSION,
      cwd,
      patterns: sourcePatterns,
      files: [],
      classes: classChecks,
      scanner: {},
      stylesheets: {},
      css: {},
      fatalError: error instanceof Error ? error.message : String(error)
    }
  }
  return await createReport<MasterCSSInspectionReport>(reportInput)
}
