import {
  createMasterCSSInspectionReport,
  captureMasterCSSProject,
  compareProjectSnapshots,
  createMasterCSSDesignSystemReport,
  type MasterCSSDesignSystemOptions,
  type MasterCSSProjectDesignSystemReport,
  type MasterCSSProjectSnapshot,
  type MasterCSSProjectComparison,
  type MasterCSSInspectionReport
} from '@master/css-compiler/diagnostics'
import defaultManifestJSON from '@master/css-preset/default-manifest.json' with { type: 'json' }
import type { MasterCSSManifest } from '@master/css-schema/manifest'
import path from 'node:path'
import { readFile } from 'node:fs/promises'

const defaultManifest = defaultManifestJSON as unknown as MasterCSSManifest

export interface InspectOptions {
  cwd?: string
  format?: 'json' | 'stylish'
  classes?: string
  includeCss?: boolean
  exitCode?: 'diagnostics' | 'never'
  maxWarnings?: string | number
  snapshot?: boolean
  compare?: string
  designSystem?: boolean
  designSystemOptions?: string
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

export default function runInspect(specifiedSourcePaths: string[], options: InspectOptions & { designSystem: true }): Promise<MasterCSSProjectDesignSystemReport>
export default function runInspect(specifiedSourcePaths?: string[], options?: InspectOptions & { snapshot?: false, compare?: undefined, designSystem?: false }): Promise<MasterCSSInspectionReport>
export default function runInspect(specifiedSourcePaths: string[], options: InspectOptions & { snapshot: true, compare?: undefined }): Promise<MasterCSSProjectSnapshot>
export default function runInspect(specifiedSourcePaths: string[], options: InspectOptions & { compare: string, snapshot?: false }): Promise<MasterCSSProjectComparison>
export default function runInspect(specifiedSourcePaths: string[], options: InspectOptions): Promise<MasterCSSInspectionReport | MasterCSSProjectSnapshot | MasterCSSProjectComparison | MasterCSSProjectDesignSystemReport>
export default async function runInspect(specifiedSourcePaths: string[] = [], options: InspectOptions = {}) {
  const cwd = path.resolve(options.cwd || process.cwd())
  const format = options.format || 'json'
  const exitCode = options.exitCode || 'diagnostics'
  if (options.designSystemOptions && !options.designSystem) throw new Error('--design-system-options requires --design-system.')
  if (options.designSystem) {
    if (options.snapshot || options.compare || specifiedSourcePaths.length || options.classes || options.includeCss) {
      throw new Error('--design-system inspects the managed CSS graph; do not combine it with source patterns, --classes, --include-css, --snapshot or --compare.')
    }
    const designSystem = options.designSystemOptions
      ? JSON.parse(await readFile(path.resolve(cwd, options.designSystemOptions), 'utf8')) as MasterCSSDesignSystemOptions
      : undefined
    if (options.designSystemOptions && (!designSystem || typeof designSystem !== 'object' || Array.isArray(designSystem))) {
      throw new TypeError('Design-system options must be a versioned JSON object.')
    }
    const report = await createMasterCSSDesignSystemReport({ manifest: defaultManifest, cwd, designSystem })
    if (format === 'stylish') {
      const lines = [`Inspected ${report.summary.stylesheets} managed stylesheets, ${report.summary.references} token references.`]
      for (const item of report.diagnostics) lines.push(`${item.severity.toUpperCase()} ${item.code}${item.source ? ` ${item.source}` : ''}: ${item.message}`)
      lines.push('Coverage: supplied project CSS; browser behavior not checked.')
      process.stderr.write(`${lines.join('\n')}\n`)
    } else process.stdout.write(`${JSON.stringify(report, null, 2)}\n`)
    if (exitCode !== 'never' && (report.summary.errors || report.summary.warnings > parseMaxWarnings(options.maxWarnings))) process.exitCode = 1
    return report
  }
  const inspectionOptions = {
    manifest: defaultManifest,
    cwd,
    patterns: specifiedSourcePaths.length ? specifiedSourcePaths : undefined,
    classes: options.classes,
    includeCss: Boolean(options.includeCss)
  }
  if (options.snapshot || options.compare) {
    if (options.snapshot && options.compare) throw new Error('Choose either --snapshot or --compare.')
    const { snapshot } = await captureMasterCSSProject(inspectionOptions)
    const result = options.compare
      ? await compareProjectSnapshots({ before: JSON.parse(await readFile(path.resolve(cwd, options.compare), 'utf8')) as MasterCSSProjectSnapshot, after: snapshot })
      : snapshot
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`)
    return result
  }
  const report = await createMasterCSSInspectionReport(inspectionOptions)

  outputReport(report, format)
  if (exitCode !== 'never' && (report.summary.errors || report.summary.warnings > parseMaxWarnings(options.maxWarnings))) {
    process.exitCode = 1
  }
  return report
}
