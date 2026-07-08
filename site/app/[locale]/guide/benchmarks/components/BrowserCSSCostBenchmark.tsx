import snapshot from '~/site/../benchmarks/browser-css-cost/snapshot.json'
import { BenchmarkBars, BenchmarkMetricTable, type BenchmarkBarItem, type BenchmarkColor, type BenchmarkMetric } from '~/site/components/benchmarks'
import ExpandContent from 'internal/components/ExpandContent'

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

function TraceMetricGroup(props: {
  title: string
  items: BenchmarkBarItem[]
}) {
  return (
    <div className="grid gap:sm">
      <div className="flex items-baseline justify-between gap:md">
        <h4 className="m:0 font-weight:460 font:sm text:strong">{props.title}</h4>
        <span className="font:xs text:muted">Warm-cache median</span>
      </div>
      <BenchmarkBars items={props.items} unit="ms" />
    </div>
  )
}

export function BrowserCSSCostSummary() {
  return <BenchmarkMetricTable metrics={createSummaryMetrics()} />
}

export function BrowserCSSVolumeTraceChart() {
  return (
    <div className="grid gap:lg">
      {Object.entries(traceMetricLabels).map(([metricId, label]) => (
        <TraceMetricGroup
          key={metricId}
          title={label}
          items={createCSSVolumeTraceItems(metricId as TraceMetricId)} />
      ))}
    </div>
  )
}

export function BrowserDOMScalingTraceChart() {
  return (
    <div className="grid gap:lg">
      {Object.entries(traceMetricLabels).map(([metricId, label]) => (
        <TraceMetricGroup
          key={metricId}
          title={label}
          items={createDOMScalingTraceItems(metricId as TraceMetricId)} />
      ))}
    </div>
  )
}

export function BrowserCSSCostTables() {
  return (
    <ExpandContent>
      <div className="doc-table">
        <table>
          <thead>
            <tr>
              <th>Axis</th>
              <th>Variant</th>
              <th>Cache</th>
              <th>CSS brotli</th>
              <th>Rules</th>
              <th>Declarations</th>
              <th>DOM nodes</th>
              <th>Style recalc</th>
              <th>Layout</th>
              <th>Paint</th>
              <th>Samples</th>
            </tr>
          </thead>
          <tbody>
            {[
              ...cssVolume.flatMap((level) => createRows('CSS volume', level)),
              ...domScaling.flatMap((scale) => createRows('DOM scaling', scale))
            ]}
          </tbody>
        </table>
      </div>
    </ExpandContent>
  )
}

function createRows(axis: string, group: BrowserCostGroup) {
  return (['cold-cache', 'warm-cache'] satisfies CacheMode[]).map((cacheMode) => {
    const result = group.results[cacheMode]

    return (
      <tr key={`${group.id}-${cacheMode}`}>
        <th>{axis}</th>
        <td>{group.label}</td>
        <td>{formatCacheMode(cacheMode)}</td>
        <td>{formatBytes(result.css.brotliBytes)}</td>
        <td>{formatCount(result.structure.styleRules)}</td>
        <td>{formatCount(result.structure.declarations)}</td>
        <td>{formatCount(result.dom.nodeCount.median)}</td>
        <td>{formatMilliseconds(result.timing.styleRecalculationMs.median)}</td>
        <td>{formatMilliseconds(result.timing.layoutMs.median)}</td>
        <td>{formatMilliseconds(result.timing.paintMs.median)}</td>
        <td>{result.timing.styleRecalculationMs.sampleCount}</td>
      </tr>
    )
  })
}
