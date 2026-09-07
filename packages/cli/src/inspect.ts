import {
  createMasterCSSInspectionReport,
  type MasterCSSInspectionReport
} from '@master/css-compiler/diagnostics'
import defaultManifestJSON from '@master/css-preset/default-manifest.json' with { type: 'json' }
import type { MasterCSSManifest } from '@master/css-schema/manifest'
import path from 'node:path'

const defaultManifest = defaultManifestJSON as unknown as MasterCSSManifest

export interface InspectOptions {
  cwd?: string
  format?: 'json' | 'stylish'
  classes?: string
  includeCss?: boolean
  exitCode?: 'diagnostics' | 'never'
  maxWarnings?: string | number
}

function parseMaxWarnings(value: string | number | undefined) {
  if (value === undefined) return Number.POSITIVE_INFINITY
  const maxWarnings = Number(value)
  return Number.isFinite(maxWarnings) && maxWarnings >= 0 ? maxWarnings : 0
}

function formatStylish(report: MasterCSSInspectionReport) {
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

function outputReport(report: MasterCSSInspectionReport, format: 'json' | 'stylish') {
  if (format === 'stylish') {
    process.stderr.write(formatStylish(report))
  } else {
    process.stdout.write(`${JSON.stringify(report, null, 2)}\n`)
  }
}

export default async function runInspect(specifiedSourcePaths: string[] = [], options: InspectOptions = {}) {
  const cwd = path.resolve(options.cwd || process.cwd())
  const format = options.format || 'json'
  const exitCode = options.exitCode || 'diagnostics'
  const report = await createMasterCSSInspectionReport({
    manifest: defaultManifest,
    cwd,
    patterns: specifiedSourcePaths.length ? specifiedSourcePaths : undefined,
    classes: options.classes,
    includeCss: Boolean(options.includeCss)
  })

  outputReport(report, format)
  if (exitCode !== 'never' && (report.summary.errors || report.summary.warnings > parseMaxWarnings(options.maxWarnings))) {
    process.exitCode = 1
  }
  return report
}
