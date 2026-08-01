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
  createInteractionVariantId,
  type InteractionModeId,
  type InteractionResult,
  type RuntimeMutationStrategyId,
  type RuntimeState
} from './interaction-cost'
import { runtimeMutationDiagnosticMetrics } from './runtime-mutation-diagnostic-metrics'
import { countTemporaryClasses, createRuntimeMutationDiagnosticSamples, getTemporaryClassNames } from './runtime-mutation-diagnostic-samples'
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

interface RuntimeMutationDiagnostics {
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
}

interface RuntimeMutationStrategyFlushResult {
  reason: string
  strategyId: RuntimeMutationStrategyId
  flushed: boolean
  callCount: number
  classCount: number
  durationMs: number
  queuedClassCountBeforeFlush: number
}

interface RuntimeMutationCleanupValidation {
  cleanupValid: number
  runtimeClean: number
  scratchChildCount: number
}

interface RuntimeMutationDiagnosticMeasurement {
  samples: BenchmarkSample[]
  artifacts: BenchmarkArtifact[]
}

export interface RuntimeMutationDiagnosticResult {
  interaction: InteractionResult
  traceMetrics: {
    styleRecalculationMs: number
    layoutMs: number
    paintMs: number
    longTaskCount: number
  }
  runtimeDiagnostics: RuntimeMutationDiagnostics
  traceWindowId: RuntimeMutationTraceWindowId
  ruleStateId: RuntimeMutationRuleStateId
  postInteractionSettleFrameCount: number
  preseededRuntimeRuleCount: number
  beforeState: RuntimeState
  afterTraceState: RuntimeState
  afterFlushState: RuntimeState
  afterForcedCleanupState: RuntimeState
  strategyFlush: RuntimeMutationStrategyFlushResult
  forcedRetainedCleanup: {
    removedClassCount: number
    durationMs: number
  }
  cleanupAfterFlush: RuntimeMutationCleanupValidation
  consoleWarnings: string[]
}

const fixedViewport = {
  width: 1280,
  height: 720
}

type RuntimeMutationTraceWindowId =
  | 'before-flush'
  | 'after-flush'

type RuntimeMutationRuleStateId =
  | 'cold-temp-rules'
  | 'preseed-temp-rules'

interface RuntimeMutationTraceWindowDescriptor {
  id: RuntimeMutationTraceWindowId
  label: string
  postInteractionSettleFrames: number
}

interface RuntimeMutationRuleStateDescriptor {
  id: RuntimeMutationRuleStateId
  label: string
  preseedTempRules: boolean
}

const runtimeMutationDiagnosticFixtureIds = [
  'dynamic',
  'stress-dom'
] satisfies BenchmarkFixtureId[]

const runtimeMutationDiagnosticModeIds = [
  'master-runtime',
  'master-progressive'
] satisfies InteractionModeId[]

const runtimeMutationDiagnosticTraceWindows = [
  {
    id: 'before-flush',
    label: 'before deferred flush',
    postInteractionSettleFrames: 0
  },
  {
    id: 'after-flush',
    label: 'after deferred flush',
    postInteractionSettleFrames: 3
  }
] satisfies RuntimeMutationTraceWindowDescriptor[]

const runtimeMutationDiagnosticRuleStates = [
  {
    id: 'cold-temp-rules',
    label: 'cold temporary rules',
    preseedTempRules: false
  },
  {
    id: 'preseed-temp-rules',
    label: 'preseeded temporary rules',
    preseedTempRules: true
  }
] satisfies RuntimeMutationRuleStateDescriptor[]

export async function writeRuntimeMutationDiagnosticsReport() {
  const report = await createRuntimeMutationDiagnosticsReport()
  return writeBenchmarkReport(report)
}

function createRuntimeMutationDiagnosticVariants(): BenchmarkVariant[] {
  return runtimeMutationDiagnosticFixtureIds.flatMap((fixtureId) => runtimeMutationDiagnosticModeIds.flatMap((modeId) => (
    runtimeMutationDiagnosticTraceWindows.flatMap((traceWindow) => runtimeMutationDiagnosticRuleStates.map((ruleState) => ({
      id: createRuntimeMutationDiagnosticVariantId(fixtureId, modeId, traceWindow.id, ruleState.id),
      fixtureId,
      adapterId: modeId,
      label: `${fixtureId} / ${formatModeLabel(modeId)} / ${traceWindow.label} / ${ruleState.label}`
    })))
  )))
}

function createRuntimeMutationDiagnosticVariantId(
  fixtureId: BenchmarkFixtureId,
  modeId: InteractionModeId,
  traceWindowId: RuntimeMutationTraceWindowId,
  ruleStateId: RuntimeMutationRuleStateId
) {
  const baseId = createInteractionVariantId(fixtureId, modeId, 'mutation-cleanup-cycle')
  return `${baseId}-${traceWindowId}-${ruleStateId}`
}

async function createRuntimeMutationDiagnosticsReport(): Promise<BenchmarkReport> {
  validateFixtures(benchmarkFixtures)

  const variants = createRuntimeMutationDiagnosticVariants()
  const samples: BenchmarkSample[] = []
  const artifacts: BenchmarkArtifact[] = []
  const rounds = getRuntimeMutationDiagnosticRounds()
  console.log('Launching Chromium for runtime mutation diagnostics')
  const browser = await chromium.launch({ headless: true })
  const browserVersion = browser.version()

  try {
    for (const fixtureId of runtimeMutationDiagnosticFixtureIds) {
      for (const modeId of runtimeMutationDiagnosticModeIds) {
        for (const traceWindow of runtimeMutationDiagnosticTraceWindows) {
          for (const ruleState of runtimeMutationDiagnosticRuleStates) {
            const variantId = createRuntimeMutationDiagnosticVariantId(fixtureId, modeId, traceWindow.id, ruleState.id)
            console.log(`Preparing runtime mutation diagnostic page for ${variantId}`)
            const page = await createInteractionPage({
              fixtureId,
              modeId,
              scenarioId: 'mutation-cleanup-cycle',
              variantId,
              pageSuite: 'runtime-mutation-diagnostics',
              runtimeDiagnostics: true,
              postInteractionSettleFrames: traceWindow.postInteractionSettleFrames
            })

            artifacts.push(...page.artifacts)
            for (let round = 0; round < rounds; round++) {
              console.log(`Measuring runtime mutation diagnostics for ${variantId}, round ${round + 1}/${rounds}`)
              const result = await measureRuntimeMutationDiagnostic({
                browser,
                pageRoot: page.root,
                variantId,
                modeId,
                traceWindow,
                ruleState,
                round
              })

              samples.push(...result.samples)
              artifacts.push(...result.artifacts)
            }
          }
        }
      }
    }
  } finally {
    await browser.close()
  }

  const metricUnits = new Map(runtimeMutationDiagnosticMetrics.map((metric) => [metric.id, metric.unit as BenchmarkMetricUnit]))

  return {
    schemaVersion: 1,
    suite: 'runtime-mutation-diagnostics',
    generatedAt: new Date().toISOString(),
    environment: collectEnvironment(),
    browser: {
      name: 'Chromium',
      version: browserVersion
    },
    packages: await collectPackageVersions([
      '@master/css',
      '@master/css-runtime',
      '@master/css-server',
      '@master/css-preset',
      '@playwright/test'
    ]),
    fixtures: getRuntimeMutationDiagnosticFixtures(),
    adapters: getRuntimeMutationDiagnosticAdapters(),
    variants,
    metrics: runtimeMutationDiagnosticMetrics,
    samples,
    summary: summarizeReportSamples(samples, metricUnits),
    limits: [
      'This suite is diagnostic-only and measures Master CSS runtime/progressive mutation cleanup internals.',
      'Only the dynamic and stress-dom fixtures are measured, using the interaction-cost mutation-cleanup-cycle scenario.',
      'The trace-window axis compares ending trace collection before the deferred product cleanup flush with keeping the current post-interaction settle window.',
      'The rule-state axis compares first-time temporary rule generation with preseeded temporary runtime rules.',
      'Instrumentation is injected into the benchmark page harness; @master/css-runtime source and public behavior are not changed.',
      'MutationObserver and CSSRuntime.ensureClassRules/deleteClassRules wrappers add measurement overhead, so use these numbers to localize costs, not as public performance claims.',
      'Progressive variants fail if they fall back to runtime rendering before the cleanup scenario.',
      'Trace-derived event names can change across Chromium versions, so raw trace artifacts are kept for review before optimization work.'
    ],
    artifacts
  }
}

async function measureRuntimeMutationDiagnostic(options: {
  browser: Browser
  pageRoot: string
  variantId: string
  modeId: InteractionModeId
  traceWindow: RuntimeMutationTraceWindowDescriptor
  ruleState: RuntimeMutationRuleStateDescriptor
  round: number
}): Promise<RuntimeMutationDiagnosticMeasurement> {
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
      await assertRuntimeModeReady(page, options.modeId)
      const preseededRuntimeRuleCount = await preseedRuntimeTempRules(page, options.ruleState)

      const artifactRoot = resolve(benchmarkRoot, '.results', 'runtime-mutation-diagnostics', 'artifacts', options.variantId, `round-${options.round}`)
      await resetDirectory(artifactRoot)

      const traceFile = resolve(artifactRoot, 'trace.json')
      const diagnosticsFile = resolve(artifactRoot, 'diagnostics.json')
      const screenshotFile = resolve(artifactRoot, 'screenshot.png')
      const runtimeStyleFile = resolve(artifactRoot, 'runtime-style.css')
      const result = await traceRuntimeMutationDiagnostic(page)
      const fullResult = {
        ...result,
        traceWindowId: options.traceWindow.id,
        ruleStateId: options.ruleState.id,
        postInteractionSettleFrameCount: options.traceWindow.postInteractionSettleFrames,
        preseededRuntimeRuleCount,
        consoleWarnings
      }

      assertRuntimeMutationDiagnosticResult(options.variantId, options.modeId, options.traceWindow.id, fullResult)
      await writeFile(traceFile, `${JSON.stringify({ traceEvents: result.events }, null, 2)}\n`)
      await writeRuntimeMutationDiagnosticArtifacts({
        file: diagnosticsFile,
        runtimeStyleFile,
        result: fullResult
      })
      await page.screenshot({ path: screenshotFile, fullPage: false })

      const artifactFiles = [
        traceFile,
        diagnosticsFile,
        screenshotFile
      ]
      if (result.interaction.runtimeStyleText) artifactFiles.push(runtimeStyleFile)

      return {
        samples: createRuntimeMutationDiagnosticSamples(options.variantId, options.round, fullResult),
        artifacts: await Promise.all(artifactFiles.map((file) => measureRelativeArtifact(file)))
      }
    } finally {
      await context.close()
    }
  } finally {
    await server.close()
  }
}

async function preseedRuntimeTempRules(page: Page, ruleState: RuntimeMutationRuleStateDescriptor) {
  if (!ruleState.preseedTempRules) return 0

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

async function traceRuntimeMutationDiagnostic(page: Page) {
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

  await client.send('Tracing.start', {
    categories: [
      'devtools.timeline',
      'disabled-by-default-devtools.timeline',
      'blink',
      'loading'
    ].join(','),
    transferMode: 'ReportEvents'
  })

  const traceWindowResult = await page.evaluate(async () => {
    const interaction = await globalThis.__runInteractionScenario()
    return {
      interaction,
      afterTraceState: globalThis.__readInteractionState(),
      runtimeDiagnostics: globalThis.__readRuntimeMutationDiagnostics()
    }
  })
  await client.send('Tracing.end')
  await tracingComplete
  await client.detach()

  const {
    interaction,
    afterTraceState,
    runtimeDiagnostics
  } = traceWindowResult
  const strategyFlush = await page.evaluate(() => (
    globalThis.__flushRuntimeMutationStrategy?.('after-trace') || {
      reason: 'after-trace',
      strategyId: 'baseline',
      flushed: false,
      callCount: 0,
      classCount: 0,
      durationMs: 0,
      queuedClassCountBeforeFlush: 0
    }
  )) as RuntimeMutationStrategyFlushResult
  await page.evaluate(() => globalThis.__waitInteractionFrames(3))
  const afterFlushState = await page.evaluate(() => globalThis.__readInteractionState())
  const cleanupAfterFlush = await page.evaluate(() => {
    const config = globalThis.__interactionConfig as {
      classes?: {
        temp?: string[]
      }
    }
    const state = globalThis.__readInteractionState()
    const tempClassNames = config.classes?.temp || []
    const runtimeClean = !state.runtimeAvailable || tempClassNames.every((className) => !state.classCounts[className])
    const scratch = document.getElementById('interaction-scratch')

    return {
      cleanupValid: scratch?.children.length === 0 && runtimeClean ? 1 : 0,
      runtimeClean: runtimeClean ? 1 : 0,
      scratchChildCount: scratch?.children.length || 0
    }
  })
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
  return {
    events,
    interaction,
    beforeState,
    afterTraceState,
    afterFlushState,
    afterForcedCleanupState,
    strategyFlush,
    forcedRetainedCleanup,
    cleanupAfterFlush,
    runtimeDiagnostics,
    traceMetrics: summarizeTraceEvents(events)
  }
}

async function writeRuntimeMutationDiagnosticArtifacts(options: {
  file: string
  runtimeStyleFile: string
  result: RuntimeMutationDiagnosticResult
}) {
  const { runtimeStyleText, ...interaction } = options.result.interaction
  await writeFile(options.file, `${JSON.stringify({
    interaction,
    traceMetrics: options.result.traceMetrics,
    runtimeDiagnostics: options.result.runtimeDiagnostics,
    forcedRetainedCleanup: options.result.forcedRetainedCleanup,
    traceWindowId: options.result.traceWindowId,
    ruleStateId: options.result.ruleStateId,
    postInteractionSettleFrameCount: options.result.postInteractionSettleFrameCount,
    preseededRuntimeRuleCount: options.result.preseededRuntimeRuleCount,
    beforeState: omitRuntimeStyleText(options.result.beforeState),
    afterTraceState: omitRuntimeStyleText(options.result.afterTraceState),
    afterFlushState: omitRuntimeStyleText(options.result.afterFlushState),
    strategyFlush: options.result.strategyFlush,
    cleanupAfterFlush: options.result.cleanupAfterFlush,
    consoleWarnings: options.result.consoleWarnings,
    runtimeStyleTextArtifact: runtimeStyleText ? 'runtime-style.css' : undefined
  }, null, 2)}\n`)
  if (runtimeStyleText) await writeFile(options.runtimeStyleFile, runtimeStyleText)
}

function assertRuntimeMutationDiagnosticResult(
  variantId: string,
  modeId: InteractionModeId,
  traceWindowId: RuntimeMutationTraceWindowId,
  result: RuntimeMutationDiagnosticResult
) {
  if (result.interaction.computedStyleValid !== 1) {
    throw new Error(`${variantId} failed computed-style validation.`)
  }

  if (traceWindowId === 'after-flush' && result.interaction.cleanupValid !== 1) {
    throw new Error(`${variantId} failed cleanup validation.`)
  }

  if (result.cleanupAfterFlush.cleanupValid !== 1) {
    throw new Error(`${variantId} failed cleanup validation after product flush.`)
  }

  if (countTemporaryClasses(result.afterFlushState, getTemporaryClassNames()) !== 0) {
    throw new Error(`${variantId} left temporary class counts after cleanup.`)
  }

  const temporaryClassNames = getTemporaryClassNames()
  const retainedTemporaryClassNames = temporaryClassNames.filter((className) => result.afterForcedCleanupState.retainedClassNames.includes(className))
  if (retainedTemporaryClassNames.length) {
    throw new Error(`${variantId} left retained temporary classes after forced cleanup: ${retainedTemporaryClassNames.join(', ')}.`)
  }

  const generatedTemporaryClassNames = temporaryClassNames.filter((className) => result.afterForcedCleanupState.classUtilityNames.includes(className))
  if (generatedTemporaryClassNames.length) {
    throw new Error(`${variantId} left generated temporary classes after forced cleanup: ${generatedTemporaryClassNames.join(', ')}.`)
  }

  if (modeId === 'master-progressive' && result.interaction.progressiveAdopted !== 1) {
    throw new Error(`${variantId} fell back from progressive hydration before diagnostics.`)
  }
}

async function waitForBenchmarkReady(page: Page) {
  await page.waitForFunction(() => (window as Window & { __benchmarkReady?: boolean }).__benchmarkReady === true, undefined, { timeout: 15000 })
}

async function assertRuntimeModeReady(page: Page, modeId: InteractionModeId) {
  const state = await page.evaluate(() => ({
    ready: document.documentElement.dataset.benchmarkReady,
    textAlign: getComputedStyle(document.getElementById('interaction-style-probe')!).textAlign,
    runtimeAvailable: Boolean(globalThis.masterCSSRuntime),
    progressive: Boolean(globalThis.masterCSSRuntime?.progressive),
    htmlHidden: document.documentElement.hasAttribute('hidden')
  }))

  if (state.ready !== 'true') {
    throw new Error('Runtime mutation diagnostic page did not set the ready marker.')
  }

  if (state.textAlign !== 'center') {
    throw new Error(`Expected interaction style probe text-align:center, received ${state.textAlign}.`)
  }

  if (!state.runtimeAvailable) {
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
    throw new Error('Unable to allocate local runtime mutation diagnostic server port.')
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

function getRuntimeMutationDiagnosticFixtures(): BenchmarkFixture[] {
  return runtimeMutationDiagnosticFixtureIds.map((id) => {
    const fixture = benchmarkFixtures.find((candidate) => candidate.id === id)
    if (!fixture) throw new Error(`Missing benchmark fixture: ${id}`)
    return fixture
  })
}

function getRuntimeMutationDiagnosticAdapters(): BenchmarkAdapter[] {
  const ids = new Set(runtimeMutationDiagnosticModeIds)
  return benchmarkAdapters.filter((adapter) => ids.has(adapter.id as typeof runtimeMutationDiagnosticModeIds[number]))
}

function omitRuntimeStyleText(state: RuntimeState) {
  const { runtimeStyleText: _runtimeStyleText, ...rest } = state
  return rest
}

function formatModeLabel(modeId: InteractionModeId) {
  return modeId === 'master-progressive'
    ? 'Master CSS progressive'
    : 'Master CSS runtime'
}

function getRuntimeMutationDiagnosticRounds() {
  const value = Number(process.env.RUNTIME_MUTATION_DIAGNOSTIC_ROUNDS || process.env.BENCHMARK_ROUNDS || 3)
  if (!Number.isFinite(value) || value < 1) return 3
  return Math.floor(value)
}
