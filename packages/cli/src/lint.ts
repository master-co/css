import {
  fixMasterCSSContent,
  lintMasterCSSContent,
  resolveMasterCSSLintRules,
  summarizeMasterCSSLintFiles,
  type MasterCSSLintFileResult,
  type MasterCSSLintRuleId,
  type MasterCSSLintSourceDiagnostic,
  type MasterCSSLintSummary
} from '@master/css-lint'
import { createLintSessionSync, type LintSession } from '@master/css-lint/node'
import { loadProjectManifest } from '@master/css-project/manifest'
import fg from 'fast-glob'
import fs from 'node:fs'
import path from 'node:path'

const REPORT_VERSION = 1
const DEFAULT_SOURCE_PATTERNS = ['**/*.{html,htm,js,jsx,cjs,ts,tsx,mts,cts,svelte,astro,vue,md,mdx,pug,php,css,scss,less}']
const DEFAULT_IGNORE_PATTERNS = ['**/node_modules/**', 'node_modules']

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

interface CLILintReport {
  version: typeof REPORT_VERSION
  cwd: string
  manifest: {
    status: 'loaded' | 'error'
    entries: string[]
    diagnostics: MasterCSSLintSourceDiagnostic[]
  }
  files: MasterCSSLintFileResult[]
  summary: MasterCSSLintSummary
}

interface SourceInput {
  filePath: string
  content: string
  stdin?: boolean
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

function parseMaxWarnings(value: string | number | undefined) {
  if (value === undefined) return Number.POSITIVE_INFINITY
  const maxWarnings = Number(value)
  return Number.isFinite(maxWarnings) && maxWarnings >= 0 ? maxWarnings : 0
}

function createManifestDiagnostic(cwd: string, error: unknown): MasterCSSLintSourceDiagnostic {
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

function createManifestFileResult(cwd: string, diagnostics: MasterCSSLintSourceDiagnostic[]): MasterCSSLintFileResult {
  return {
    filePath: cwd,
    languageId: 'manifest',
    sourceKind: 'manifest',
    diagnostics
  }
}

function createReport(cwd: string, manifest: CLILintReport['manifest'], files: MasterCSSLintFileResult[]): CLILintReport {
  return {
    version: REPORT_VERSION,
    cwd,
    manifest,
    files,
    summary: summarizeMasterCSSLintFiles(files)
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
  rules: Record<MasterCSSLintRuleId, boolean>,
  lintSession: LintSession
) {
  return inputs.map((input) => lintMasterCSSContent({
    content: input.content,
    filePath: input.filePath,
    rules,
    lintSession
  })).filter((result) => result.diagnostics.length)
}

function applyFileFixes(
  inputs: SourceInput[],
  rules: Record<MasterCSSLintRuleId, boolean>,
  includeDirectiveFixes: boolean,
  lintSession: LintSession
) {
  for (const input of inputs) {
    if (input.stdin) continue
    const fixed = fixMasterCSSContent({
      content: input.content,
      filePath: input.filePath,
      rules,
      includeDirectiveFixes,
      lintSession
    })
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
  const rules = resolveMasterCSSLintRules(options.rules)
  const inputs = resolveSourceInputs(cwd, specifiedSourcePaths, options)
  let manifestResult: Awaited<ReturnType<typeof loadProjectManifest>>

  try {
    manifestResult = await loadProjectManifest(cwd)
  } catch (error) {
    const diagnostic = createManifestDiagnostic(cwd, error)
    const manifest: CLILintReport['manifest'] = {
      status: 'error',
      entries: [],
      diagnostics: [diagnostic]
    }
    const report = createReport(cwd, manifest, [createManifestFileResult(cwd, [diagnostic])])
    outputReport(report, format)
    if (exitCode !== 'never') process.exitCode = 1
    return report
  }

  const lintSession = createLintSessionSync(manifestResult.manifest)
  let files: MasterCSSLintFileResult[]
  try {
    files = lintInputs(inputs, rules, lintSession)
    if (options.fix && !options.fixDryRun) {
      applyFileFixes(inputs, rules, Boolean(options.fixDirectives), lintSession)
      files = lintInputs(inputs, rules, lintSession)
    }
  } finally {
    lintSession.dispose()
  }

  const manifest: CLILintReport['manifest'] = {
    status: 'loaded',
    entries: manifestResult.entries,
    diagnostics: []
  }
  const report = createReport(cwd, manifest, files)
  outputReport(report, format)

  if (exitCode !== 'never' && (report.summary.errors || report.summary.warnings > parseMaxWarnings(options.maxWarnings))) {
    process.exitCode = 1
  }
  return report
}
