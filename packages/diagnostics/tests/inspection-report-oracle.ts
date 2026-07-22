import type { MasterCSSInspectionReport } from '../src'

export interface InspectionReportOracleInput {
  version: 1
  cwd: string
  patterns: string[]
  files: MasterCSSInspectionReport['files'][number][]
  classes: string[]
  scanner: {
    latent?: string[]
    valid?: string[]
    invalid?: string[]
    native?: string[]
    usedNative?: string[]
    safelist?: string[]
    blocklist?: string[]
    blockedClasses?: string[]
    safelistCount?: number
    blocklistCount?: number
    resetDependencies?: string[]
  }
  stylesheets: {
    entries?: MasterCSSInspectionReport['stylesheets']['entries'][number][]
    warnings?: string[]
    errors?: MasterCSSInspectionReport['stylesheets']['errors'][number][]
  }
  css: {
    text?: string
    included?: boolean
    variables?: string[]
    animations?: string[]
  }
  firstSourceByClass?: Record<string, string>
}

function sorted(values: string[] = []) {
  return [...new Set(values)].sort()
}

export default function createInspectionReportOracle(
  input: InspectionReportOracleInput
): MasterCSSInspectionReport {
  const latent = sorted(input.scanner.latent)
  const valid = sorted(input.scanner.valid)
  const invalid = sorted(input.scanner.invalid)
  const native = sorted(input.scanner.native)
  const usedNative = sorted(input.scanner.usedNative)
  const safelist = sorted(input.scanner.safelist)
  const validSet = new Set(valid)
  const invalidSet = new Set(invalid)
  const usedNativeSet = new Set(usedNative)
  const safelistSet = new Set(safelist)
  const blockedSet = new Set(input.scanner.blockedClasses)
  const missingResults = input.classes.map((className) => {
    if (validSet.has(className)) return { className, status: 'present' as const, reason: 'generated' as const }
    if (usedNativeSet.has(className)) return { className, status: 'present' as const, reason: 'native-css' as const }
    if (safelistSet.has(className)) return { className, status: 'present' as const, reason: 'safelist' as const }
    if (invalidSet.has(className)) return { className, status: 'missing' as const, reason: 'invalid' as const }
    if (blockedSet.has(className)) return { className, status: 'missing' as const, reason: 'blocklisted' as const }
    return { className, status: 'missing' as const, reason: 'not-detected' as const }
  })
  const entries = (input.stylesheets.entries ?? []).map((entry) => ({
    ...entry,
    dependencies: sorted(entry.dependencies),
    sourceDependencies: sorted(entry.sourceDependencies)
  }))
  const stylesheetErrors = input.stylesheets.errors ?? []
  const present = missingResults.filter(({ status }) => status === 'present')
  const missing = missingResults.filter(({ status }) => status === 'missing')
  const diagnostics: MasterCSSInspectionReport['diagnostics'] = [
    ...entries.flatMap((entry) => entry.warnings.map((warning) => ({
      code: 'stylesheet-warning' as const,
      severity: 'warning' as const,
      message: warning,
      source: 'Master CSS' as const,
      sourceKind: 'stylesheet' as const,
      filePath: entry.filePath
    }))),
    ...stylesheetErrors.map((error) => ({
      code: 'stylesheet-error' as const,
      severity: 'error' as const,
      message: error.message,
      source: 'Master CSS' as const,
      sourceKind: 'stylesheet' as const,
      filePath: error.filePath
    })),
    ...invalid.map((className) => ({
      code: 'invalid-scanner-class' as const,
      severity: 'warning' as const,
      message: `Scanner candidate "${className}" did not generate Master CSS rules.`,
      source: 'Master CSS' as const,
      sourceKind: 'scanner' as const,
      filePath: input.firstSourceByClass?.[className],
      data: { className }
    })),
    ...missing.map((result) => ({
      code: 'missing-css' as const,
      severity: 'error' as const,
      message: `No generated CSS found for "${result.className}" (${result.reason}).`,
      source: 'Master CSS' as const,
      sourceKind: 'missing-css' as const,
      data: result
    }))
  ]
  const files = input.files.map((file) => ({
    ...file,
    discovered: {
      latent: sorted(file.discovered.latent),
      valid: sorted(file.discovered.valid),
      invalid: sorted(file.discovered.invalid),
      usedNative: sorted(file.discovered.usedNative)
    }
  }))
  const cssText = input.css.text ?? ''
  const errors = diagnostics.filter(({ severity }) => severity === 'error').length
  const warnings = diagnostics.length - errors
  return {
    version: 1,
    cwd: input.cwd,
    inputs: {
      patterns: input.patterns,
      files: files.map(({ filePath }) => filePath),
      classes: input.classes
    },
    scanner: {
      counts: {
        latent: latent.length,
        valid: valid.length,
        invalid: invalid.length,
        native: native.length,
        usedNative: usedNative.length,
        safelist: input.scanner.safelistCount ?? 0,
        blocklist: input.scanner.blocklistCount ?? 0
      },
      classes: {
        latent,
        valid,
        invalid,
        native,
        usedNative,
        safelist,
        blocklist: input.scanner.blocklist ?? []
      },
      resetDependencies: sorted(input.scanner.resetDependencies)
    },
    stylesheets: {
      entries,
      dependencies: sorted(entries.flatMap(({ dependencies }) => dependencies)),
      warnings: sorted(input.stylesheets.warnings),
      errors: stylesheetErrors
    },
    css: {
      bytes: cssText.length,
      included: Boolean(input.css.included),
      ...(input.css.included ? { text: cssText } : {}),
      emittedGlobals: {
        variables: new Set(input.css.variables).size,
        animations: new Set(input.css.animations).size
      }
    },
    missingCSS: {
      checked: input.classes,
      present,
      missing
    },
    files,
    diagnostics,
    summary: {
      files: files.length,
      stylesheets: entries.length,
      diagnostics: diagnostics.length,
      errors,
      warnings,
      missingCSS: missing.length,
      invalidClasses: invalid.length
    }
  }
}
