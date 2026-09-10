import type { BenchmarkMetric } from './types'

const timings = {
  'scanner-init-ms': 'Initialize the public scanner with the existing preset manifest.',
  'css-entry-discovery-ms': 'Discover CSS entry paths through the public project API.',
  'css-entry-read-ms': 'Read the discovered CSS entry files from disk.',
  'stylesheet-registration-ms': 'Register those entries through the public stylesheet collection; includes its compilation/import work.',
  'source-glob-ms': 'Resolve the explicit index.html fixture source glob.',
  'source-read-ms': 'Read the selected source files from disk.',
  'source-scan-ms': 'Complete the public scanner calls for those source files.',
  'scanner-class-collection-ms': 'Read scanner state and collect its unique latent/valid/used-native/safelist candidates.',
  'baseline-compose-ms': 'First full public compose after registration and scanning, used as the output correctness baseline.',
  'diagnostic-compose-ms': 'Repeated full public compose on the same setup; must match the baseline CSS exactly.',
  'generated-only-compose-ms': 'Separate full public compose with native/base CSS excluded; not an internal engine phase.',
  'native-only-compose-ms': 'Separate full public compose with generated CSS excluded; not an internal native collection phase.',
  'public-pipeline-total-ms': 'Scanner initialization through all four compose operations and their bookkeeping; excludes fixture preparation, object construction, disposal, compression and artifact writes.'
} as const

const counts = {
  'css-entry-count': 'Discovered CSS entry paths.',
  'source-file-count': 'Explicit fixture sources whose read and scan completed.',
  'latent-class-count': 'Scanner latent classes before composition.',
  'valid-class-count': 'Scanner valid classes before composition.',
  'native-class-name-count': 'Registered scanner native class names before composition.',
  'used-native-class-count': 'Scanner used native classes before composition.',
  'scanner-class-candidate-count': 'Unique latent/valid/used-native/safelist candidates; not the number of generated rules.',
  'registered-stylesheet-count': 'Registered collection source count; not a count of nonempty native CSS strings.'
} as const

export const stylesheetDiagnosticMetrics: BenchmarkMetric[] = [
  ...Object.entries(timings).map(([id, description]): BenchmarkMetric => ({ id, label: id, unit: 'ms', description })),
  ...Object.entries(counts).map(([id, description]): BenchmarkMetric => ({ id, label: id, unit: 'count', description })),
  ...['final', 'generated', 'native-only'].flatMap(mode => ['raw', 'gzip', 'brotli'].map(compression => ({
    id: `${mode}-css-${compression}-bytes`, label: `${mode} CSS ${compression} bytes`, unit: 'B' as const,
    description: `Bytes of the separately composed ${mode} CSS result (${compression}); mode outputs are not guaranteed to partition final CSS.`
  })))
]
export const stylesheetDiagnosticMetricIds = stylesheetDiagnosticMetrics.map(metric => metric.id)
export const stylesheetDiagnosticLimits = [
  'Only public scanner/project/stylesheet call boundaries are measured. Rust lowering, manifest internals and legacy package-shortcut phases are not independently observable here and have no fabricated samples.',
  'The old unobserved lower/manifest/import/serialization/assembly declarations and incorrectly named engine metrics are retired, not silently filled with zero.',
  'The first full compose is a correctness baseline; the second uses the same potentially warmed state. Generated-only and native-only operations are separate full compose calls, not a decomposition of one render.',
  'Public pipeline total includes its measured operations and benchmark overhead. Do not sum that total with its stages or compare revised metric IDs to historical internal-phase claims.',
  'All final CSS must match the baseline SHA-256 and fixture markers before a report is emitted. Generated-only/native-only outputs are separate artifacts, not universally additive CSS partitions.'
]
