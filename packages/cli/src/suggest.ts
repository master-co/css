import fs from 'node:fs'
import path from 'node:path'
import { loadProjectManifest } from '@master/css-compiler/project'
import { createToolingSessionSync } from '@master/css-tooling/node'
import type { MasterCSSToolingSession } from '@master/css-tooling'
import type { MasterCSSManifest } from '@master/css-schema/manifest'
import defaultManifestJSON from '@master/css-preset/default-manifest.json' with { type: 'json' }

export interface SuggestOptions {
  stdin?: boolean
  cwd?: string
}

type Inspection = ReturnType<MasterCSSToolingSession['inspectClassName']>
interface SuggestReport {
  version: 1
  cwd: string
  manifest: { status: 'not-loaded' | 'loaded' | 'error', entries: readonly string[] }
  result: ReturnType<MasterCSSToolingSession['suggestClasses']> | null
  validation: Pick<Inspection, 'className' | 'matchStatus' | 'cssSyntaxStatus' | 'cssValueStatus' | 'browserSupport'>[]
  diagnostics: { code: string, severity: string, message: string, className?: string }[]
}

export default async function runSuggest(declarations: string | undefined, options: SuggestOptions = {}) {
  const report: SuggestReport = {
    version: 1,
    cwd: path.resolve(options.cwd || process.cwd()),
    manifest: { status: 'not-loaded', entries: [] },
    result: null,
    validation: [],
    diagnostics: []
  }
  let failureCode = 'SUGGEST_INPUT_ERROR'
  try {
    if (options.stdin ? declarations !== undefined : declarations === undefined) {
      throw new Error('Provide either a declaration argument or --stdin, but not both.')
    }
    const input = options.stdin ? fs.readFileSync(0, 'utf8') : declarations!
    if (!input.trim()) throw new Error('The declaration block must not be empty.')
    if (!fs.statSync(report.cwd).isDirectory()) throw new Error('The project root must be a directory.')
    failureCode = 'PROJECT_MANIFEST_LOAD_ERROR'
    const project = await loadProjectManifest({
      root: report.cwd,
      baseManifest: defaultManifestJSON as unknown as MasterCSSManifest
    })
    report.manifest = { status: 'loaded', entries: project.entries }
    report.diagnostics.push(...project.diagnostics)
    failureCode = 'SUGGEST_EXECUTION_ERROR'
    using session = createToolingSessionSync({ manifest: project.manifest })
    report.result = session.suggestClasses(input)
    for (const className of report.result.classes) {
      const inspection = session.inspectClassName(className)
      const { matchStatus, cssSyntaxStatus, cssValueStatus, browserSupport } = inspection
      report.validation.push({ className, matchStatus, cssSyntaxStatus, cssValueStatus, browserSupport })
      report.diagnostics.push(...(inspection.diagnostics || []).map(diagnostic => ({ ...diagnostic, className })))
    }
  } catch (error) {
    if (failureCode === 'PROJECT_MANIFEST_LOAD_ERROR') report.manifest.status = 'error'
    report.result = null
    report.validation = []
    report.diagnostics.push({ code: failureCode, severity: 'error', message: error instanceof Error ? error.message : String(error) })
  }
  for (const diagnostic of report.diagnostics) {
    if (diagnostic.severity === 'error') {
      process.stderr.write(`${diagnostic.code}: ${diagnostic.message}\n`)
      process.exitCode = 1
    }
  }
  process.stdout.write(JSON.stringify(report, null, 2) + '\n')
  return report
}
