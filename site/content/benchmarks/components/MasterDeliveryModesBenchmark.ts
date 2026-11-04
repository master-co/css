import snapshot from '~/site/.generated/benchmarks/master-delivery-modes.json'
import type {
  BenchmarkBarItem,
  BenchmarkChartModel,
  BenchmarkColor,
  BenchmarkMetric,
  BenchmarkSegment,
  BenchmarkStackedBarItem
} from '@master/internal-site/benchmarks/types.ts'

type ModeId = 'master-static' | 'master-runtime' | 'master-progressive' | 'tailwind-static'
type TimingMetricId =
  | 'navigationReadyMs'
  | 'styleRecalculationMs'
  | 'layoutMs'
  | 'paintMs'
  | 'runtimeBootstrapMs'
  | 'runtimeObserveMs'

type ByteSummary = {
  rawBytes: number
  gzipBytes: number
  brotliBytes: number
}

type SummaryStats = {
  min: number
  median: number
  mean: number
  max: number
  sampleCount: number
  unit: string
}

type DeliveryModeResult = {
  variantId: string
  payload: {
    html: ByteSummary
    externalCSS: ByteSummary
    inlineCSS: ByteSummary
    runtimeJS: ByteSummary
    runtimeProgram: ByteSummary
    hydrationManifest: ByteSummary
  }
  structure: {
    styleRules: number
    selectors: number
    declarations: number
  }
  timing: {
    navigationReadyMs: SummaryStats
    stylesheetParseMs: SummaryStats
    styleRecalculationMs: SummaryStats
    layoutMs: SummaryStats
    paintMs: SummaryStats
    longTaskCount: SummaryStats
    requestCount: SummaryStats
    runtimeReadyMs: SummaryStats
    runtimeBootstrapMs: SummaryStats
    programLoadMs: SummaryStats
    runtimeObserveMs: SummaryStats
    progressiveAdopted: SummaryStats
    runtimeGeneratedRuleCount: SummaryStats
    runtimeStyleRawBytes: SummaryStats
  }
}

type DeliveryModeFixtureResult = {
  fixtureId: string
  modes: Record<ModeId, DeliveryModeResult>
}

type DeliveryModeDescriptor = {
  id: ModeId
  label: string
  family: string
}

type FixtureDescriptor = {
  id: string
  name: string
  purpose: string
}

const primaryFixtureId = 'docs'
const browser = (snapshot as { browser?: { name: string; version: string } }).browser
const fixtures = snapshot.fixtures as FixtureDescriptor[]
const modes = snapshot.modes as DeliveryModeDescriptor[]
const results = snapshot.results as DeliveryModeFixtureResult[]
const modeColors: Record<ModeId, BenchmarkColor> = {
  'master-static': 'yellow',
  'master-runtime': 'blue',
  'master-progressive': 'green',
  'tailwind-static': 'cyan'
}
// Embedded CSS and hydration JSON are already part of the complete HTML response.
const responseSegments = [
  {
    id: 'html',
    label: 'HTML',
    color: 'blue'
  },
  {
    id: 'externalCSS',
    label: 'External CSS',
    color: 'cyan'
  },
  {
    id: 'runtimeJS',
    label: 'Runtime JS',
    color: 'violet'
  },
  {
    id: 'runtimeProgram',
    label: 'Runtime program',
    color: 'yellow'
  }
] satisfies { id: keyof DeliveryModeResult['payload']; label: string; color: BenchmarkColor }[]
const loadMetricLabels: Record<TimingMetricId, string> = {
  navigationReadyMs: 'Navigation to ready',
  styleRecalculationMs: 'Style recalculation',
  layoutMs: 'Layout',
  paintMs: 'Paint',
  runtimeBootstrapMs: 'Runtime bootstrap',
  runtimeObserveMs: 'Runtime observe'
}

function getPrimaryResult() {
  const result = results.find((candidate) => candidate.fixtureId === primaryFixtureId)
  if (!result) throw new Error(`Missing delivery mode benchmark fixture result: ${primaryFixtureId}`)
  return result
}

function getFixtureName(fixtureId: string) {
  return fixtures.find((fixture) => fixture.id === fixtureId)?.name ?? fixtureId
}

function getModeLabel(modeId: ModeId) {
  return modes.find((mode) => mode.id === modeId)?.label ?? modeId
}

function formatBytes(bytes: number) {
  return `${formatNumber(bytes / 1000, 1)} kB`
}

function formatMilliseconds(value: number) {
  return `${formatNumber(value, value >= 10 ? 1 : 2)} ms`
}

function formatCount(value: number) {
  return Math.round(value).toLocaleString('en-US')
}

function formatNumber(value: number, maximumFractionDigits: number) {
  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits
  }).format(value)
}

function getResponseTotal(payload: DeliveryModeResult['payload'], kind: keyof ByteSummary = 'brotliBytes') {
  return responseSegments.reduce((total, { id }) => total + (payload[id].rawBytes > 0 ? payload[id][kind] : 0), 0)
}

function createSummaryMetrics(): BenchmarkMetric[] {
  const primaryResult = getPrimaryResult()
  const sampleCount = primaryResult.modes['master-static'].timing.navigationReadyMs.sampleCount
  const progressiveAdoptedCount = results.filter((result) => result.modes['master-progressive'].timing.progressiveAdopted.median === 1).length

  return [
    {
      label: 'Fixtures',
      value: results.length,
      detail: 'static fixture set measured across every delivery mode',
      tone: 'neutral'
    },
    {
      label: 'Modes',
      value: modes.length,
      detail: 'Master static, runtime, progressive, and Tailwind static',
      tone: 'neutral'
    },
    {
      label: 'Browser',
      value: browser ? `${browser.name} ${browser.version}` : 'Chromium',
      detail: 'headless browser used for local trace measurements',
      tone: 'neutral'
    },
    {
      label: 'Trace samples',
      value: sampleCount,
      detail: 'measured browser rounds per variant',
      tone: 'neutral'
    },
    {
      label: 'Progressive adoption',
      value: `${progressiveAdoptedCount}/${results.length}`,
      detail: 'fixtures where progressive runtime adopted server-rendered CSS',
      tone: progressiveAdoptedCount === results.length ? 'good' : 'warn'
    }
  ]
}

function createPayloadItems(result = getPrimaryResult()): BenchmarkStackedBarItem[] {
  return modes.map((mode) => {
    const modeResult = result.modes[mode.id]
    const segments = responseSegments
      .filter(segment => modeResult.payload[segment.id].rawBytes > 0)
      .map((segment): BenchmarkSegment => {
        const value = modeResult.payload[segment.id].brotliBytes
        return {
          id: `${mode.id}-${segment.id}`,
          label: segment.label,
          value,
          valueLabel: formatBytes(value),
          color: segment.color
        }
      })
      .filter((segment) => segment.value > 0)

    return {
      id: `${result.fixtureId}-${mode.id}-payload`,
      label: mode.label,
      segments,
      total: getResponseTotal(modeResult.payload),
      detail: `${formatCount(modeResult.timing.requestCount.median)} requests`
    }
  })
}

function createTimingItems(metricId: TimingMetricId, modeIds: ModeId[] = modes.map((mode) => mode.id)): BenchmarkBarItem[] {
  const result = getPrimaryResult()

  return modeIds.map((modeId) => {
    const modeResult = result.modes[modeId]
    const metric = modeResult.timing[metricId]

    return {
      id: `${result.fixtureId}-${modeId}-${metricId}`,
      label: getModeLabel(modeId),
      value: metric.median,
      valueLabel: formatMilliseconds(metric.median),
      detail: metric.sampleCount ? `${metric.sampleCount} samples` : undefined,
      color: modeColors[modeId]
    }
  })
}

function createTimingGroups(metricIds: TimingMetricId[], modeIds?: ModeId[]) {
  return metricIds.map((metricId) => ({
    title: loadMetricLabels[metricId],
    detail: 'Median',
    items: createTimingItems(metricId, modeIds),
    unit: 'ms'
  }))
}

export const MasterDeliveryModesSummary: BenchmarkChartModel = {
  kind: 'metric-table',
  label: 'Master CSS delivery modes metrics',
  metrics: createSummaryMetrics()
}

const payloadItems = createPayloadItems()

export const MasterDeliveryPayloadChart = {
  kind: 'stacked-bars',
  items: payloadItems,
  max: Math.max(0, ...payloadItems.map(item => item.total ?? 0)),
  valueFormatter: formatBytes
} satisfies BenchmarkChartModel

export const MasterDeliveryLoadChart: BenchmarkChartModel = {
  kind: 'chart-groups',
  groups: createTimingGroups(['navigationReadyMs', 'styleRecalculationMs', 'layoutMs', 'paintMs'])
}

export const MasterDeliveryRuntimeChart: BenchmarkChartModel = {
  kind: 'chart-groups',
  groups: createTimingGroups(['runtimeBootstrapMs', 'runtimeObserveMs'], ['master-runtime', 'master-progressive'])
}

export const MasterDeliveryModesTables: BenchmarkChartModel = {
  kind: 'data-table',
  label: 'Master CSS delivery modes results',
  numericFrom: 3,
  headers: ['Fixture', 'Mode', 'Response assets', 'HTML', 'External CSS', 'Inline CSS (in HTML)', 'Runtime JS', 'Runtime program', 'Hydration (in HTML)', 'Rules', 'Declarations', 'Navigation ready', 'Style recalc', 'Layout', 'Paint', 'Runtime bootstrap', 'Runtime observe', 'Progressive adopted'],
  rows: results.flatMap((result) => modes.map((mode) => {
    const modeResult = result.modes[mode.id]

    return [
      getFixtureName(result.fixtureId),
      mode.label,
      formatBytes(getResponseTotal(modeResult.payload)),
      formatBytes(modeResult.payload.html.brotliBytes),
      formatBytes(modeResult.payload.externalCSS.brotliBytes),
      formatBytes(modeResult.payload.inlineCSS.brotliBytes),
      formatBytes(modeResult.payload.runtimeJS.brotliBytes),
      formatBytes(modeResult.payload.runtimeProgram.brotliBytes),
      formatBytes(modeResult.payload.hydrationManifest.brotliBytes),
      formatCount(modeResult.structure.styleRules),
      formatCount(modeResult.structure.declarations),
      formatMilliseconds(modeResult.timing.navigationReadyMs.median),
      formatMilliseconds(modeResult.timing.styleRecalculationMs.median),
      formatMilliseconds(modeResult.timing.layoutMs.median),
      formatMilliseconds(modeResult.timing.paintMs.median),
      formatMilliseconds(modeResult.timing.runtimeBootstrapMs.median),
      formatMilliseconds(modeResult.timing.runtimeObserveMs.median),
      formatCount(modeResult.timing.progressiveAdopted.median)
    ]
  }))
}
