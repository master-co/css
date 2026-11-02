import snapshot from '~/site/.generated/benchmarks/browser-css-cost.json'
import type { BenchmarkBarItem, BenchmarkChartModel, BenchmarkColor, BenchmarkMetric } from '@master/internal-site/benchmarks/types.ts'

type CacheMode = 'cold-cache' | 'warm-cache'
type TraceMetricId = 'styleRecalculationMs' | 'layoutMs' | 'paintMs'

type SummaryStats = {
  min: number
  median: number
  mean: number
  max: number
  sampleCount: number
  unit: string
}

type BrowserCostResult = {
  variantId: string
  timing: {
    navigationReadyMs: SummaryStats
    stylesheetParseMs: SummaryStats
    styleRecalculationMs: SummaryStats
    layoutMs: SummaryStats
    paintMs: SummaryStats
    longTaskCount: SummaryStats
  }
  dom: {
    itemCount: number
    nodeCount: SummaryStats
  }
  css: {
    rawBytes: number
    gzipBytes: number
    brotliBytes: number
  }
  structure: {
    styleRules: number
    selectors: number
    declarations: number
  }
}

type BrowserCostGroup = {
  id: string
  label: string
  results: Record<CacheMode, BrowserCostResult>
}

const primaryCacheMode = 'warm-cache' satisfies CacheMode
const browser = (snapshot as { browser?: { name: string; version: string } }).browser
const cssVolume = snapshot.cssVolume as BrowserCostGroup[]
const domScaling = snapshot.domScaling as BrowserCostGroup[]
const traceMetricLabels: Record<TraceMetricId, string> = {
  styleRecalculationMs: 'Style recalculation',
  layoutMs: 'Layout',
  paintMs: 'Paint'
}
const cssVolumeColors = ['blue', 'green', 'yellow', 'red'] satisfies BenchmarkColor[]
const domScalingColors = ['green', 'yellow', 'red'] satisfies BenchmarkColor[]

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

function formatCacheMode(cacheMode: CacheMode) {
  return cacheMode === 'warm-cache' ? 'Warm cache' : 'Cold cache'
}

function getWarmResult(group: BrowserCostGroup) {
  return group.results[primaryCacheMode]
}

function createSummaryMetrics(): BenchmarkMetric[] {
  const xlargeCSS = getWarmResult(cssVolume[cssVolume.length - 1])
  const largeDOM = getWarmResult(domScaling[domScaling.length - 1])
  const sampleCount = cssVolume[0] ? getWarmResult(cssVolume[0]).timing.styleRecalculationMs.sampleCount : 0

  return [
    {
      label: 'CSS levels',
      value: cssVolume.length,
      detail: 'fixed visible DOM while deterministic external CSS grows',
      tone: 'neutral'
    },
    {
      label: 'Largest CSS',
      value: formatBytes(xlargeCSS.css.brotliBytes),
      detail: `${formatCount(xlargeCSS.structure.declarations)} declarations in the warm-cache xlarge-css variant`,
      tone: 'neutral'
    },
    {
      label: 'DOM controls',
      value: domScaling.length,
      detail: 'fixed CSS while repeated DOM items grow',
      tone: 'neutral'
    },
    {
      label: 'Largest DOM',
      value: formatCount(largeDOM.dom.nodeCount.median),
      detail: 'measured DOM nodes in the warm-cache large-dom variant',
      tone: 'neutral'
    },
    {
      label: 'Browser',
      value: browser ? `${browser.name} ${browser.version}` : 'Chromium',
      detail: 'headless browser used for the committed trace snapshot',
      tone: 'neutral'
    },
    {
      label: 'Trace samples',
      value: sampleCount,
      detail: 'measured browser rounds per warm-cache variant',
      tone: 'neutral'
    }
  ]
}

function createCSSVolumeTraceItems(metricId: TraceMetricId): BenchmarkBarItem[] {
  return cssVolume.map((level, index) => {
    const result = getWarmResult(level)
    const metric = result.timing[metricId]

    return {
      id: `${level.id}-${metricId}`,
      label: level.label,
      value: metric.median,
      valueLabel: formatMilliseconds(metric.median),
      detail: `${formatBytes(result.css.brotliBytes)}, ${formatCount(result.structure.declarations)} decls`,
      color: cssVolumeColors[index % cssVolumeColors.length]
    }
  })
}

function createDOMScalingTraceItems(metricId: TraceMetricId): BenchmarkBarItem[] {
  return domScaling.map((scale, index) => {
    const result = getWarmResult(scale)
    const metric = result.timing[metricId]

    return {
      id: `${scale.id}-${metricId}`,
      label: scale.label,
      value: metric.median,
      valueLabel: formatMilliseconds(metric.median),
      detail: `${formatCount(result.dom.nodeCount.median)} nodes`,
      color: domScalingColors[index % domScalingColors.length]
    }
  })
}

function createRows(axis: string, group: BrowserCostGroup) {
  return (['cold-cache', 'warm-cache'] satisfies CacheMode[]).map((cacheMode) => {
    const result = group.results[cacheMode]

    return [
      axis,
      group.label,
      formatCacheMode(cacheMode),
      formatBytes(result.css.brotliBytes),
      formatCount(result.structure.styleRules),
      formatCount(result.structure.declarations),
      formatCount(result.dom.nodeCount.median),
      formatMilliseconds(result.timing.styleRecalculationMs.median),
      formatMilliseconds(result.timing.layoutMs.median),
      formatMilliseconds(result.timing.paintMs.median),
      result.timing.styleRecalculationMs.sampleCount
    ]
  })
}

export const BrowserCSSCostSummary: BenchmarkChartModel = {
  kind: 'metric-table',
  label: 'Browser CSS cost metrics',
  metrics: createSummaryMetrics()
}

export const BrowserCSSVolumeTraceChart: BenchmarkChartModel = {
  kind: 'chart-groups',
  groups: Object.entries(traceMetricLabels).map(([metricId, label]) => ({
    title: label,
    detail: 'Warm-cache median',
    items: createCSSVolumeTraceItems(metricId as TraceMetricId),
    unit: 'ms'
  }))
}

export const BrowserDOMScalingTraceChart: BenchmarkChartModel = {
  kind: 'chart-groups',
  groups: Object.entries(traceMetricLabels).map(([metricId, label]) => ({
    title: label,
    detail: 'Warm-cache median',
    items: createDOMScalingTraceItems(metricId as TraceMetricId),
    unit: 'ms'
  }))
}

export const BrowserCSSCostTables: BenchmarkChartModel = {
  kind: 'data-table',
  label: 'Browser CSS cost results',
  numericFrom: 4,
  headers: ['Axis', 'Variant', 'Cache', 'CSS brotli', 'Rules', 'Declarations', 'DOM nodes', 'Style recalc', 'Layout', 'Paint', 'Samples'],
  rows: [
    ...cssVolume.flatMap((level) => createRows('CSS volume', level)),
    ...domScaling.flatMap((scale) => createRows('DOM scaling', scale))
  ]
}
