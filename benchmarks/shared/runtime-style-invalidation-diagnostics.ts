import { createServer, type Server } from 'node:http'
import { readFile, writeFile } from 'node:fs/promises'
import { extname, isAbsolute, relative, resolve } from 'node:path'
import { performance } from 'node:perf_hooks'
import { chromium, type Browser, type Page } from '@playwright/test'
import { benchmarkAdapters, benchmarkFixtures } from '../fixtures/manifest'
import { collectEnvironment, collectPackageVersions } from './environment'
import { validateFixtures } from './fixtures'
import {
  benchmarkRoot,
  measureRelativeArtifact,
  resetDirectory
} from './runner'
import {
  createInteractionPage,
  type InteractionModeId,
  type InteractionResult,
  type RuntimeState
} from './interaction-cost'
import { runtimeStyleInvalidationMetrics } from './runtime-style-invalidation-metrics'
import { createRuntimeStyleInvalidationSamples } from './runtime-style-invalidation-samples'
import { fixedViewport, runtimeStyleInvalidationFixtureIds } from './runtime-style-invalidation-config'
import type { RuntimeStyleDiagnosticAction, RuntimeStyleDiagnosticDescriptor } from './runtime-style-invalidation-config'
import { createRuntimeStyleInvalidationVariants, filterRuntimeStyleInvalidationVariants } from './runtime-style-invalidation-variants'
import { writeBenchmarkReport } from './report'
import { summarizeReportSamples } from './stats'
import type {
  BenchmarkAdapter,
  BenchmarkArtifact,
  BenchmarkFixture,
  BenchmarkFixtureId,
  BenchmarkMetricUnit,
  BenchmarkReport,
  BenchmarkSample,
  BenchmarkVariant
} from './types'

interface ChromeTraceEvent {
  name?: string
  ph?: string
  dur?: number
}

interface RuntimeStyleInvalidationDiagnostics {
  mutationObserverCallbackCount: number
  mutationObserverCallbackDurationMs: number
  mutationRecordCount: number
  mutationAddedNodeCount: number
  mutationRemovedNodeCount: number
  mutationClassAttributeCount: number
  runtimeAddCallCount: number
  runtimeRemoveCallCount: number
  runtimeAddClassCount: number
  runtimeRemoveClassCount: number
  runtimeAddDurationMs: number
  runtimeRemoveDurationMs: number
  runtimeDeferredRemoveCallCount: number
  runtimeDeferredRemoveClassCount: number
  runtimeSuppressedRemoveCallCount: number
  runtimeSuppressedRemoveClassCount: number
  runtimeFlushRemoveCallCount: number
  runtimeFlushRemoveClassCount: number
  runtimeFlushRemoveDurationMs: number
  runtimeQueuedRemoveClassCount: number
  retainedSetAddCount: number
  retainedSetDeleteCount: number
  retainedSetClearCount: number
}

interface DiagnosticMetrics {
  mutationObserverCallbackCount?: number
  mutationObserverCallbackDurationMs?: number
  mutationRecordCount?: number
  mutationAddedNodeCount?: number
  mutationRemovedNodeCount?: number
  mutationClassAttributeCount?: number
  runtimeAddCallCount?: number
  runtimeRemoveCallCount?: number
  runtimeAddClassCount?: number
  runtimeRemoveClassCount?: number
  runtimeAddDurationMs?: number
  runtimeRemoveDurationMs?: number
  runtimeMutationMs?: number
  collectInteractionMutations?: boolean
  retainedSetAddCount?: number
  retainedSetDeleteCount?: number
  retainedSetClearCount?: number
}

interface RuntimeStyleInvalidationPreparation {
  preseededRuntimeRuleCount: number
  seededRetainedClassCount: number
  seededRetainedRuleCount: number
  seededRetainedRawBytes: number
  observerPaused: number
}

interface RuntimeStyleInvalidationMeasurement {
  samples: BenchmarkSample[]
  artifacts: BenchmarkArtifact[]
}

export interface RuntimeStyleInvalidationResult {
  interaction: InteractionResult
  traceMetrics: {
    styleRecalculationMs: number
    layoutMs: number
    paintMs: number
    longTaskCount: number
  }
  runtimeDiagnostics: RuntimeStyleInvalidationDiagnostics
  preparation: RuntimeStyleInvalidationPreparation
  beforeState: RuntimeState
  afterTraceState: RuntimeState
  afterFlushState: RuntimeState
  afterForcedCleanupState: RuntimeState
  beforeRuntimeStyleRuleCount: number
  afterTraceRuntimeStyleRuleCount: number
  afterFlushRuntimeStyleRuleCount: number
  afterForcedCleanupRuntimeStyleRuleCount: number
  forcedRetainedCleanup: {
    removedClassCount: number
    durationMs: number
  }
  consoleWarnings: string[]
}

export async function writeRuntimeStyleInvalidationDiagnosticsReport() {
  const report = await createRuntimeStyleInvalidationDiagnosticsReport()
  return writeBenchmarkReport(report)
}

export function listRuntimeStyleInvalidationDiagnosticVariantIds() {
  return createRuntimeStyleInvalidationVariants().map((variant) => variant.id)
}

export async function writeMergedRuntimeStyleInvalidationDiagnosticsReport(reports: BenchmarkReport[]) {
  if (!reports.length) {
    throw new Error('Expected at least one runtime style invalidation diagnostics report to merge.')
  }
  const samples = reports.flatMap((report) => report.samples)
  const variants = reports.flatMap((report) => report.variants)
  const artifacts = reports.flatMap((report) => report.artifacts)
  const metricUnits = new Map(runtimeStyleInvalidationMetrics.map((metric) => [metric.id, metric.unit as BenchmarkMetricUnit]))

  return writeBenchmarkReport({
    schemaVersion: 1,
    suite: 'runtime-style-invalidation-diagnostics',
    generatedAt: new Date().toISOString(),
    environment: reports[0].environment,
    browser: reports[0].browser,
    packages: reports[0].packages,
    fixtures: getRuntimeStyleInvalidationFixtures(),
    adapters: getRuntimeStyleInvalidationAdapters(variants),
    variants,
    metrics: runtimeStyleInvalidationMetrics,
    samples,
    summary: summarizeReportSamples(samples, metricUnits),
    limits: reports[0].limits,
    artifacts
  })
}

async function createRuntimeStyleInvalidationDiagnosticsReport(): Promise<BenchmarkReport> {
  validateFixtures(benchmarkFixtures)

  const variants = filterRuntimeStyleInvalidationVariants(createRuntimeStyleInvalidationVariants())
  const samples: BenchmarkSample[] = []
  const artifacts: BenchmarkArtifact[] = []
  const rounds = getMeasuredRounds()
  const warmupRounds = getWarmupRounds()
  let browserVersion: string | undefined
  console.log('Launching Chromium per measurement for runtime style invalidation diagnostics')

  for (const variant of variants) {
    console.log(`Preparing runtime style invalidation diagnostic page for ${variant.id}`)
    const page = await createInteractionPage({
      fixtureId: variant.fixtureId,
      modeId: variant.modeId,
      scenarioId: 'mutation-cleanup-cycle',
      variantId: variant.id,
      pageSuite: 'runtime-style-invalidation-diagnostics',
      runtimeDiagnostics: variant.modeId === 'master-runtime' || variant.modeId === 'master-progressive',
      postInteractionSettleFrames: 3
    })

    artifacts.push(...page.artifacts)

    for (let round = 0; round < warmupRounds; round++) {
      console.log(`Warming runtime style invalidation diagnostics for ${variant.id}, round ${round + 1}/${warmupRounds}`)
      const browser = await chromium.launch({ headless: true })
      browserVersion ??= browser.version()
      try {
        await measureRuntimeStyleInvalidationDiagnostic({
          browser,
          pageRoot: page.root,
          variant,
          round: -1,
          keepArtifacts: false
        })
      } finally {
        await browser.close()
      }
    }

    for (let round = 0; round < rounds; round++) {
      console.log(`Measuring runtime style invalidation diagnostics for ${variant.id}, round ${round + 1}/${rounds}`)
      const browser = await chromium.launch({ headless: true })
      browserVersion ??= browser.version()
      try {
        const result = await measureRuntimeStyleInvalidationDiagnostic({
          browser,
          pageRoot: page.root,
          variant,
          round,
          keepArtifacts: true
        })

        samples.push(...result.samples)
        artifacts.push(...result.artifacts)
      } finally {
        await browser.close()
      }
    }
  }

  const metricUnits = new Map(runtimeStyleInvalidationMetrics.map((metric) => [metric.id, metric.unit as BenchmarkMetricUnit]))

  return {
    schemaVersion: 1,
    suite: 'runtime-style-invalidation-diagnostics',
    generatedAt: new Date().toISOString(),
    environment: collectEnvironment(),
    browser: browserVersion
      ? {
        name: 'Chromium',
        version: browserVersion
      }
      : undefined,
    packages: await collectPackageVersions([
      '@master/css',
      '@master/css-runtime',
      '@master/css-server',
      '@master/css-preset',
      '@tailwindcss/cli',
      '@playwright/test'
    ]),
    fixtures: getRuntimeStyleInvalidationFixtures(),
    adapters: getRuntimeStyleInvalidationAdapters(),
    variants,
    metrics: runtimeStyleInvalidationMetrics,
    samples,
    summary: summarizeReportSamples(samples, metricUnits),
    limits: [
      'This suite is diagnostic-only and does not publish public benchmark claims.',
      'The dynamic and stress-dom fixtures use the interaction-cost mutation-cleanup-cycle page harness.',
      'Runtime/progressive variants are measured with benchmark-injected instrumentation; @master/css-runtime source behavior is not changed by this suite.',
      'Observer-paused variants intentionally disconnect the runtime MutationObserver inside the benchmark page only.',
      'Retained-volume variants seed inactive generated rules into runtime state to isolate retained stylesheet volume cost.',
      'Trace-derived event names can change across Chromium versions; raw trace artifacts are kept for review before optimization work.'
    ],
    artifacts
  }
}

async function measureRuntimeStyleInvalidationDiagnostic(options: {
  browser: Browser
  pageRoot: string
  variant: RuntimeStyleDiagnosticDescriptor
  round: number
  keepArtifacts: boolean
}): Promise<RuntimeStyleInvalidationMeasurement> {
  const server = await startStaticFileServer(options.pageRoot)

  try {
    const context = await options.browser.newContext({
      viewport: fixedViewport,
      deviceScaleFactor: 1
    })
    const page = await context.newPage()
    const consoleWarnings = collectConsoleWarnings(page)

    try {
      await page.goto(server.origin, { waitUntil: 'load' })
      await waitForBenchmarkReady(page)
      await assertDiagnosticPageReady(page, options.variant.modeId)
      await installRetainedSetInstrumentation(page)
      const preparation = await prepareRuntimeDiagnosticPage(page, options.variant)

      const traceResult = await traceRuntimeStyleInvalidationDiagnostic(page, options.variant.action)
      const fullResult = {
        ...traceResult,
        preparation,
        consoleWarnings
      }
      assertRuntimeStyleInvalidationResult(options.variant, fullResult)

      if (!options.keepArtifacts) {
        return {
          samples: [],
          artifacts: []
        }
      }

      const artifactRoot = resolve(benchmarkRoot, '.results', 'runtime-style-invalidation-diagnostics', 'artifacts', options.variant.id, `round-${options.round}`)
      await resetDirectory(artifactRoot)

      const traceFile = resolve(artifactRoot, 'trace.json')
      const diagnosticsFile = resolve(artifactRoot, 'diagnostics.json')
      const runtimeStyleFile = resolve(artifactRoot, 'runtime-style.css')

      await writeFile(traceFile, `${JSON.stringify({ traceEvents: traceResult.events }, null, 2)}\n`)
      await writeRuntimeStyleInvalidationArtifacts({
        file: diagnosticsFile,
        runtimeStyleFile,
        variant: options.variant,
        result: fullResult
      })

      const artifactFiles = [
        traceFile,
        diagnosticsFile
      ]
      if (traceResult.interaction.runtimeStyleText) artifactFiles.push(runtimeStyleFile)

      return {
        samples: createRuntimeStyleInvalidationSamples(options.variant.id, options.round, fullResult),
        artifacts: await Promise.all(artifactFiles.map((file) => measureRelativeArtifact(file)))
      }
    } finally {
      await context.close()
    }
  } finally {
    await server.close()
  }
}

async function prepareRuntimeDiagnosticPage(page: Page, variant: RuntimeStyleDiagnosticDescriptor): Promise<RuntimeStyleInvalidationPreparation> {
  if (variant.modeId !== 'master-runtime' && variant.modeId !== 'master-progressive') {
    return {
      preseededRuntimeRuleCount: 0,
      seededRetainedClassCount: 0,
      seededRetainedRuleCount: 0,
      seededRetainedRawBytes: 0,
      observerPaused: 0
    }
  }

  const preseededRuntimeRuleCount = variant.preseedTempRules
    ? await preseedRuntimeTempRules(page)
    : 0
  const seededRetained = variant.retainedVolume
    ? await seedRetainedRuntimeRules(page, variant.retainedVolume)
    : {
      classCount: 0,
      ruleCount: 0,
      rawBytes: 0
    }
  const observerPaused = variant.pauseObserver
    ? await pauseRuntimeObserver(page)
    : 0

  return {
    preseededRuntimeRuleCount,
    seededRetainedClassCount: seededRetained.classCount,
    seededRetainedRuleCount: seededRetained.ruleCount,
    seededRetainedRawBytes: seededRetained.rawBytes,
    observerPaused
  }
}

async function installRetainedSetInstrumentation(page: Page) {
  await page.evaluate(() => {
    const runtime = globalThis.masterCSSRuntime as {
      retainedClassNames?: Set<string> & {
        __benchmarkInstrumented?: boolean
      }
    } | undefined
    const metrics = globalThis.__interactionMetrics as (typeof globalThis.__interactionMetrics & {
      retainedSetAddCount?: number
      retainedSetDeleteCount?: number
      retainedSetClearCount?: number
    })
    const retainedClassNames = runtime?.retainedClassNames
    if (!retainedClassNames || retainedClassNames.__benchmarkInstrumented) return
    retainedClassNames.__benchmarkInstrumented = true

    const nativeAdd = retainedClassNames.add.bind(retainedClassNames)
    const nativeDelete = retainedClassNames.delete.bind(retainedClassNames)
    const nativeClear = retainedClassNames.clear.bind(retainedClassNames)

    retainedClassNames.add = (value) => {
      if (metrics?.collectInteractionMutations) metrics.retainedSetAddCount = (metrics.retainedSetAddCount || 0) + 1
      return nativeAdd(value)
    }
    retainedClassNames.delete = (value) => {
      if (metrics?.collectInteractionMutations) metrics.retainedSetDeleteCount = (metrics.retainedSetDeleteCount || 0) + 1
      return nativeDelete(value)
    }
    retainedClassNames.clear = () => {
      if (metrics?.collectInteractionMutations) metrics.retainedSetClearCount = (metrics.retainedSetClearCount || 0) + 1
      return nativeClear()
    }
  })
}

async function preseedRuntimeTempRules(page: Page) {
  return page.evaluate(() => {
    const config = globalThis.__interactionConfig as {
      classes?: {
        temp?: string[]
      }
    }
    const runtime = globalThis.masterCSSRuntime as {
      classUtilities?: {
        size?: number
      }
      ensureClassRules?: (...classNames: string[]) => unknown
    } | undefined
    const tempClassNames = config.classes?.temp || []
    if (!runtime?.ensureClassRules || !tempClassNames.length) return 0

    const before = runtime.classUtilities?.size || 0
    runtime.ensureClassRules(...tempClassNames)
    const after = runtime.classUtilities?.size || 0

    return Math.max(0, after - before)
  })
}

async function seedRetainedRuntimeRules(page: Page, count: number) {
  return page.evaluate((classCount) => {
    const runtime = globalThis.masterCSSRuntime as {
      ensureClassRules?: (...classNames: string[]) => unknown
      classUtilities?: Map<string, {
        text?: string
        nodes?: {
          text?: string
        }[]
      }[]>
      retainedClassNames?: Set<string>
      retainedClassRules?: Map<string, {
        retainedAt: number
        rawBytes: number
        ruleCount: number
      }>
    } | undefined
    if (!runtime?.ensureClassRules || !runtime.classUtilities || !runtime.retainedClassNames || !runtime.retainedClassRules) {
      return {
        classCount: 0,
        ruleCount: 0,
        rawBytes: 0
      }
    }

    const classNames = Array.from({ length: classCount }, (_, index) => `z:${10000 + index}`)
    runtime.ensureClassRules(...classNames)
    const retainedAt = Date.now() - 2000
    let ruleCount = 0
    let rawBytes = 0

    for (const className of classNames) {
      const summary = summarizeRuntimeClassRules(runtime.classUtilities.get(className) || [])
      runtime.retainedClassNames.add(className)
      runtime.retainedClassRules.set(className, {
        retainedAt,
        rawBytes: summary.rawBytes,
        ruleCount: summary.ruleCount
      })
      ruleCount += summary.ruleCount
      rawBytes += summary.rawBytes
    }

    return {
      classCount: classNames.length,
      ruleCount,
      rawBytes
    }

    function summarizeRuntimeClassRules(rules: {
      text?: string
      nodes?: {
        text?: string
      }[]
    }[]) {
      let ruleCount = 0
      let rawBytes = 0
      for (const rule of rules) {
        const nodes = Array.isArray(rule.nodes) ? rule.nodes : []
        if (nodes.length) {
          for (const node of nodes) {
            ruleCount++
            rawBytes += new TextEncoder().encode(node.text || '').length
          }
        } else {
          ruleCount++
          rawBytes += new TextEncoder().encode(rule.text || '').length
        }
      }
      return { ruleCount, rawBytes }
    }
  }, count)
}

async function pauseRuntimeObserver(page: Page) {
  return page.evaluate(() => {
    const runtime = globalThis.masterCSSRuntime as {
      observer?: {
        disconnect?: () => void
      }
    } | undefined
    if (!runtime?.observer?.disconnect) return 0
    runtime.observer.disconnect()
    return 1
  })
}

async function traceRuntimeStyleInvalidationDiagnostic(page: Page, action: RuntimeStyleDiagnosticAction) {
  const context = page.context()
  const client = await context.newCDPSession(page)
  const events: ChromeTraceEvent[] = []
  const tracingComplete = new Promise<void>((resolveComplete) => {
    client.once('Tracing.tracingComplete', () => resolveComplete())
  })

  client.on('Tracing.dataCollected', (event: { value?: ChromeTraceEvent[] }) => {
    if (event.value) events.push(...event.value)
  })

  const beforeState = await page.evaluate(() => globalThis.__readInteractionState())
  const beforeRuntimeStyleRuleCount = beforeState.runtimeGeneratedRuleCount

  await client.send('Tracing.start', {
    categories: [
      'devtools.timeline',
      'disabled-by-default-devtools.timeline',
      'blink',
      'loading'
    ].join(','),
    transferMode: 'ReportEvents'
  })

  const traceWindowResult = await page.evaluate(async (diagnosticAction) => {
    const interaction = diagnosticAction === 'idle-window'
      ? await runIdleWindowDiagnostic()
      : await globalThis.__runInteractionScenario()
    return {
      interaction,
      afterTraceState: globalThis.__readInteractionState(),
      runtimeDiagnostics: readRuntimeStyleInvalidationDiagnostics()
    }

    async function runIdleWindowDiagnostic() {
      const metrics = globalThis.__interactionMetrics
      if (metrics) {
        metrics.runtimeMutationMs = 0
        metrics.collectInteractionMutations = true
      }
      resetStyleInvalidationDiagnosticMetrics()
      const before = globalThis.__readInteractionState()
      const startedAt = performance.now()
      await globalThis.__waitInteractionFrames(3)
      const after = globalThis.__readInteractionState()
      if (metrics) metrics.collectInteractionMutations = false
      const probe = document.getElementById('interaction-style-probe')
      return {
        elapsedMs: performance.now() - startedAt,
        runtimeMutationMs: metrics?.runtimeMutationMs || 0,
        runtimeGeneratedRuleCountDelta: after.runtimeGeneratedRuleCount - before.runtimeGeneratedRuleCount,
        runtimeStyleRawBytesDelta: after.runtimeStyleRawBytes - before.runtimeStyleRawBytes,
        domNodeCount: after.domNodeCount,
        affectedElementCount: 0,
        computedStyleValid: probe && getComputedStyle(probe).textAlign === 'center' ? 1 : 0,
        cleanupValid: 1,
        progressiveAdopted: after.progressiveAdopted,
        runtimeStyleText: after.runtimeStyleText,
        details: {
          action: 'idle-window'
        }
      }
    }

    function resetStyleInvalidationDiagnosticMetrics() {
      const metrics = globalThis.__interactionMetrics as DiagnosticMetrics | undefined
      if (!metrics) return
      metrics.mutationObserverCallbackCount = 0
      metrics.mutationObserverCallbackDurationMs = 0
      metrics.mutationRecordCount = 0
      metrics.mutationAddedNodeCount = 0
      metrics.mutationRemovedNodeCount = 0
      metrics.mutationClassAttributeCount = 0
      metrics.runtimeAddCallCount = 0
      metrics.runtimeRemoveCallCount = 0
      metrics.runtimeAddClassCount = 0
      metrics.runtimeRemoveClassCount = 0
      metrics.runtimeAddDurationMs = 0
      metrics.runtimeRemoveDurationMs = 0
      metrics.retainedSetAddCount = 0
      metrics.retainedSetDeleteCount = 0
      metrics.retainedSetClearCount = 0
    }

    function readRuntimeStyleInvalidationDiagnostics() {
      const base = globalThis.__readRuntimeMutationDiagnostics?.() || {
        mutationObserverCallbackCount: 0,
        mutationObserverCallbackDurationMs: 0,
        mutationRecordCount: 0,
        mutationAddedNodeCount: 0,
        mutationRemovedNodeCount: 0,
        mutationClassAttributeCount: 0,
        runtimeAddCallCount: 0,
        runtimeRemoveCallCount: 0,
        runtimeAddClassCount: 0,
        runtimeRemoveClassCount: 0,
        runtimeAddDurationMs: 0,
        runtimeRemoveDurationMs: 0,
        runtimeDeferredRemoveCallCount: 0,
        runtimeDeferredRemoveClassCount: 0,
        runtimeSuppressedRemoveCallCount: 0,
        runtimeSuppressedRemoveClassCount: 0,
        runtimeFlushRemoveCallCount: 0,
        runtimeFlushRemoveClassCount: 0,
        runtimeFlushRemoveDurationMs: 0,
        runtimeQueuedRemoveClassCount: 0
      }
      const metrics = (globalThis.__interactionMetrics || {}) as DiagnosticMetrics
      return {
        ...base,
        retainedSetAddCount: metrics.retainedSetAddCount || 0,
        retainedSetDeleteCount: metrics.retainedSetDeleteCount || 0,
        retainedSetClearCount: metrics.retainedSetClearCount || 0
      }
    }

  }, action)

  await client.send('Tracing.end')
  await tracingComplete
  await client.detach()

  const {
    interaction,
    afterTraceState,
    runtimeDiagnostics
  } = traceWindowResult
  await page.evaluate(() => globalThis.__waitInteractionFrames(3))
  const afterFlushState = await page.evaluate(() => globalThis.__readInteractionState())
  const afterFlushRuntimeStyleRuleCount = afterFlushState.runtimeGeneratedRuleCount
  const forcedRetainedCleanup = await page.evaluate(() => {
    const runtime = globalThis.masterCSSRuntime as {
      flushRetainedClassRules?: () => number
    } | undefined
    const startedAt = performance.now()
    const removedClassCount = runtime?.flushRetainedClassRules?.() || 0
    return {
      removedClassCount,
      durationMs: performance.now() - startedAt
    }
  })
  const afterForcedCleanupState = await page.evaluate(() => globalThis.__readInteractionState())
  const afterForcedCleanupRuntimeStyleRuleCount = afterForcedCleanupState.runtimeGeneratedRuleCount

  return {
    events,
    interaction,
    beforeState,
    afterTraceState,
    afterFlushState,
    afterForcedCleanupState,
    beforeRuntimeStyleRuleCount,
    afterTraceRuntimeStyleRuleCount: afterTraceState.runtimeGeneratedRuleCount,
    afterFlushRuntimeStyleRuleCount,
    afterForcedCleanupRuntimeStyleRuleCount,
    forcedRetainedCleanup,
    runtimeDiagnostics,
    traceMetrics: summarizeTraceEvents(events)
  }
}

async function writeRuntimeStyleInvalidationArtifacts(options: {
  file: string
  runtimeStyleFile: string
  variant: RuntimeStyleDiagnosticDescriptor
  result: RuntimeStyleInvalidationResult
}) {
  const { runtimeStyleText, ...interaction } = options.result.interaction
  await writeFile(options.file, `${JSON.stringify({
    variant: {
      id: options.variant.id,
      kind: options.variant.kind,
      action: options.variant.action,
      preseedTempRules: options.variant.preseedTempRules,
      pauseObserver: options.variant.pauseObserver,
      retainedVolume: options.variant.retainedVolume
    },
    interaction,
    traceMetrics: options.result.traceMetrics,
    runtimeDiagnostics: options.result.runtimeDiagnostics,
    preparation: options.result.preparation,
    beforeState: omitRuntimeStyleText(options.result.beforeState),
    afterTraceState: omitRuntimeStyleText(options.result.afterTraceState),
    afterFlushState: omitRuntimeStyleText(options.result.afterFlushState),
    afterForcedCleanupState: omitRuntimeStyleText(options.result.afterForcedCleanupState),
    beforeRuntimeStyleRuleCount: options.result.beforeRuntimeStyleRuleCount,
    afterTraceRuntimeStyleRuleCount: options.result.afterTraceRuntimeStyleRuleCount,
    afterFlushRuntimeStyleRuleCount: options.result.afterFlushRuntimeStyleRuleCount,
    afterForcedCleanupRuntimeStyleRuleCount: options.result.afterForcedCleanupRuntimeStyleRuleCount,
    forcedRetainedCleanup: options.result.forcedRetainedCleanup,
    consoleWarnings: options.result.consoleWarnings,
    runtimeStyleTextArtifact: runtimeStyleText ? 'runtime-style.css' : undefined
  }, null, 2)}\n`)
  if (runtimeStyleText) await writeFile(options.runtimeStyleFile, runtimeStyleText)
}

function assertRuntimeStyleInvalidationResult(
  variant: RuntimeStyleDiagnosticDescriptor,
  result: RuntimeStyleInvalidationResult
) {
  if (result.interaction.computedStyleValid !== 1) {
    throw new Error(`${variant.id} failed computed-style validation.`)
  }

  if (variant.action === 'mutation-cleanup-cycle' && result.interaction.cleanupValid !== 1) {
    throw new Error(`${variant.id} failed cleanup validation.`)
  }

  if (variant.modeId === 'master-progressive' && result.interaction.progressiveAdopted !== 1) {
    throw new Error(`${variant.id} fell back from progressive hydration before diagnostics.`)
  }

  if (variant.modeId === 'master-runtime' && result.interaction.progressiveAdopted !== 0) {
    throw new Error(`${variant.id} unexpectedly reported progressive adoption.`)
  }

  const tempClassNames = getTemporaryClassNames()
  const retainedTemporaryClassNames = tempClassNames.filter((className) => result.afterForcedCleanupState.retainedClassNames.includes(className))
  if (retainedTemporaryClassNames.length) {
    throw new Error(`${variant.id} left retained temporary classes after forced cleanup: ${retainedTemporaryClassNames.join(', ')}.`)
  }
}

async function waitForBenchmarkReady(page: Page) {
  await page.waitForFunction(() => (window as Window & { __benchmarkReady?: boolean }).__benchmarkReady === true, undefined, { timeout: 15000 })
}

async function assertDiagnosticPageReady(page: Page, modeId: InteractionModeId) {
  const state = await page.evaluate(() => ({
    ready: document.documentElement.dataset.benchmarkReady,
    textAlign: getComputedStyle(document.getElementById('interaction-style-probe')!).textAlign,
    runtimeAvailable: Boolean(globalThis.masterCSSRuntime),
    progressive: Boolean(globalThis.masterCSSRuntime?.progressive),
    htmlHidden: document.documentElement.hasAttribute('hidden')
  }))

  if (state.ready !== 'true') {
    throw new Error('Runtime style invalidation diagnostic page did not set the ready marker.')
  }

  if (state.textAlign !== 'center') {
    throw new Error(`Expected interaction style probe text-align:center, received ${state.textAlign}.`)
  }

  if ((modeId === 'master-runtime' || modeId === 'master-progressive') && !state.runtimeAvailable) {
    throw new Error(`${modeId} did not expose globalThis.masterCSSRuntime.`)
  }

  if (modeId === 'master-progressive' && !state.progressive) {
    throw new Error('Master progressive diagnostic page fell back before measurement.')
  }

  if (modeId === 'master-runtime' && state.htmlHidden) {
    throw new Error('Master runtime diagnostic page did not reveal the hidden html element.')
  }
}

function summarizeTraceEvents(events: ChromeTraceEvent[]) {
  return {
    styleRecalculationMs: sumTraceDurations(events, new Set([
      'UpdateLayoutTree',
      'RecalculateStyles',
      'Document::updateStyle'
    ])),
    layoutMs: sumTraceDurations(events, new Set(['Layout'])),
    paintMs: sumTraceDurations(events, new Set(['PrePaint', 'Paint'])),
    longTaskCount: countLongTasks(events)
  }
}

function sumTraceDurations(events: ChromeTraceEvent[], names: Set<string>) {
  return events.reduce((total, event) => {
    if (event.ph !== 'X' || !event.name || !names.has(event.name) || !event.dur) return total
    return total + event.dur / 1000
  }, 0)
}

function countLongTasks(events: ChromeTraceEvent[]) {
  return events.filter((event) => (
    event.ph === 'X'
    && typeof event.dur === 'number'
    && event.dur >= 50000
    && Boolean(event.name?.includes('RunTask') || event.name?.includes('ProcessTask'))
  )).length
}

async function startStaticFileServer(root: string) {
  const resolvedRoot = resolve(root)
  const server = createServer(async (request, response) => {
    try {
      const url = new URL(request.url || '/', 'http://127.0.0.1')
      const relativePath = url.pathname === '/' ? 'index.html' : decodeURIComponent(url.pathname.slice(1))
      const file = resolve(resolvedRoot, relativePath)
      const relativeFile = relative(resolvedRoot, file)

      if (relativeFile.startsWith('..') || isAbsolute(relativeFile)) {
        response.writeHead(403)
        response.end('Forbidden')
        return
      }

      const body = await readFile(file)
      response.writeHead(200, {
        'content-type': getContentType(file),
        'cache-control': 'no-store'
      })
      response.end(body)
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        response.writeHead(404)
        response.end('Not found')
        return
      }

      response.writeHead(500)
      response.end((error as Error).message)
    }
  })

  await new Promise<void>((resolveListen, rejectListen) => {
    server.once('error', rejectListen)
    server.listen(0, '127.0.0.1', () => {
      server.off('error', rejectListen)
      resolveListen()
    })
  })

  const address = server.address()
  if (!address || typeof address === 'string') {
    await closeServer(server)
    throw new Error('Unable to allocate local runtime style invalidation diagnostic server port.')
  }

  return {
    origin: `http://127.0.0.1:${address.port}/`,
    close: () => closeServer(server)
  }
}

function closeServer(server: Server) {
  return new Promise<void>((resolveClose, rejectClose) => {
    server.close((error) => error ? rejectClose(error) : resolveClose())
  })
}

function getContentType(file: string) {
  switch (extname(file)) {
    case '.html':
      return 'text/html; charset=utf-8'
    case '.css':
      return 'text/css; charset=utf-8'
    case '.js':
      return 'text/javascript; charset=utf-8'
    case '.json':
      return 'application/json; charset=utf-8'
    case '.png':
      return 'image/png'
    default:
      return 'application/octet-stream'
  }
}

function collectConsoleWarnings(page: Page) {
  const warnings: string[] = []
  page.on('console', (message) => {
    if (message.type() === 'warning') warnings.push(message.text())
  })
  return warnings
}

function getRuntimeStyleInvalidationFixtures(): BenchmarkFixture[] {
  return runtimeStyleInvalidationFixtureIds.map((id) => {
    const fixture = benchmarkFixtures.find((candidate) => candidate.id === id)
    if (!fixture) throw new Error(`Missing benchmark fixture: ${id}`)
    return fixture
  })
}

function getRuntimeStyleInvalidationAdapters(variants: BenchmarkVariant[] = createRuntimeStyleInvalidationVariants()): BenchmarkAdapter[] {
  const ids = new Set(variants.map((variant) => variant.adapterId))
  return benchmarkAdapters.filter((adapter) => ids.has(adapter.id))
}

function getMeasuredRounds() {
  const value = Number(process.env.RUNTIME_STYLE_INVALIDATION_DIAGNOSTIC_ROUNDS || process.env.BENCHMARK_ROUNDS || 5)
  if (!Number.isFinite(value) || value < 1) return 5
  return Math.floor(value)
}

function getWarmupRounds() {
  const value = Number(process.env.RUNTIME_STYLE_INVALIDATION_DIAGNOSTIC_WARMUP_ROUNDS || 1)
  if (!Number.isFinite(value) || value < 0) return 1
  return Math.floor(value)
}

function getTemporaryClassNames() {
  return ['outline:blue-60|2', 'shadow:0|0|0|2|rgb(59_130_246/.25)']
}

function omitRuntimeStyleText(state: RuntimeState) {
  const { runtimeStyleText, ...rest } = state
  return {
    ...rest,
    runtimeStyleRawBytes: state.runtimeStyleRawBytes,
    runtimeStyleTextBytes: new TextEncoder().encode(runtimeStyleText).length
  }
}
