import type { BenchmarkFixtureId, BenchmarkVariant } from './types'
import { runStylesheetDiagnostic, type StylesheetDiagnosticResult } from './stylesheet-diagnostic'
import { stylesheetDiagnosticMetricIds, stylesheetDiagnosticLimits } from './stylesheet-diagnostic-metrics'

export type ExtractionDiagnosticResult = StylesheetDiagnosticResult
export const extractionDiagnosticMetricIds = stylesheetDiagnosticMetricIds
export const runExtractionDiagnostic = runStylesheetDiagnostic

export function createExtractionDiagnosticVariantId(fixtureId: BenchmarkFixtureId) {
  return `${fixtureId}-master-static-extraction`
}

export function createExtractionDiagnosticVariants(fixtureIds: BenchmarkFixtureId[]): BenchmarkVariant[] {
  return fixtureIds.map(fixtureId => ({
    id: createExtractionDiagnosticVariantId(fixtureId), fixtureId, adapterId: 'master-static',
    label: `${fixtureId} / Master CSS extraction diagnostic`, limits: [...stylesheetDiagnosticLimits]
  }))
}
