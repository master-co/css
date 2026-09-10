import type { BenchmarkFixtureId, BenchmarkVariant } from './types'
import { runStylesheetDiagnostic, type StylesheetDiagnosticResult } from './stylesheet-diagnostic'
import { stylesheetDiagnosticMetricIds, stylesheetDiagnosticLimits } from './stylesheet-diagnostic-metrics'

export type CompilerDiagnosticResult = StylesheetDiagnosticResult
export const compilerDiagnosticMetricIds = stylesheetDiagnosticMetricIds
export const runCompilerDiagnostic = runStylesheetDiagnostic

export function createCompilerDiagnosticVariantId(fixtureId: BenchmarkFixtureId) {
  return `${fixtureId}-master-static-compiler`
}

export function createCompilerDiagnosticVariants(fixtureIds: BenchmarkFixtureId[]): BenchmarkVariant[] {
  return fixtureIds.map(fixtureId => ({
    id: createCompilerDiagnosticVariantId(fixtureId), fixtureId, adapterId: 'master-static',
    label: `${fixtureId} / Master CSS compiler diagnostic`, limits: [...stylesheetDiagnosticLimits]
  }))
}
