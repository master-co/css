import type { CDPSession, Page } from '@playwright/test'
import { summarizeBytes } from './bytes'
import { analyzeCSSStructure } from './css-structure'
import type { BenchmarkSample } from './types'
import type { BrowserLifecycleTraceArtifact, BrowserLifecycleTraceArtifactMode, ChromeTraceEvent, LifecycleActionResult, LifecycleMeasurementValues, LifecycleState, LifecycleStateWithRuntimeStyle, LifecycleTraceMetrics } from './browser-lifecycle'

const stylesheetParseTraceNames = new Set([
  'ParseAuthorStyleSheet',
  'ParseStyleSheet',
  'CSSParserImpl::parseStyleSheet'
])

const styleRecalculationTraceNames = new Set([
  'UpdateLayoutTree',
  'RecalculateStyles',
  'Document::updateStyle'
])

const layoutTraceNames = new Set(['Layout'])
const paintTraceNames = new Set(['PrePaint', 'Paint'])

export function createPayloadSamples(variantId: string, payload: {
  html: Buffer
  externalCSS: Buffer
  inlineCSS: Buffer
  runtimeJS: Buffer
  manifestJSON: Buffer
  hydrationManifestJSON: Buffer
}): BenchmarkSample[] {
  return [
    ...createByteSamples(variantId, 'html', payload.html),
    ...createByteSamples(variantId, 'external-css', payload.externalCSS),
    ...createByteSamples(variantId, 'inline-css', payload.inlineCSS),
    ...createByteSamples(variantId, 'runtime-js', payload.runtimeJS),
    ...createByteSamples(variantId, 'manifest-json', payload.manifestJSON),
    ...createByteSamples(variantId, 'hydration-manifest', payload.hydrationManifestJSON)
  ]
}

function createByteSamples(variantId: string, prefix: string, buffer: Buffer): BenchmarkSample[] {
  const bytes = summarizeBytes(buffer)
  return [
    {
      metricId: `${prefix}-raw-bytes`,
      variantId,
      round: 0,
      value: bytes.rawBytes
    },
    {
      metricId: `${prefix}-gzip-bytes`,
      variantId,
      round: 0,
      value: bytes.gzipBytes
    },
    {
      metricId: `${prefix}-brotli-bytes`,
      variantId,
      round: 0,
      value: bytes.brotliBytes
    }
  ]
}

export function createDeliveredCSSStructureSamples(variantId: string, css: string): BenchmarkSample[] {
  const structure = css.trim()
    ? analyzeCSSStructure(css)
    : {
      styleRuleCount: 0,
      selectorCount: 0,
      declarationCount: 0
    }

  return [
    {
      metricId: 'delivered-style-rule-count',
      variantId,
      round: 0,
      value: structure.styleRuleCount
    },
    {
      metricId: 'delivered-selector-count',
      variantId,
      round: 0,
      value: structure.selectorCount
    },
    {
      metricId: 'delivered-declaration-count',
      variantId,
      round: 0,
      value: structure.declarationCount
    }
  ]
}

export function createLifecycleMetricSamples(variantId: string, round: number, values: LifecycleMeasurementValues): BenchmarkSample[] {
  return [
    sample('navigation-ready-ms', values.navigationReadyMs),
    sample('stylesheet-parse-ms', values.stylesheetParseMs),
    sample('style-recalculation-ms', values.styleRecalculationMs),
    sample('style-recalculation-count', values.styleRecalculationCount),
    sample('layout-ms', values.layoutMs),
    sample('paint-ms', values.paintMs),
    sample('long-task-count', values.longTaskCount),
    sample('fcp-ms', values.fcpMs),
    sample('lcp-ms', values.lcpMs),
    sample('inp-style-interaction-ms', values.inpStyleInteractionMs),
    sample('js-heap-used-bytes', values.jsHeapUsedBytes),
    sample('dom-node-count', values.domNodeCount),
    sample('affected-element-count', values.affectedElementCount),
    sample('average-class-count', values.averageClassCount),
    sample('cssom-rule-count', values.cssomRuleCount),
    sample('runtime-ready-ms', values.runtimeReadyMs),
    sample('runtime-bootstrap-ms', values.runtimeBootstrapMs),
    sample('runtime-observe-ms', values.runtimeObserveMs),
    sample('runtime-mutation-ms', values.runtimeMutationMs),
    sample('runtime-generated-rule-count', values.runtimeGeneratedRuleCount),
    sample('runtime-generated-rule-count-delta', values.runtimeGeneratedRuleCountDelta),
    sample('runtime-style-raw-bytes', values.runtimeStyleRawBytes),
    sample('runtime-style-raw-bytes-delta', values.runtimeStyleRawBytesDelta),
    sample('retained-class-count', values.retainedClassCount),
    sample('retained-rule-count', values.retainedRuleCount),
    sample('mutation-observer-callback-count', values.mutationObserverCallbackCount),
    sample('mutation-observer-callback-duration-ms', values.mutationObserverCallbackDurationMs),
    sample('route-count', values.routeCount),
    sample('progressive-adopted', values.progressiveAdopted),
    sample('computed-style-valid', values.computedStyleValid)
  ]

  function sample(metricId: string, value: number): BenchmarkSample {
    return {
      metricId,
      variantId,
      round,
      value
    }
  }
}

export async function waitForBenchmarkReady(page: Page) {
  await page.waitForFunction(() => globalThis.__benchmarkReady === true, undefined, { timeout: 30000 })
}

export async function assertLifecycleCorrect(page: Page) {
  const result = await page.evaluate(() => ({
    ready: document.documentElement.dataset.benchmarkReady,
    textAlign: getComputedStyle(document.getElementById('benchmark-style-probe')!).textAlign,
    hidden: document.documentElement.hasAttribute('hidden')
  }))

  if (result.ready !== 'true') throw new Error('Lifecycle benchmark page did not set the ready marker.')
  if (result.textAlign !== 'center') throw new Error(`Expected text-center probe to be centered, received ${result.textAlign}.`)
  if (result.hidden) throw new Error('Lifecycle benchmark page remained hidden after ready.')
}

export async function readLifecycleState(page: Page): Promise<LifecycleStateWithRuntimeStyle> {
  return page.evaluate(() => globalThis.__readLifecycleState())
}

export async function readRuntimeMetrics(page: Page) {
  return page.evaluate(() => {
    const metrics = globalThis.__lifecycleMetrics || {}
    return {
      runtimeReadyMs: metrics.runtimeReadyMs || 0,
      runtimeBootstrapMs: metrics.runtimeBootstrapMs || 0,
      runtimeObserveMs: metrics.runtimeObserveMs || 0
    }
  })
}

export async function readJSHeapUsedBytes(client: CDPSession) {
  try {
    const usage = await client.send('Runtime.getHeapUsage')
    return usage.usedSize || 0
  } catch {
    try {
      const metrics = await client.send('Performance.getMetrics')
      const heapMetric = metrics.metrics?.find((metric: { name: string }) => metric.name === 'JSHeapUsedSize')
      return heapMetric?.value || 0
    } catch {
      return 0
    }
  }
}

export function createEmptyActionResult(): LifecycleActionResult {
  return {
    elapsedMs: 0,
    affectedElementCount: 0,
    routeCount: 0,
    computedStyleValid: 1,
    runtimeMutationMs: 0,
    runtimeGeneratedRuleCountDelta: 0,
    runtimeStyleRawBytesDelta: 0,
    mutationObserverCallbackCount: 0,
    mutationObserverCallbackDurationMs: 0
  }
}

export function omitRuntimeStyleText(state: LifecycleStateWithRuntimeStyle): LifecycleState {
  const { runtimeStyleText: _runtimeStyleText, ...serializableState } = state
  return serializableState
}

export function createLifecycleTraceArtifact(
  events: ChromeTraceEvent[],
  values: LifecycleMeasurementValues,
  mode: BrowserLifecycleTraceArtifactMode
): BrowserLifecycleTraceArtifact {
  if (mode === 'off') {
    return {
      mode,
      eventCount: events.length,
      retainedEventCount: 0
    }
  }

  if (mode === 'raw') {
    return {
      mode,
      eventCount: events.length,
      retainedEventCount: events.length,
      content: JSON.stringify({ traceEvents: events })
    }
  }

  const retainedEvents = events
    .filter(isLifecycleSummaryTraceEvent)
    .map(compactTraceEvent)

  return {
    mode,
    eventCount: events.length,
    retainedEventCount: retainedEvents.length,
    content: JSON.stringify({
      mode,
      eventCount: events.length,
      retainedEventCount: retainedEvents.length,
      droppedEventCount: events.length - retainedEvents.length,
      traceMetrics: createLifecycleTraceMetricsSnapshot(values),
      traceEvents: retainedEvents
    })
  }
}

function createLifecycleTraceMetricsSnapshot(values: LifecycleMeasurementValues): LifecycleTraceMetrics {
  return {
    stylesheetParseMs: values.stylesheetParseMs,
    styleRecalculationMs: values.styleRecalculationMs,
    styleRecalculationCount: values.styleRecalculationCount,
    layoutMs: values.layoutMs,
    paintMs: values.paintMs,
    longTaskCount: values.longTaskCount
  }
}

function compactTraceEvent(event: ChromeTraceEvent): ChromeTraceEvent {
  const compact: ChromeTraceEvent = {}
  if (event.name !== undefined) compact.name = event.name
  if (event.cat !== undefined) compact.cat = event.cat
  if (event.ph !== undefined) compact.ph = event.ph
  if (event.ts !== undefined) compact.ts = event.ts
  if (event.dur !== undefined) compact.dur = event.dur
  if (event.pid !== undefined) compact.pid = event.pid
  if (event.tid !== undefined) compact.tid = event.tid
  return compact
}

function isLifecycleSummaryTraceEvent(event: ChromeTraceEvent) {
  const isSummaryName = Boolean(
    event.name
    && (
      stylesheetParseTraceNames.has(event.name)
      || styleRecalculationTraceNames.has(event.name)
      || layoutTraceNames.has(event.name)
      || paintTraceNames.has(event.name)
    )
  )
  return (event.ph === 'X' && isSummaryName) || isLongTaskTraceEvent(event)
}

export function summarizeTraceEvents(events: ChromeTraceEvent[]): LifecycleTraceMetrics {
  return {
    stylesheetParseMs: sumTraceDurations(events, stylesheetParseTraceNames),
    styleRecalculationMs: sumTraceDurations(events, styleRecalculationTraceNames),
    styleRecalculationCount: countTraceEvents(events, styleRecalculationTraceNames),
    layoutMs: sumTraceDurations(events, layoutTraceNames),
    paintMs: sumTraceDurations(events, paintTraceNames),
    longTaskCount: countLongTasks(events)
  }
}

function sumTraceDurations(events: ChromeTraceEvent[], names: Set<string>) {
  return events.reduce((total, event) => {
    if (event.ph !== 'X' || !event.name || !names.has(event.name) || !event.dur) return total
    return total + event.dur / 1000
  }, 0)
}

function countTraceEvents(events: ChromeTraceEvent[], names: Set<string>) {
  return events.filter((event) => event.ph === 'X' && event.name && names.has(event.name)).length
}

function countLongTasks(events: ChromeTraceEvent[]) {
  return events.filter(isLongTaskTraceEvent).length
}

function isLongTaskTraceEvent(event: ChromeTraceEvent) {
  return (
    event.ph === 'X'
    && typeof event.dur === 'number'
    && event.dur >= 50000
    && Boolean(event.name?.includes('RunTask') || event.name?.includes('ProcessTask'))
  )
}

export function collectConsoleWarnings(page: Page) {
  const warnings: string[] = []
  page.on('console', (message) => {
    if (message.type() === 'warning') warnings.push(message.text())
  })
  return warnings
}
