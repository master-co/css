import {
  MasterCSSScanner
} from '@master/css-tooling/scanner/node'
import {
  createExtractedCSSResult,
  registerStylesheetSource,
  type StylesheetSources
} from '../stylesheet'
import { validateClassNames } from '@master/css-tooling/validator'
import { discoverManifestEntries, loadProjectManifest } from '../project/manifest'
import fg from 'fast-glob'
import fs from 'node:fs'
import path from 'node:path'
import {
  createCompilerBindingSession,
  MASTER_CSS_DIAGNOSTICS_REPORT_VERSION,
  type MasterCSSDiagnosticsReportInput
} from '@master/css-binding/compiler'
import type { MasterCSSManifest } from '@master/css-schema/manifest'
import type {
  MasterCSSDiscoveredClasses,
  MasterCSSInspectionReport,
  MasterCSSSourceInspection,
  MasterCSSStylesheetError,
  MasterCSSStylesheetInspection
} from './contracts'

export type {
  MasterCSSDiscoveredClasses,
  MasterCSSInspectionDiagnostic,
  MasterCSSInspectionDiagnosticCode,
  MasterCSSInspectionDiagnosticSeverity,
  MasterCSSInspectionDiagnosticSourceKind,
  MasterCSSInspectionReport,
  MasterCSSMissingCSSReason,
  MasterCSSMissingCSSResult,
  MasterCSSMissingCSSStatus,
  MasterCSSSourceInspection,
  MasterCSSStylesheetError,
  MasterCSSStylesheetInspection
} from './contracts'

export const MASTER_CSS_INSPECTION_REPORT_VERSION = MASTER_CSS_DIAGNOSTICS_REPORT_VERSION

const DEFAULT_SOURCE_PATTERNS = ['**/*.{html,htm,js,jsx,mjs,cjs,ts,tsx,mts,cts,svelte,astro,vue,md,mdx,pug,php}']
const DEFAULT_IGNORE_PATTERNS = ['**/node_modules/**', 'node_modules']

export interface CreateMasterCSSInspectionReportOptions {
  manifest: MasterCSSManifest
  cwd?: string
  patterns?: readonly string[]
  classes?: readonly string[] | string
  includeCss?: boolean
  ignore?: readonly string[]
  resolveExistingFile?: (filePath: string) => string | Promise<string>
  validatePatterns?: (patterns: readonly string[]) => void
}

async function createBindingInspectionReport(
  input: MasterCSSDiagnosticsReportInput
): Promise<MasterCSSInspectionReport> {
  using compiler = await createCompilerBindingSession()
  return await compiler.createInspectionReport(input)
}

function normalizeSourcePatterns(specifiedSourcePaths?: readonly string[]) {
  return specifiedSourcePaths?.length ? specifiedSourcePaths : DEFAULT_SOURCE_PATTERNS
}

function normalizeGlobPatterns(patterns: readonly string[]) {
  return patterns.map((pattern) => pattern.replace(/\\/g, '/'))
}

function resolveSourcePaths(cwd: string, sourcePatterns: readonly string[], ignore: readonly string[] = []) {
  return fg.sync(normalizeGlobPatterns(sourcePatterns), {
    cwd,
    ignore: normalizeGlobPatterns(ignore),
    onlyFiles: true
  }).filter(Boolean)
}

function parseClassChecks(value: readonly string[] | string | undefined) {
  return typeof value === 'string'
    ? value.split(/\s+/).map((item) => item.trim()).filter(Boolean)
    : (value ?? []).map((item) => item.trim()).filter(Boolean)
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
  scanner: MasterCSSScanner,
  stylesheetSources: StylesheetSources,
  baseManifest: MasterCSSManifest,
  resolveExistingFile?: CreateMasterCSSInspectionReportOptions['resolveExistingFile']
) {
  const entries: MasterCSSStylesheetInspection[] = []
  const warnings: string[] = []
  const errors: MasterCSSStylesheetError[] = []
  stylesheetSources.clear()
  for (const entry of await discoverManifestEntries({ root: scanner.cwd })) {
    const filePath = preserveWorkspacePath(
      scanner.cwd,
      await resolveFilePath(scanner.cwd, entry, resolveExistingFile)
    )
    try {
      const result = await registerStylesheetSource(scanner, stylesheetSources, filePath, fs.readFileSync(filePath, 'utf8'), {
        baseManifest,
        projectDir: scanner.cwd
      })
      const styleSource = stylesheetSources.get(filePath)
      entries.push({
        filePath,
        masterCSS: Boolean(styleSource?.masterCSS),
        pruneNativeCSS: Boolean(styleSource?.pruneNativeCSS),
        dependencies: [...(styleSource?.dependencies ?? [])].map((dependency) => preserveWorkspacePath(scanner.cwd, dependency)),
        sourceDependencies: [...(styleSource?.sourceDependencies ?? [])].map((dependency) => preserveWorkspacePath(scanner.cwd, dependency)),
        compositions: result.compositions ?? [],
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
  scanner.resetDependencies = Array.from(stylesheetSources.values()).flatMap((source) => source.dependencies)
  return {
    entries,
    warnings,
    errors
  }
}

function inspectSourceFile(
  classes: Readonly<Record<keyof MasterCSSDiscoveredClasses, ReadonlySet<string>>>,
  source: string,
  filePath: string,
  scan: Awaited<ReturnType<MasterCSSScanner['scanSource']>>,
  firstSourceByClass: Map<string, string>
): MasterCSSSourceInspection {
  const candidates = [...new Set(scan.candidates)]
  const latent = candidates.filter((value) => classes.latent.has(value))
  const valid = candidates.filter((value) => classes.valid.has(value))
  const invalid = candidates.filter((value) => classes.invalid.has(value))
  const usedNative = candidates.filter((value) => classes.usedNative.has(value))
  for (const className of [...latent, ...valid, ...invalid, ...usedNative]) {
    if (!firstSourceByClass.has(className)) firstSourceByClass.set(className, filePath)
  }
  return {
    filePath,
    source,
    scanned: true,
    changed: scan.changed,
    discovered: {
      latent,
      valid,
      invalid,
      usedNative
    }
  }
}

export async function createMasterCSSInspectionReport(
  options: CreateMasterCSSInspectionReportOptions
): Promise<MasterCSSInspectionReport> {
  const cwd = path.resolve(options.cwd || process.cwd())
  const classChecks = parseClassChecks(options.classes)
  const specifiedPatterns = options.patterns
  const sourcePatterns = normalizeSourcePatterns(specifiedPatterns)
  options.validatePatterns?.(sourcePatterns)
  const scanner = new MasterCSSScanner({
    manifest: options.manifest,
    exclude: specifiedPatterns?.length
      ? undefined
      : DEFAULT_IGNORE_PATTERNS,
    verbose: 0
  }, cwd)
  const stylesheetSources: StylesheetSources = new Map()
  const firstSourceByClass = new Map<string, string>()
  let reportInput: MasterCSSDiagnosticsReportInput
  let stylesheetInspection: Awaited<ReturnType<typeof registerManagedCSSEntries>> | undefined

  try {
    let projectManifest = options.manifest
    let projectError: unknown
    try {
      projectManifest = (await loadProjectManifest({ root: cwd, baseManifest: options.manifest })).manifest
    } catch (error) { projectError = error }
    await scanner.init({ ...scanner.customOptions, manifest: projectManifest })
    stylesheetInspection = await registerManagedCSSEntries(
      scanner,
      stylesheetSources,
      options.manifest,
      options.resolveExistingFile
    )
    if (projectError) throw projectError
    const sourcePaths = resolveSourcePaths(
      cwd,
      sourcePatterns,
      options.ignore ?? (specifiedPatterns?.length ? [] : scanner.options.exclude)
    ).filter(source => scanner.isSourceAllowed(source, { explicit: Boolean(specifiedPatterns?.length) }))
    const resolvedSourcePaths = await Promise.all(sourcePaths.map((source) => resolveFilePath(cwd, source, options.resolveExistingFile)))
    const scans = await Promise.all(sourcePaths.map((source, index) => scanner.scanSource(
      source, fs.readFileSync(resolvedSourcePaths[index], 'utf8')
    )))
    const classes = {
      latent: new Set(scanner.latentClasses),
      valid: new Set(scanner.validClasses),
      invalid: new Set(scanner.invalidClasses),
      usedNative: new Set(scanner.usedNativeClasses)
    }
    const files = sourcePaths.map((source, index) => inspectSourceFile(
      classes, source, resolvedSourcePaths[index], scans[index], firstSourceByClass
    ))
    const cssResult = await createExtractedCSSResult({
      scanner,
      stylesheetSources,
      baseManifest: options.manifest,
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
      inspections: (await validateClassNames([...new Set([...scanner.latentClasses, ...scanner.validClasses, ...scanner.invalidClasses, ...classChecks])], { manifest: scanner.manifest })).classes,
      scanner: {
        latent: [...scanner.latentClasses],
        valid: [...scanner.validClasses],
        invalid: [...scanner.invalidClasses],
        native: [...scanner.nativeClassNames],
        usedNative: [...scanner.usedNativeClasses],
        safelist,
        blocklist: blocklist.map((entry) => entry instanceof RegExp
          ? { source: entry.source, flags: entry.flags }
          : entry),
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
      stylesheets: stylesheetInspection ?? {},
      css: {},
      fatalError: error instanceof Error ? error.message : String(error)
    }
  } finally {
    await scanner.dispose()
  }
  return await createBindingInspectionReport(reportInput)
}
