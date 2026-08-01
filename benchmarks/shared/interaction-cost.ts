import { createServer, type Server } from 'node:http'
import { existsSync } from 'node:fs'
import { readFile, writeFile } from 'node:fs/promises'
import { extname, isAbsolute, relative, resolve } from 'node:path'
import { performance } from 'node:perf_hooks'
import { chromium, type Browser, type Page } from '@playwright/test'
import { renderHTML } from '@master/css-server'
import type { MasterCSSManifest } from '@master/css-schema/manifest'
import { benchmarkAdapters, benchmarkFixtures } from '../fixtures/manifest'
import { summarizeBytes } from './bytes'
import { collectEnvironment, collectPackageVersions } from './environment'
import { validateFixtures } from './fixtures'
import { addRuntimeHarness, addStaticHarness } from './interaction-cost-harness'
import { interactionCostMetrics } from './interaction-cost-metrics'
import { renderInteractionDocument } from './interaction-cost-page'
import {
  benchmarkRoot,
  measureRelativeArtifact,
  resetDirectory,
  resolveBenchmarkPackageFile,
  runCommand,
  writeWorkspaceFiles
} from './runner'
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

import { fixedViewport, interactionFixtureIds, interactionModes, interactionScenarios } from './interaction-cost-config'
import type { ChromeTraceEvent, InteractionClassModel, InteractionMeasurement, InteractionModeDescriptor, InteractionModeId, InteractionPage, InteractionPageSuite, InteractionResult, InteractionScenarioId, RetainedRuleState, RuntimeMutationStrategyId, RuntimeState } from './interaction-cost-config'
export { interactionFixtureIds, interactionModes, interactionScenarios } from './interaction-cost-config'
export type { InteractionModeId, InteractionPage, InteractionPageSuite, InteractionResult, InteractionScenarioId, RetainedRuleState, RuntimeMutationStrategyId, RuntimeState } from './interaction-cost-config'

const masterClasses = {
  family: 'master',
  body: ['m:0', 'min-h:100vh', 'bg:gray-5', 'fg:slate-90', 'font:14px', 'font:system'],
  shell: ['max-w:1180px', 'mx:auto', 'p:6x', 'grid', 'gap:5x'],
  header: ['p:5x', 'r:12px', 'bg:white', 'border:1px|solid|gray-20', 'grid', 'gap:2x'],
  title: ['m:0', 'font:32px', 'font:heavy', 'tracking:-.02em'],
  subtitle: ['m:0', 'fg:slate-60', 'leading:1.6'],
  grid: ['grid', 'grid-cols:4', 'gap:3x'],
  itemBase: ['interaction-item', 'p:3x', 'r:10px', 'border:1px|solid|gray-20', 'min-h:72px'],
  itemLight: ['bg:white', 'fg:slate-80'],
  itemActive: ['bg:blue-60', 'fg:white'],
  itemDark: ['bg:slate-90', 'fg:white'],
  itemNew: ['outline:2px|solid|red-60'],
  itemTemp: ['fg:green-60', 'w:1px'],
  itemTitle: ['block', 'font:13px', 'font:semibold'],
  itemMeta: ['block', 'font:12px', 'fg:slate-50', 'mt:1x'],
  panel: ['p:4x', 'r:12px', 'bg:white', 'border:1px|solid|gray-20'],
  button: ['h:40px', 'px:4x', 'r:8px', 'border:0', 'bg:blue-60', 'fg:white', 'font:13px', 'font:semibold']
} satisfies InteractionClassModel

const tailwindClasses = {
  family: 'tailwind',
  body: ['m-0', 'min-h-screen', 'bg-slate-50', 'text-slate-900', 'text-sm'],
  shell: ['max-w-7xl', 'mx-auto', 'p-6', 'grid', 'gap-5'],
  header: ['p-5', 'rounded-xl', 'bg-white', 'border', 'border-slate-200', 'grid', 'gap-2'],
  title: ['m-0', 'text-3xl', 'font-black', 'tracking-tight'],
  subtitle: ['m-0', 'text-slate-600', 'leading-relaxed'],
  grid: ['grid', 'grid-cols-4', 'gap-3'],
  itemBase: ['interaction-item', 'p-3', 'rounded-lg', 'border', 'border-slate-200', 'min-h-[72px]'],
  itemLight: ['bg-white', 'text-slate-800'],
  itemActive: ['bg-blue-600', 'text-white'],
  itemDark: ['bg-slate-900', 'text-white'],
  itemNew: ['outline-2', 'outline-red-600'],
  itemTemp: ['text-green-600', 'w-px'],
  itemTitle: ['block', 'text-xs', 'font-semibold'],
  itemMeta: ['block', 'text-xs', 'text-slate-500', 'mt-1'],
  panel: ['p-4', 'rounded-xl', 'bg-white', 'border', 'border-slate-200'],
  button: ['h-10', 'px-4', 'rounded-lg', 'border-0', 'bg-blue-600', 'text-white', 'text-xs', 'font-semibold']
} satisfies InteractionClassModel

const masterStaticCSSCache = new Map<BenchmarkFixtureId, Promise<string>>()
const tailwindStaticCSSCache = new Map<BenchmarkFixtureId, Promise<string>>()
let runtimeBundlePromise: Promise<Buffer> | undefined
let defaultManifestJSONPromise: Promise<Buffer> | undefined
let defaultManifestPromise: Promise<MasterCSSManifest> | undefined

export async function writeInteractionCostReport() {
  const report = await createInteractionCostReport()
  return writeBenchmarkReport(report)
}

export function createInteractionVariants(): BenchmarkVariant[] {
  return interactionFixtureIds.flatMap((fixtureId) => interactionModes.flatMap((mode) => (
    interactionScenarios
      .filter((scenario) => isScenarioSupported(fixtureId, mode.id, scenario.id))
      .map((scenario) => ({
        id: createInteractionVariantId(fixtureId, mode.id, scenario.id),
        fixtureId,
        adapterId: mode.adapterId,
        label: `${fixtureId} / ${mode.label} / ${scenario.label}`,
        limits: scenario.id === 'new-class-toggle'
          ? ['Static variants are intentionally excluded because this scenario measures Master runtime rule generation.']
          : undefined
      }))
  )))
}

export function createInteractionVariantId(fixtureId: BenchmarkFixtureId, modeId: InteractionModeId, scenarioId: InteractionScenarioId) {
  return `${fixtureId}-${modeId}-${scenarioId}`
}

export function getInteractionCostAdapters(): BenchmarkAdapter[] {
  const ids = new Set(interactionModes.map((mode) => mode.adapterId))
  return benchmarkAdapters.filter((adapter) => ids.has(adapter.id as InteractionModeDescriptor['adapterId']))
}

async function createInteractionCostReport(): Promise<BenchmarkReport> {
  validateFixtures(benchmarkFixtures)

  const variants = createInteractionVariants()
  const samples: BenchmarkSample[] = []
  const artifacts: BenchmarkArtifact[] = []
  const rounds = getInteractionCostRounds()
  const warmupRounds = getInteractionCostWarmupRounds()
  console.log('Launching Chromium for interaction cost benchmark')
  const browser = await chromium.launch({ headless: true })
  const browserVersion = browser.version()

  try {
    for (const fixtureId of interactionFixtureIds) {
      for (const mode of interactionModes) {
        for (const scenario of interactionScenarios) {
          if (!isScenarioSupported(fixtureId, mode.id, scenario.id)) continue
          const variantId = createInteractionVariantId(fixtureId, mode.id, scenario.id)
          console.log(`Preparing interaction page for ${variantId}`)
          const page = await createInteractionPage({
            fixtureId,
            modeId: mode.id,
            scenarioId: scenario.id,
            variantId
          })

          artifacts.push(...page.artifacts)
          await collectInteractionSamples({
            browser,
            pageRoot: page.root,
            variantId,
            modeId: mode.id,
            scenarioId: scenario.id,
            rounds,
            warmupRounds,
            samples,
            artifacts
          })
        }
      }
    }
  } finally {
    await browser.close()
  }

  const metricUnits = new Map(interactionCostMetrics.map((metric) => [metric.id, metric.unit as BenchmarkMetricUnit]))

  return {
    schemaVersion: 1,
    suite: 'interaction-cost',
    generatedAt: new Date().toISOString(),
    environment: collectEnvironment(),
    browser: {
      name: 'Chromium',
      version: browserVersion
    },
    packages: await collectPackageVersions([
      '@master/css',
      '@master/css-cli',
      '@master/css-runtime',
      '@master/css-server',
      '@master/css-preset',
      '@playwright/test',
      'tailwindcss',
      '@tailwindcss/cli'
    ]),
    fixtures: getInteractionFixtures(),
    adapters: getInteractionCostAdapters(),
    variants,
    metrics: interactionCostMetrics,
    samples,
    summary: summarizeReportSamples(samples, metricUnits),
    limits: [
      'This suite measures local Chromium post-load interaction cost only; it does not publish public result tables yet.',
      'The default command is a fast internal pass with one measured round and no warmup; use INTERACTION_COST_ROUNDS and INTERACTION_COST_WARMUP_ROUNDS for review-grade repeated samples.',
      'Master runtime and progressive variants use the built global runtime bundle and default manifest JSON.',
      'Master progressive samples fail if the page falls back to runtime rendering before the measured interaction.',
      'Master static and Tailwind static variants are static-CSS browser controls; Tailwind CSS has no runtime rule-generation equivalent.',
      'The new-class scenario is limited to Master runtime and progressive variants because it measures client-side rule generation.',
      'Trace-derived event names can change across Chromium versions, so raw trace artifacts are kept for review before publishing public conclusions.',
      'Browser scheduling, hardware, memory pressure, and unrelated local load can affect interaction timing.'
    ],
    artifacts
  }
}

async function collectInteractionSamples(options: {
  browser: Browser
  pageRoot: string
  variantId: string
  modeId: InteractionModeId
  scenarioId: InteractionScenarioId
  rounds: number
  warmupRounds: number
  samples: BenchmarkSample[]
  artifacts: BenchmarkArtifact[]
}) {
  for (let warmupRound = 0; warmupRound < options.warmupRounds; warmupRound++) {
    console.log(`Warming interaction cost for ${options.variantId}, warmup ${warmupRound + 1}/${options.warmupRounds}`)
    await measureInteractionCost({
      browser: options.browser,
      pageRoot: options.pageRoot,
      variantId: options.variantId,
      modeId: options.modeId,
      scenarioId: options.scenarioId,
      round: -warmupRound - 1
    })
  }

  for (let round = 0; round < options.rounds; round++) {
    console.log(`Measuring interaction cost for ${options.variantId}, round ${round + 1}/${options.rounds}`)
    const result = await measureInteractionCost({
      browser: options.browser,
      pageRoot: options.pageRoot,
      variantId: options.variantId,
      modeId: options.modeId,
      scenarioId: options.scenarioId,
      round
    })

    options.samples.push(...result.samples)
    if (round === options.rounds - 1) options.artifacts.push(...result.artifacts)
  }
}

export async function createInteractionPage(options: {
  fixtureId: BenchmarkFixtureId
  modeId: InteractionModeId
  scenarioId: InteractionScenarioId
  variantId: string
  pageSuite?: InteractionPageSuite
  runtimeDiagnostics?: boolean
  runtimeMutationStrategy?: RuntimeMutationStrategyId
  postInteractionSettleFrames?: number
}): Promise<InteractionPage> {
  if (options.modeId === 'tailwind-static') {
    const sourceHtml = renderInteractionDocument({
      fixtureId: options.fixtureId,
      modeId: options.modeId,
      scenarioId: options.scenarioId,
      classes: tailwindClasses,
      includeStaticClassSource: true,
      postInteractionSettleFrames: options.postInteractionSettleFrames
    })
    return writeInteractionPage({
      pageSuite: options.pageSuite,
      variantId: options.variantId,
      html: addStaticHarness(sourceHtml),
      externalCSS: await readTailwindStaticCSS(options.fixtureId)
    })
  }

  const sourceHtml = renderInteractionDocument({
    fixtureId: options.fixtureId,
    modeId: options.modeId,
    scenarioId: options.scenarioId,
    classes: masterClasses,
    includeStaticClassSource: options.modeId === 'master-static',
    runtimeMutationStrategy: options.runtimeMutationStrategy,
    postInteractionSettleFrames: options.postInteractionSettleFrames
  })

  if (options.modeId === 'master-static') {
    return writeInteractionPage({
      pageSuite: options.pageSuite,
      variantId: options.variantId,
      html: addStaticHarness(sourceHtml),
      externalCSS: await readMasterStaticCSS(options.fixtureId)
    })
  }

  if (options.modeId === 'master-runtime') {
    return writeInteractionPage({
      pageSuite: options.pageSuite,
      variantId: options.variantId,
      html: addRuntimeHarness(sourceHtml, {
        hideUntilRuntime: true,
        runtimeDiagnostics: options.runtimeDiagnostics,
        runtimeMutationStrategy: options.runtimeMutationStrategy
      }),
      runtimeJS: await readRuntimeBundle(),
      manifestJSON: await readDefaultManifestJSON()
    })
  }

  const result = renderHTML(sourceHtml, {
    manifest: await readDefaultManifest(),
    hydrationManifest: 'inject'
  })
  const inlineCSS = result.cssText
  const hydrationManifestJSON = result.hydrationManifest
    ? JSON.stringify(result.hydrationManifest)
    : ''

  return writeInteractionPage({
    pageSuite: options.pageSuite,
    variantId: options.variantId,
    html: addRuntimeHarness(result.html, {
      hideUntilRuntime: false,
      runtimeDiagnostics: options.runtimeDiagnostics,
      runtimeMutationStrategy: options.runtimeMutationStrategy
    }),
    inlineCSS,
    hydrationManifestJSON,
    runtimeJS: await readRuntimeBundle(),
    manifestJSON: await readDefaultManifestJSON()
  })
}

async function measureInteractionCost(options: {
  browser: Browser
  pageRoot: string
  variantId: string
  modeId: InteractionModeId
  scenarioId: InteractionScenarioId
  round: number
}): Promise<InteractionMeasurement> {
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
      await assertInteractionPageReady(page, options.modeId)

      const artifactRoot = resolve(benchmarkRoot, '.results', 'interaction-cost', 'artifacts', options.variantId, `round-${options.round}`)
      await resetDirectory(artifactRoot)

      const traceFile = resolve(artifactRoot, 'trace.json')
      const screenshotFile = resolve(artifactRoot, 'screenshot.png')
      const diagnosticsFile = resolve(artifactRoot, 'interaction.json')
      const runtimeStyleFile = resolve(artifactRoot, 'runtime-style.css')
      const traceResult = await traceInteraction(page, options.scenarioId)

      await writeFile(traceFile, `${JSON.stringify({ traceEvents: traceResult.events }, null, 2)}\n`)
      await writeInteractionDiagnostics({
        file: diagnosticsFile,
        runtimeStyleFile,
        result: traceResult.result,
        traceMetrics: traceResult.traceMetrics,
        consoleWarnings
      })
      await page.screenshot({ path: screenshotFile, fullPage: false })

      const artifactFiles = [
        traceFile,
        screenshotFile,
        diagnosticsFile
      ]
      if (traceResult.result.runtimeStyleText) artifactFiles.push(runtimeStyleFile)

      return {
        samples: createInteractionSamples(options.variantId, options.round, {
          ...traceResult.result,
          ...traceResult.traceMetrics
        }),
        artifacts: await Promise.all(artifactFiles.map((file) => measureRelativeArtifact(file)))
      }
    } finally {
      await context.close()
    }
  } finally {
    await server.close()
  }
}

async function traceInteraction(page: Page, scenarioId: InteractionScenarioId) {
  const context = page.context()
  const client = await context.newCDPSession(page)
  const events: ChromeTraceEvent[] = []
  const tracingComplete = new Promise<void>((resolveComplete) => {
    client.once('Tracing.tracingComplete', () => resolveComplete())
  })

  client.on('Tracing.dataCollected', (event: { value?: ChromeTraceEvent[] }) => {
    if (event.value) events.push(...event.value)
  })

  await client.send('Tracing.start', {
    categories: [
      'devtools.timeline',
      'disabled-by-default-devtools.timeline',
      'blink',
      'loading'
    ].join(','),
    transferMode: 'ReportEvents'
  })

  const result = scenarioId === 'viewport-resize'
    ? await measureViewportResizeInteraction(page)
    : await page.evaluate(() => globalThis.__runInteractionScenario())

  await client.send('Tracing.end')
  await tracingComplete
  await client.detach()

  if (scenarioId === 'mutation-cleanup-cycle') {
    const forcedRetainedCleanup = await page.evaluate(() => {
      const runtime = globalThis.masterCSSRuntime as {
        flushRetainedClassRules?: () => number
        retainedClassNames?: Set<string>
      } | undefined
      const beforeRetainedClassCount = runtime?.retainedClassNames?.size || 0
      const startedAt = performance.now()
      const removedClassCount = runtime?.flushRetainedClassRules?.() || 0
      return {
        beforeRetainedClassCount,
        removedClassCount,
        durationMs: performance.now() - startedAt,
        afterRetainedClassCount: runtime?.retainedClassNames?.size || 0
      }
    })
    result.details = {
      ...result.details,
      forcedRetainedCleanup
    }
  }

  return {
    events,
    result,
    traceMetrics: summarizeTraceEvents(events)
  }
}

async function measureViewportResizeInteraction(page: Page): Promise<InteractionResult> {
  const before = await page.evaluate(() => globalThis.__readInteractionState())
  const beforeWidth = await page.evaluate(() => document.querySelector<HTMLElement>('.interaction-grid')!.getBoundingClientRect().width)
  const startedAt = performance.now()
  await page.setViewportSize({
    width: 920,
    height: fixedViewport.height
  })
  await page.evaluate(() => globalThis.__waitInteractionFrames(3))
  const resizedWidth = await page.evaluate(() => document.querySelector<HTMLElement>('.interaction-grid')!.getBoundingClientRect().width)
  await page.setViewportSize(fixedViewport)
  await page.evaluate(() => globalThis.__waitInteractionFrames(2))

  return page.evaluate((input) => globalThis.__finishViewportInteraction(input), {
    before,
    beforeWidth,
    resizedWidth,
    elapsedMs: performance.now() - startedAt
  })
}

async function writeInteractionPage(options: {
  pageSuite?: InteractionPageSuite
  variantId: string
  html: string
  externalCSS?: string
  inlineCSS?: string
  runtimeJS?: Buffer
  manifestJSON?: Buffer
  hydrationManifestJSON?: string
}): Promise<InteractionPage> {
  const root = resolve(benchmarkRoot, '.results', options.pageSuite || 'interaction-cost', 'pages', options.variantId)
  await resetDirectory(root)

  const files: Record<string, string> = {
    'index.html': options.html
  }
  if (options.externalCSS !== undefined) files['style.css'] = options.externalCSS
  if (options.inlineCSS !== undefined) files['inline-master-css.css'] = options.inlineCSS
  if (options.hydrationManifestJSON !== undefined) files['hydration-manifest.json'] = options.hydrationManifestJSON
  if (options.runtimeJS) files['global.min.js'] = options.runtimeJS.toString('utf8')
  if (options.manifestJSON) files['default-manifest.json'] = options.manifestJSON.toString('utf8')

  await writeWorkspaceFiles(root, files)

  return {
    root,
    artifacts: await Promise.all(Object.keys(files).map((file) => measureRelativeArtifact(resolve(root, file))))
  }
}

function createInteractionSamples(variantId: string, round: number, metrics: InteractionResult & {
  styleRecalculationMs: number
  layoutMs: number
  paintMs: number
  longTaskCount: number
}): BenchmarkSample[] {
  return [
    {
      metricId: 'interaction-ready-ms',
      variantId,
      round,
      value: metrics.elapsedMs
    },
    {
      metricId: 'runtime-mutation-ms',
      variantId,
      round,
      value: metrics.runtimeMutationMs
    },
    {
      metricId: 'runtime-generated-rule-count-delta',
      variantId,
      round,
      value: metrics.runtimeGeneratedRuleCountDelta
    },
    {
      metricId: 'runtime-style-raw-bytes-delta',
      variantId,
      round,
      value: metrics.runtimeStyleRawBytesDelta
    },
    {
      metricId: 'style-recalculation-ms',
      variantId,
      round,
      value: metrics.styleRecalculationMs
    },
    {
      metricId: 'layout-ms',
      variantId,
      round,
      value: metrics.layoutMs
    },
    {
      metricId: 'paint-ms',
      variantId,
      round,
      value: metrics.paintMs
    },
    {
      metricId: 'long-task-count',
      variantId,
      round,
      value: metrics.longTaskCount
    },
    {
      metricId: 'dom-node-count',
      variantId,
      round,
      value: metrics.domNodeCount
    },
    {
      metricId: 'affected-element-count',
      variantId,
      round,
      value: metrics.affectedElementCount
    },
    {
      metricId: 'computed-style-valid',
      variantId,
      round,
      value: metrics.computedStyleValid
    },
    {
      metricId: 'cleanup-valid',
      variantId,
      round,
      value: metrics.cleanupValid
    },
    {
      metricId: 'progressive-adopted',
      variantId,
      round,
      value: metrics.progressiveAdopted
    }
  ]
}

async function writeInteractionDiagnostics(options: {
  file: string
  runtimeStyleFile: string
  result: InteractionResult
  traceMetrics: {
    styleRecalculationMs: number
    layoutMs: number
    paintMs: number
    longTaskCount: number
  }
  consoleWarnings: string[]
}) {
  const { runtimeStyleText, ...result } = options.result
  await writeFile(options.file, `${JSON.stringify({
    result,
    traceMetrics: options.traceMetrics,
    consoleWarnings: options.consoleWarnings,
    runtimeStyleTextArtifact: runtimeStyleText ? 'runtime-style.css' : undefined
  }, null, 2)}\n`)
  if (runtimeStyleText) await writeFile(options.runtimeStyleFile, runtimeStyleText)
}

async function readMasterStaticCSS(fixtureId: BenchmarkFixtureId) {
  let promise = masterStaticCSSCache.get(fixtureId)
  if (!promise) {
    promise = (async () => {
      const sourceHtml = renderInteractionDocument({
        fixtureId,
        modeId: 'master-static',
        scenarioId: 'existing-class-toggle',
        classes: masterClasses,
        includeStaticClassSource: true
      })
      const result = renderHTML(sourceHtml, {
        manifest: await readDefaultManifest(),
        hydrationManifest: false
      })
      return result.cssText
    })()
    masterStaticCSSCache.set(fixtureId, promise)
  }
  return promise
}

async function readTailwindStaticCSS(fixtureId: BenchmarkFixtureId) {
  let promise = tailwindStaticCSSCache.get(fixtureId)
  if (!promise) {
    promise = (async () => {
      const workspace = resolve(benchmarkRoot, '.results', 'interaction-cost', 'workspaces', `${fixtureId}-tailwind-static`)
      await resetDirectory(workspace)
      const html = renderInteractionDocument({
        fixtureId,
        modeId: 'tailwind-static',
        scenarioId: 'existing-class-toggle',
        classes: tailwindClasses,
        includeStaticClassSource: true
      })
      await writeWorkspaceFiles(workspace, {
        'package.json': JSON.stringify({
          private: true,
          type: 'module'
        }, null, 2) + '\n',
        'index.html': html,
        'input.css': '@import "tailwindcss";\n@source "./index.html";\n'
      })
      await resetDirectory(resolve(workspace, 'dist'))
      await runCommand(
        process.execPath,
        [
          resolveBenchmarkPackageFile('@tailwindcss/cli', 'dist/index.mjs'),
          '-i',
          'input.css',
          '-o',
          'dist/output.css'
        ],
        workspace
      )
      return (await readFile(resolve(workspace, 'dist/output.css'))).toString('utf8')
    })()
    tailwindStaticCSSCache.set(fixtureId, promise)
  }
  return promise
}

async function waitForBenchmarkReady(page: Page) {
  await page.waitForFunction(() => (window as Window & { __benchmarkReady?: boolean }).__benchmarkReady === true, undefined, { timeout: 15000 })
}

async function assertInteractionPageReady(page: Page, modeId: InteractionModeId) {
  const state = await page.evaluate(() => {
    const runtime = (globalThis as typeof globalThis & {
      masterCSSRuntime?: {
        progressive?: boolean
      }
    }).masterCSSRuntime

    return {
      ready: document.documentElement.dataset.benchmarkReady,
      textAlign: getComputedStyle(document.getElementById('interaction-style-probe')!).textAlign,
      runtimeAvailable: Boolean(runtime),
      progressive: Boolean(runtime?.progressive),
      htmlHidden: document.documentElement.hasAttribute('hidden')
    }
  })

  if (state.ready !== 'true') {
    throw new Error('Interaction benchmark page did not set the ready marker.')
  }

  if (state.textAlign !== 'center') {
    throw new Error(`Expected interaction style probe text-align:center, received ${state.textAlign}.`)
  }

  if ((modeId === 'master-runtime' || modeId === 'master-progressive') && !state.runtimeAvailable) {
    throw new Error(`${modeId} did not expose globalThis.masterCSSRuntime.`)
  }

  if (modeId === 'master-progressive' && !state.progressive) {
    throw new Error('Master progressive interaction page fell back to runtime rendering before measurement.')
  }

  if (modeId === 'master-runtime' && state.htmlHidden) {
    throw new Error('Master runtime interaction page did not reveal the hidden html element.')
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
    throw new Error('Unable to allocate local interaction benchmark server port.')
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

function getInteractionFixtures(): BenchmarkFixture[] {
  return interactionFixtureIds.map((id) => {
    const fixture = benchmarkFixtures.find((candidate) => candidate.id === id)
    if (!fixture) throw new Error(`Missing benchmark fixture: ${id}`)
    return fixture
  })
}

function isScenarioSupported(fixtureId: BenchmarkFixtureId, modeId: InteractionModeId, scenarioId: InteractionScenarioId) {
  if (scenarioId === 'new-class-toggle') {
    return fixtureId === 'dynamic' && (modeId === 'master-runtime' || modeId === 'master-progressive')
  }

  if (fixtureId === 'dashboard') {
    return scenarioId !== 'mutation-cleanup-cycle'
  }

  if (fixtureId === 'stress-dom') {
    return scenarioId !== 'theme-switch'
  }

  return true
}

async function readRuntimeBundle() {
  if (!runtimeBundlePromise) {
    runtimeBundlePromise = (async () => {
      const file = resolveBenchmarkPackageFile('@master/css-runtime', 'dist/global.min.js')
      assertExistingFile(file, 'Run `pnpm --filter @master/css-runtime build` before `bench:interaction-cost`.')
      return readFile(file)
    })()
  }
  return runtimeBundlePromise
}

async function readDefaultManifestJSON() {
  if (!defaultManifestJSONPromise) {
    defaultManifestJSONPromise = (async () => {
      const file = resolveBenchmarkPackageFile('@master/css-preset', 'src/default-manifest.json')
      assertExistingFile(file, 'Expected @master/css-preset default manifest to exist.')
      return readFile(file)
    })()
  }
  return defaultManifestJSONPromise
}

async function readDefaultManifest() {
  if (!defaultManifestPromise) {
    defaultManifestPromise = readDefaultManifestJSON()
      .then((buffer) => JSON.parse(buffer.toString('utf8')) as MasterCSSManifest)
  }
  return defaultManifestPromise
}

function assertExistingFile(file: string, message: string) {
  if (!existsSync(file)) {
    throw new Error(`Missing file: ${file}\n${message}`)
  }
}

function getInteractionCostRounds() {
  const value = Number(process.env.INTERACTION_COST_ROUNDS || process.env.BENCHMARK_ROUNDS || 1)
  if (!Number.isFinite(value) || value < 1) return 1
  return Math.floor(value)
}

function getInteractionCostWarmupRounds() {
  const value = Number(process.env.INTERACTION_COST_WARMUP_ROUNDS || 0)
  if (!Number.isFinite(value) || value < 0) return 0
  return Math.floor(value)
}

declare global {
  var __interactionConfig: unknown
  var __interactionMetrics: {
    error?: string
    runtimeDiagnosticsEnabled?: boolean
    runtimeMutationStrategyId?: RuntimeMutationStrategyId
    runtimeMutationMs: number
    collectInteractionMutations: boolean
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
    runtimeDeferredRemoveCallCount?: number
    runtimeDeferredRemoveClassCount?: number
    runtimeSuppressedRemoveCallCount?: number
    runtimeSuppressedRemoveClassCount?: number
    runtimeFlushRemoveCallCount?: number
    runtimeFlushRemoveClassCount?: number
    runtimeFlushRemoveDurationMs?: number
    runtimeQueuedRemoveClassCount?: number
    runtimeRemoveQueue?: {
      runtime: unknown
      classNames: string[]
    }[]
  } | undefined
  var __flushRuntimeMutationStrategy: ((reason: string) => {
    reason: string
    strategyId: RuntimeMutationStrategyId
    flushed: boolean
    callCount: number
    classCount: number
    durationMs: number
    queuedClassCountBeforeFlush: number
  }) | undefined
  var __runInteractionScenario: () => Promise<InteractionResult>
  var __readInteractionState: () => RuntimeState
  var __readRuntimeMutationDiagnostics: () => {
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
  var __waitInteractionFrames: (count: number) => Promise<void>
  var __finishViewportInteraction: (input: {
    before: RuntimeState
    beforeWidth: number
    resizedWidth: number
    elapsedMs: number
  }) => InteractionResult

  interface Window {
    __benchmarkReady?: boolean
  }
}
