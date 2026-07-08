import snapshot from '~/site/../benchmarks/browser-lifecycle/snapshot.json'
import evidence from '~/site/../benchmarks/browser-lifecycle/long-session-evidence.json'
import { BenchmarkBars, BenchmarkMetricTable, type BenchmarkBarItem, type BenchmarkColor, type BenchmarkMetric } from '~/site/components/benchmarks'
import ExpandContent from 'internal/components/ExpandContent'

type ModeId = 'master-static' | 'master-runtime' | 'master-progressive' | 'tailwind-static'
type ChartMetricId =
  | 'styleRecalculationMs'
  | 'layoutMs'
  | 'paintMs'
  | 'longTaskCount'
  | 'cssomRuleCount'
  | 'runtimeMutationMs'

type SummaryStats = {
  min: number
  median: number
  mean: number
  max: number
  sampleCount: number
  unit: string
}

type LifecycleVariantSummary = {
  variantId: string
  modeId: ModeId
  scenarioId: string
  metrics: Record<string, SummaryStats>
  correctness: {
    computedStyleValid: SummaryStats
    progressiveAdopted: SummaryStats
  }
}

type ModeDescriptor = {
  id: ModeId
  label: string
  family: string
}

type BrowserLifecycleEvidence = {
  browser?: {
    name: string
    version: string
  }
  modes: ModeDescriptor[]
  scenarios: { id: string; label: string }[]
  sourceReports: { modeId: ModeId; generatedAt: string }[]
  variantSummaries: LifecycleVariantSummary[]
}

const lifecycleEvidence = evidence as BrowserLifecycleEvidence
const browser = lifecycleEvidence.browser ?? (snapshot as { browser?: { name: string; version: string } }).browser
const modes = lifecycleEvidence.modes
const evidenceVariants = lifecycleEvidence.variantSummaries
const snapshotVariants = snapshot.variants as unknown[]
const snapshotScenarios = snapshot.scenarios as { id: string }[]
const snapshotModes = snapshot.modes as { id: string }[]
const modeColors: Record<ModeId, BenchmarkColor> = {
  'master-static': 'yellow',
  'master-runtime': 'blue',
  'master-progressive': 'green',
  'tailwind-static': 'cyan'
}
const chartMetricLabels: Record<ChartMetricId, string> = {
  styleRecalculationMs: 'Style recalculation',
  layoutMs: 'Layout',
  paintMs: 'Paint',
  longTaskCount: 'Long tasks',
  cssomRuleCount: 'CSSOM rules',
  runtimeMutationMs: 'Runtime mutation work'
}

function getModeLabel(modeId: ModeId) {
  return modes.find((mode) => mode.id === modeId)?.label ?? modeId
}

function getMetric(variant: LifecycleVariantSummary, metricId: string) {
  const metric = variant.metrics[metricId]
  if (!metric) throw new Error(`Missing browser lifecycle evidence metric ${metricId} for ${variant.variantId}.`)
  return metric
}

function formatMilliseconds(value: number) {
  return `${formatNumber(value, value >= 10 ? 1 : 2)} ms`
}

function formatBytes(bytes: number) {
  return `${formatNumber(bytes / 1000, 1)} kB`
}

function formatCount(value: number) {
  return Math.round(value).toLocaleString('en-US')
}

function formatNumber(value: number, maximumFractionDigits: number) {
  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits
  }).format(value)
}

function formatMetric(metric: SummaryStats) {
  if (metric.unit === 'ms') return formatMilliseconds(metric.median)
  if (metric.unit === 'B') return formatBytes(metric.median)
  return formatCount(metric.median)
}

function createSummaryMetrics(): BenchmarkMetric[] {
  const sampleCounts = [...new Set(evidenceVariants.map((variant) => getMetric(variant, 'inp-style-interaction-ms').sampleCount))]
  const computedValidCount = evidenceVariants.filter((variant) => variant.correctness.computedStyleValid.median === 1).length
  const progressiveAdopted = evidenceVariants.find((variant) => variant.modeId === 'master-progressive')?.correctness.progressiveAdopted.median === 1

  return [
    {
      label: 'Snapshot variants',
      value: snapshotVariants.length,
      detail: `${snapshotScenarios.length} scenarios across ${snapshotModes.length} modes`,
      tone: 'neutral'
    },
    {
      label: 'Evidence modes',
      value: `${evidenceVariants.length}/${modes.length}`,
      detail: 'segmented five-minute long-session reports',
      tone: evidenceVariants.length === modes.length ? 'good' : 'warn'
    },
    {
      label: 'Browser',
      value: browser ? `${browser.name} ${browser.version}` : 'Chromium',
      detail: 'headless browser used for local trace measurements',
      tone: 'neutral'
    },
    {
      label: 'Long-session samples',
      value: sampleCounts.join(', '),
      detail: 'measured five-minute rounds per mode in committed evidence',
      tone: sampleCounts.length === 1 && sampleCounts[0] === 1 ? 'neutral' : 'warn'
    },
    {
      label: 'Computed style checks',
      value: `${computedValidCount}/${evidenceVariants.length}`,
      detail: 'five-minute evidence variants with computed-style-valid = 1',
      tone: computedValidCount === evidenceVariants.length ? 'good' : 'warn'
    },
    {
      label: 'Progressive adoption',
      value: progressiveAdopted ? '1/1' : '0/1',
      detail: 'Master progressive long-session evidence variant',
      tone: progressiveAdopted ? 'good' : 'warn'
    }
  ]
}

function createChartItems(metricId: ChartMetricId): BenchmarkBarItem[] {
  const sourceMetricId = toSourceMetricId(metricId)
  return evidenceVariants.map((variant) => {
    const metric = getMetric(variant, sourceMetricId)

    return {
      id: `${variant.variantId}-${metricId}`,
      label: getModeLabel(variant.modeId),
      value: metric.median,
      valueLabel: formatMetric(metric),
      detail: metricId === 'runtimeMutationMs'
        ? `${formatCount(getMetric(variant, 'runtime-generated-rule-count').median)} rules`
        : undefined,
      color: modeColors[variant.modeId]
    }
  })
}

function toSourceMetricId(metricId: ChartMetricId) {
  if (metricId === 'styleRecalculationMs') return 'style-recalculation-ms'
  if (metricId === 'layoutMs') return 'layout-ms'
  if (metricId === 'paintMs') return 'paint-ms'
  if (metricId === 'longTaskCount') return 'long-task-count'
  if (metricId === 'cssomRuleCount') return 'cssom-rule-count'
  return 'runtime-mutation-ms'
}

function LifecycleChart(props: {
  metricId: ChartMetricId
}) {
  const unit = props.metricId === 'cssomRuleCount' || props.metricId === 'longTaskCount' ? 'count' : 'ms'

  return (
    <div className="grid gap:sm">
      <div className="flex items-baseline justify-between gap:md">
        <h4 className="m:0 font-weight:460 font:sm text:strong">{chartMetricLabels[props.metricId]}</h4>
        <span className="font:xs text:muted">Five-minute median</span>
      </div>
      <BenchmarkBars items={createChartItems(props.metricId)} unit={unit} />
    </div>
  )
}

export function BrowserLifecycleSummary() {
  return <BenchmarkMetricTable metrics={createSummaryMetrics()} />
}

export function BrowserLifecycleLongSessionCharts() {
  return (
    <div className="grid gap:lg">
      {([
        'styleRecalculationMs',
        'layoutMs',
        'paintMs',
        'longTaskCount',
        'cssomRuleCount',
        'runtimeMutationMs'
      ] satisfies ChartMetricId[]).map((metricId) => (
        <LifecycleChart key={metricId} metricId={metricId} />
      ))}
    </div>
  )
}

export function BrowserLifecycleLongSessionTable() {
  return (
    <ExpandContent>
      <div className="doc-table">
        <table>
          <thead>
            <tr>
              <th>Mode</th>
              <th>INP-style latency</th>
              <th>Style recalc</th>
              <th>Layout</th>
              <th>Paint</th>
              <th>Long tasks</th>
              <th>CSSOM rules</th>
              <th>Runtime rules</th>
              <th>Runtime mutation</th>
              <th>JS heap</th>
              <th>Computed style</th>
              <th>Progressive adopted</th>
              <th>Samples</th>
            </tr>
          </thead>
          <tbody>
            {evidenceVariants.map((variant) => (
              <tr key={variant.variantId}>
                <th>{getModeLabel(variant.modeId)}</th>
                <td>{formatMetric(getMetric(variant, 'inp-style-interaction-ms'))}</td>
                <td>{formatMetric(getMetric(variant, 'style-recalculation-ms'))}</td>
                <td>{formatMetric(getMetric(variant, 'layout-ms'))}</td>
                <td>{formatMetric(getMetric(variant, 'paint-ms'))}</td>
                <td>{formatMetric(getMetric(variant, 'long-task-count'))}</td>
                <td>{formatMetric(getMetric(variant, 'cssom-rule-count'))}</td>
                <td>{formatMetric(getMetric(variant, 'runtime-generated-rule-count'))}</td>
                <td>{formatMetric(getMetric(variant, 'runtime-mutation-ms'))}</td>
                <td>{formatMetric(getMetric(variant, 'js-heap-used-bytes'))}</td>
                <td>{formatMetric(variant.correctness.computedStyleValid)}</td>
                <td>{formatMetric(variant.correctness.progressiveAdopted)}</td>
                <td>{getMetric(variant, 'inp-style-interaction-ms').sampleCount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </ExpandContent>
  )
}
