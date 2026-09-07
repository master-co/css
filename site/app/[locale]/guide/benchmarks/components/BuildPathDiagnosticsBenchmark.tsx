import snapshot from '~/site/../benchmarks/build-path-diagnostics/snapshot.json'
import { BenchmarkBars, BenchmarkMetricTable, type BenchmarkBarItem, type BenchmarkColor, type BenchmarkMetric } from '~/site/components/benchmarks'
import ExpandContent from 'internal/components/ExpandContent'

type SummaryStats = {
  min: number
  median: number
  mean: number
  max: number
  sampleCount: number
  unit: string
}

type MetricGroup = {
  variantId: string
  metrics: Record<string, SummaryStats>
}

type BuildPathResult = {
  fixtureId: string
  cli: {
    startup: MetricGroup
    build: MetricGroup
  }
  vite: {
    startup: MetricGroup
    build: MetricGroup
  }
  compiler: MetricGroup
  extraction: MetricGroup
}

type FixtureDescriptor = {
  id: string
  name: string
  purpose: string
}

const primaryFixtureId = 'docs'
const results = snapshot.results as BuildPathResult[]
const fixtures = snapshot.fixtures as FixtureDescriptor[]
const sourceReports = snapshot.sourceReports as { suite: string; generatedAt: string; command: string }[]
const environment = snapshot.environment as {
  os: { platform: string; release: string; arch: string }
  node: string
  cpu: { model: string; count: number }
}

function getPrimaryResult() {
  const result = results.find((candidate) => candidate.fixtureId === primaryFixtureId)
  if (!result) throw new Error(`Missing build-path diagnostics result: ${primaryFixtureId}`)
  return result
}

function getFixtureName(fixtureId: string) {
  return fixtures.find((fixture) => fixture.id === fixtureId)?.name ?? fixtureId
}

function getMetric(group: MetricGroup, metricId: string) {
  const metric = group.metrics[metricId]
  if (!metric) throw new Error(`Missing build-path metric ${metricId} for ${group.variantId}.`)
  return metric
}

function formatMilliseconds(value: number) {
  return `${formatNumber(value, value >= 10 ? 1 : 2)} ms`
}

function formatBytes(bytes: number) {
  return `${formatNumber(bytes / 1000, 1)} kB`
}

function formatNumber(value: number, maximumFractionDigits: number) {
  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits
  }).format(value)
}

function formatMetric(metric: SummaryStats) {
  if (metric.unit === 'ms') return formatMilliseconds(metric.median)
  if (metric.unit === 'B') return formatBytes(metric.median)
  return Math.round(metric.median).toLocaleString('en-US')
}

function createSummaryMetrics(): BenchmarkMetric[] {
  const primary = getPrimaryResult()
  const cliCommand = getMetric(primary.cli.startup, 'cli-command-elapsed-ms')
  const cliExtraction = getMetric(primary.cli.build, 'cli-css-extraction-ms')
  const viteOverhead = getMetric(primary.vite.startup, 'vite-master-command-overhead-ms')
  const viteScannerInit = getMetric(primary.vite.startup, 'vite-master-scanner-init-ms')
  const compilerTotal = getMetric(primary.compiler, 'diagnostic-compiler-total-ms')
  const extractionTotal = getMetric(primary.extraction, 'diagnostic-extraction-total-ms')

  return [
    {
      label: 'Fixtures',
      value: results.length,
      detail: 'minimal, docs, dashboard, and stress-css diagnostic fixtures',
      tone: 'neutral'
    },
    {
      label: 'Source reports',
      value: sourceReports.length,
      detail: 'startup, build, compiler, and extraction diagnostics',
      tone: 'neutral'
    },
    {
      label: 'Environment',
      value: `${environment.cpu.model}, ${environment.node}`,
      detail: `${environment.os.platform} ${environment.os.release} ${environment.os.arch}, ${environment.cpu.count} CPUs`,
      tone: 'neutral'
    },
    {
      label: 'CLI command vs extraction',
      value: `${formatMetric(cliCommand)} / ${formatMetric(cliExtraction)}`,
      detail: '`docs` fixture full command envelope versus CLI CSS extraction',
      tone: cliCommand.median > cliExtraction.median * 5 ? 'warn' : 'neutral'
    },
    {
      label: 'Vite overhead vs scanner init',
      value: `${formatMetric(viteOverhead)} / ${formatMetric(viteScannerInit)}`,
      detail: '`docs` fixture Master Vite command overhead versus scanner init',
      tone: viteOverhead.median > viteScannerInit.median * 5 ? 'warn' : 'neutral'
    },
    {
      label: 'Compiler and extraction',
      value: `${formatMetric(compilerTotal)} / ${formatMetric(extractionTotal)}`,
      detail: '`docs` fixture diagnostic compiler total and diagnostic extraction total',
      tone: 'neutral'
    }
  ]
}

function createCLIItems(result = getPrimaryResult()): BenchmarkBarItem[] {
  return [
    createItem('cli-command', 'Full CLI command', result.cli.startup, 'cli-command-elapsed-ms', 'blue'),
    createItem('cli-probe', 'CLI startup probe', result.cli.startup, 'cli-probe-command-elapsed-ms', 'cyan'),
    createItem('scanner-import', 'Scanner import probe', result.cli.startup, 'cli-scanner-import-ms', 'yellow'),
    createItem('source-scan', 'Source scan', result.cli.build, 'cli-source-scan-ms', 'green'),
    createItem('css-extraction', 'CSS extraction', result.cli.build, 'cli-css-extraction-ms', 'red')
  ]
}

function createViteItems(result = getPrimaryResult()): BenchmarkBarItem[] {
  return [
    createItem('vite-overhead', 'Master Vite command overhead', result.vite.startup, 'vite-master-command-overhead-ms', 'blue'),
    createItem('vite-import', '@master/css-vite import probe', result.vite.startup, 'master-vite-import-ms', 'cyan'),
    createItem('vite-core-import', 'Vite core module import probe', result.vite.startup, 'master-vite-core-module-import-ms', 'yellow'),
    createItem('vite-scanner-init', 'Vite scanner init', result.vite.startup, 'vite-master-scanner-init-ms', 'green'),
    createItem('vite-bundle-extraction', 'Vite bundle CSS extraction', result.vite.build, 'vite-master-generate-bundle-ms', 'red')
  ]
}

function createCompilerItems(result = getPrimaryResult()): BenchmarkBarItem[] {
  return [
    createItem('production-create-extracted-css', 'Production createExtractedCSS', result.compiler, 'production-create-extracted-css-ms', 'blue'),
    createItem('compiler-total', 'Diagnostic compiler total', result.compiler, 'diagnostic-compiler-total-ms', 'cyan'),
    createItem('render-compiled-css', 'Render compiled CSS', result.compiler, 'render-compiled-css-ms', 'yellow'),
    createItem('extraction-total', 'Diagnostic extraction total', result.extraction, 'diagnostic-extraction-total-ms', 'green'),
    createItem('rule-generation', 'Engine rule generation', result.extraction, 'engine-rule-generation-ms', 'red')
  ]
}

function createItem(id: string, label: string, group: MetricGroup, metricId: string, color: BenchmarkColor): BenchmarkBarItem {
  const metric = getMetric(group, metricId)
  return {
    id,
    label,
    value: metric.median,
    valueLabel: formatMetric(metric),
    detail: `${metric.sampleCount} samples`,
    color
  }
}

function MetricChart(props: {
  title: string
  detail: string
  items: BenchmarkBarItem[]
}) {
  return (
    <div className="grid gap:sm">
      <div className="flex items-baseline justify-between gap:md">
        <h4 className="m:0 font-weight:460 font:sm text:strong">{props.title}</h4>
        <span className="font:xs text:muted">{props.detail}</span>
      </div>
      <BenchmarkBars items={props.items} unit="ms" />
    </div>
  )
}

export function BuildPathDiagnosticsSummary() {
  return <BenchmarkMetricTable metrics={createSummaryMetrics()} />
}

export function BuildPathDiagnosticsCharts() {
  return (
    <div className="grid gap:lg">
      <MetricChart
        title="CLI path"
        detail="Docs fixture medians"
        items={createCLIItems()} />
      <MetricChart
        title="Vite path"
        detail="Docs fixture medians"
        items={createViteItems()} />
      <MetricChart
        title="Compiler and extraction"
        detail="Docs fixture medians"
        items={createCompilerItems()} />
    </div>
  )
}

export function BuildPathDiagnosticsTable() {
  return (
    <ExpandContent>
      <div className="doc-table">
        <table>
          <thead>
            <tr>
              <th>Fixture</th>
              <th>CLI command</th>
              <th>CLI extraction</th>
              <th>Vite overhead</th>
              <th>Vite import</th>
              <th>Vite scanner</th>
              <th>Compiler total</th>
              <th>Extraction total</th>
              <th>Final CSS</th>
            </tr>
          </thead>
          <tbody>
            {results.map((result) => (
              <tr key={result.fixtureId}>
                <th>{getFixtureName(result.fixtureId)}</th>
                <td>{formatMetric(getMetric(result.cli.startup, 'cli-command-elapsed-ms'))}</td>
                <td>{formatMetric(getMetric(result.cli.build, 'cli-css-extraction-ms'))}</td>
                <td>{formatMetric(getMetric(result.vite.startup, 'vite-master-command-overhead-ms'))}</td>
                <td>{formatMetric(getMetric(result.vite.startup, 'master-vite-import-ms'))}</td>
                <td>{formatMetric(getMetric(result.vite.startup, 'vite-master-scanner-init-ms'))}</td>
                <td>{formatMetric(getMetric(result.compiler, 'diagnostic-compiler-total-ms'))}</td>
                <td>{formatMetric(getMetric(result.extraction, 'diagnostic-extraction-total-ms'))}</td>
                <td>{formatMetric(getMetric(result.compiler, 'final-css-raw-bytes'))}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </ExpandContent>
  )
}
