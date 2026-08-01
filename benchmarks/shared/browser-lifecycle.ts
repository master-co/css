import { existsSync } from 'node:fs'
import { copyFile, mkdir, readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { performance } from 'node:perf_hooks'
import { chromium, type Browser } from '@playwright/test'
import { renderHTML } from '@master/css-server'
import type { MasterCSSManifest } from '@master/css-schema/manifest'
import { benchmarkAdapters, benchmarkFixtures } from '../fixtures/manifest'
import { browserLifecycleMetrics } from './browser-lifecycle-metrics'
import { measureBrowserLifecycle } from './browser-lifecycle-measurement'
import { addRuntimeHarness, addStaticHarness, renderLifecycleDocument } from './browser-lifecycle-page'
import { createDeliveredCSSStructureSamples, createPayloadSamples } from './browser-lifecycle-samples'
import { collectEnvironment, collectPackageVersions } from './environment'
import { validateFixtures } from './fixtures'
import {
  benchmarkRoot,
  findCSSFiles,
  measureRelativeArtifact,
  readFiles,
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

export type BrowserLifecycleModeId =
  | 'master-static'
  | 'master-runtime'
  | 'master-progressive'
  | 'tailwind-static'

export type BrowserLifecycleScenarioId =
  | 'initial-load'
  | 'large-dom'
  | 'large-append'
  | 'repeated-toggle'
  | 'theme-switch'
  | 'route-navigation'
  | 'long-session'

export type LifecycleFamily = 'master' | 'tailwind'
export type ThemeModel = 'class-swap' | 'data-attribute' | 'css-variable'
export type AppendRuleState = 'existing-rule' | 'new-rule'
export type BrowserLifecycleTraceArtifactMode = 'filtered' | 'raw' | 'off'

export interface ChromeTraceEvent {
  name?: string
  cat?: string
  ph?: string
  ts?: number
  dur?: number
  pid?: number
  tid?: number
}

export interface BrowserLifecycleTraceArtifact {
  mode: BrowserLifecycleTraceArtifactMode
  eventCount: number
  retainedEventCount: number
  content?: string
}

interface BrowserLifecycleModeDescriptor {
  id: BrowserLifecycleModeId
  adapterId: 'master-static' | 'master-runtime' | 'master-progressive' | 'tailwind-cli'
  label: string
}

interface BrowserLifecycleScenarioDescriptor {
  id: BrowserLifecycleScenarioId
  label: string
}

export interface BrowserLifecycleVariantSpec {
  scenarioId: BrowserLifecycleScenarioId
  fixtureId: BenchmarkFixtureId
  detailId: string
  detailLabel: string
  nodeTarget?: number
  appendCount?: number
  appendRuleState?: AppendRuleState
  toggleRounds?: number
  themeModel?: ThemeModel
  longSessionMs?: number
}

export interface BrowserLifecycleVariant extends BenchmarkVariant {
  scenarioId: BrowserLifecycleScenarioId
  modeId: BrowserLifecycleModeId
  detailId: string
  detailLabel: string
}

interface BrowserLifecycleSelection {
  enabledScenarioIds: Set<BrowserLifecycleScenarioId>
  enabledModeIds: Set<BrowserLifecycleModeId>
}

export interface LifecycleClassModel {
  family: LifecycleFamily
  body: string[]
  shell: string[]
  header: string[]
  title: string[]
  subtitle: string[]
  panel: string[]
  grid: string[]
  cardBase: string[]
  cardLight: string[]
  cardActive: string[]
  cardSelected: string[]
  cardExpanded: string[]
  cardDark: string[]
  cardNew: string[]
  cardTitle: string[]
  cardMeta: string[]
  button: string[]
  routeShell: string[]
  routeHero: string[]
}

interface BrowserLifecyclePage {
  root: string
  samples: BenchmarkSample[]
  artifacts: BenchmarkArtifact[]
}

export interface BrowserLifecycleMeasurement {
  samples: BenchmarkSample[]
  artifacts: BenchmarkArtifact[]
}

export interface LifecycleTraceMetrics {
  stylesheetParseMs: number
  styleRecalculationMs: number
  styleRecalculationCount: number
  layoutMs: number
  paintMs: number
  longTaskCount: number
}

export interface LifecycleActionResult {
  elapsedMs: number
  affectedElementCount: number
  routeCount: number
  computedStyleValid: number
  runtimeMutationMs: number
  runtimeGeneratedRuleCountDelta: number
  runtimeStyleRawBytesDelta: number
  mutationObserverCallbackCount: number
  mutationObserverCallbackDurationMs: number
}

export interface LifecycleState {
  domNodeCount: number
  averageClassCount: number
  cssomRuleCount: number
  runtimeGeneratedRuleCount: number
  runtimeStyleRawBytes: number
  retainedClassCount: number
  retainedRuleCount: number
  progressiveAdopted: number
  fcpMs: number
  lcpMs: number
}

export interface LifecycleStateWithRuntimeStyle extends LifecycleState {
  runtimeStyleText?: string
}

export interface LifecycleMeasurementValues {
  navigationReadyMs: number
  stylesheetParseMs: number
  styleRecalculationMs: number
  styleRecalculationCount: number
  layoutMs: number
  paintMs: number
  longTaskCount: number
  fcpMs: number
  lcpMs: number
  inpStyleInteractionMs: number
  jsHeapUsedBytes: number
  domNodeCount: number
  affectedElementCount: number
  averageClassCount: number
  cssomRuleCount: number
  runtimeReadyMs: number
  runtimeBootstrapMs: number
  runtimeObserveMs: number
  runtimeMutationMs: number
  runtimeGeneratedRuleCount: number
  runtimeGeneratedRuleCountDelta: number
  runtimeStyleRawBytes: number
  runtimeStyleRawBytesDelta: number
  retainedClassCount: number
  retainedRuleCount: number
  mutationObserverCallbackCount: number
  mutationObserverCallbackDurationMs: number
  routeCount: number
  progressiveAdopted: number
  computedStyleValid: number
}

export interface LifecycleTraceActionResult {
  navigationReadyMs: number
  state: LifecycleStateWithRuntimeStyle
  action: LifecycleActionResult
  runtimeMetrics: {
    runtimeReadyMs: number
    runtimeBootstrapMs: number
    runtimeObserveMs: number
  }
  heapUsedBytes: number
}

const lifecycleModes = [
  {
    id: 'master-static',
    adapterId: 'master-static',
    label: 'Master CSS static'
  },
  {
    id: 'master-runtime',
    adapterId: 'master-runtime',
    label: 'Master CSS runtime'
  },
  {
    id: 'master-progressive',
    adapterId: 'master-progressive',
    label: 'Master CSS progressive'
  },
  {
    id: 'tailwind-static',
    adapterId: 'tailwind-cli',
    label: 'Tailwind CSS static'
  }
] satisfies BrowserLifecycleModeDescriptor[]

export const browserLifecycleScenarios = [
  {
    id: 'initial-load',
    label: 'Initial load'
  },
  {
    id: 'large-dom',
    label: 'Large DOM'
  },
  {
    id: 'large-append',
    label: 'Large append'
  },
  {
    id: 'repeated-toggle',
    label: 'Repeated class toggles'
  },
  {
    id: 'theme-switch',
    label: 'Theme switch'
  },
  {
    id: 'route-navigation',
    label: 'Route navigation'
  },
  {
    id: 'long-session',
    label: 'Long session'
  }
] satisfies BrowserLifecycleScenarioDescriptor[]

const masterClasses = {
  family: 'master',
  body: ['benchmark-root', 'm:0', 'min-h:100vh', 'bg:gray-5', 'fg:slate-90', 'font:14px', 'font:system'],
  shell: ['max-w:1180px', 'mx:auto', 'p:6x', 'grid', 'gap:5x'],
  header: ['p:5x', 'r:12px', 'bg:white', 'border:1px|solid|gray-20', 'grid', 'gap:2x'],
  title: ['m:0', 'font:32px', 'font:heavy', 'tracking:-.02em'],
  subtitle: ['m:0', 'fg:slate-60', 'leading:1.6'],
  panel: ['p:4x', 'r:12px', 'bg:white', 'border:1px|solid|gray-20'],
  grid: ['grid', 'grid-cols:4', 'gap:3x'],
  cardBase: ['lifecycle-card', 'p:3x', 'r:10px', 'border:1px|solid|gray-20', 'min-h:72px'],
  cardLight: ['bg:white', 'fg:slate-80'],
  cardActive: ['bg:blue-60', 'fg:white'],
  cardSelected: ['bg:green-60', 'fg:white'],
  cardExpanded: ['shadow:md', 'scale:1.01'],
  cardDark: ['bg:slate-90', 'fg:white'],
  cardNew: ['outline:2px|solid|red-60'],
  cardTitle: ['block', 'font:13px', 'font:semibold'],
  cardMeta: ['block', 'font:12px', 'fg:slate-50', 'mt:1x'],
  button: ['h:40px', 'px:4x', 'r:8px', 'border:0', 'bg:blue-60', 'fg:white', 'font:13px', 'font:semibold'],
  routeShell: ['grid', 'gap:4x'],
  routeHero: ['p:5x', 'r:12px', 'bg:blue-5', 'border:1px|solid|blue-20']
} satisfies LifecycleClassModel

const tailwindClasses = {
  family: 'tailwind',
  body: ['benchmark-root', 'm-0', 'min-h-screen', 'bg-slate-50', 'text-slate-900', 'text-sm'],
  shell: ['max-w-7xl', 'mx-auto', 'p-6', 'grid', 'gap-5'],
  header: ['p-5', 'rounded-xl', 'bg-white', 'border', 'border-slate-200', 'grid', 'gap-2'],
  title: ['m-0', 'text-3xl', 'font-black', 'tracking-tight'],
  subtitle: ['m-0', 'text-slate-600', 'leading-relaxed'],
  panel: ['p-4', 'rounded-xl', 'bg-white', 'border', 'border-slate-200'],
  grid: ['grid', 'grid-cols-4', 'gap-3'],
  cardBase: ['lifecycle-card', 'p-3', 'rounded-lg', 'border', 'border-slate-200', 'min-h-[72px]'],
  cardLight: ['bg-white', 'text-slate-800'],
  cardActive: ['bg-blue-600', 'text-white'],
  cardSelected: ['bg-green-600', 'text-white'],
  cardExpanded: ['shadow-md', 'scale-[1.01]'],
  cardDark: ['bg-slate-900', 'text-white'],
  cardNew: ['outline-2', 'outline-red-600'],
  cardTitle: ['block', 'text-xs', 'font-semibold'],
  cardMeta: ['block', 'text-xs', 'text-slate-500', 'mt-1'],
  button: ['h-10', 'px-4', 'rounded-lg', 'border-0', 'bg-blue-600', 'text-white', 'text-xs', 'font-semibold'],
  routeShell: ['grid', 'gap-4'],
  routeHero: ['p-5', 'rounded-xl', 'bg-blue-50', 'border', 'border-blue-200']
} satisfies LifecycleClassModel

let runtimeBundlePromise: Promise<Buffer> | undefined
let defaultManifestJSONPromise: Promise<Buffer> | undefined
let defaultManifestPromise: Promise<MasterCSSManifest> | undefined

export async function writeBrowserLifecycleReport() {
  const report = await createBrowserLifecycleReport()
  const output = await writeBenchmarkReport(report)
  await copyLabeledBrowserLifecycleReport(output)
  return output
}

export function createBrowserLifecycleVariants(selection = getBrowserLifecycleSelection()): BrowserLifecycleVariant[] {
  return getBrowserLifecycleVariantSpecs()
    .filter((spec) => selection.enabledScenarioIds.has(spec.scenarioId))
    .flatMap((spec) => lifecycleModes
      .filter((mode) => selection.enabledModeIds.has(mode.id))
      .map((mode) => createBrowserLifecycleVariant(spec, mode)))
}

export function getBrowserLifecycleAdapters(variants = createBrowserLifecycleVariants()): BenchmarkAdapter[] {
  const ids = new Set(variants.map((variant) => getModeForVariant(variant).adapterId))
  return benchmarkAdapters.filter((adapter) => ids.has(adapter.id as BrowserLifecycleModeDescriptor['adapterId']))
}

export function createBrowserLifecycleVariantId(
  scenarioId: BrowserLifecycleScenarioId,
  modeId: BrowserLifecycleModeId,
  detailId: string
) {
  return `${scenarioId}-${modeId}-${detailId}`
}

async function createBrowserLifecycleReport(): Promise<BenchmarkReport> {
  validateFixtures(benchmarkFixtures)

  const selection = getBrowserLifecycleSelection()
  const variants = createBrowserLifecycleVariants(selection)
  if (!variants.length) throw new Error('Browser lifecycle selection produced no variants.')

  const samples: BenchmarkSample[] = []
  const artifacts: BenchmarkArtifact[] = []
  const rounds = getBrowserLifecycleRounds()
  const warmupRounds = getBrowserLifecycleWarmupRounds()
  const longSessionMs = getLongSessionDurationMs()
  const traceArtifactMode = getBrowserLifecycleTraceArtifactMode()

  console.log([
    'Browser lifecycle selection:',
    `scenarios=${[...selection.enabledScenarioIds].join(',')}`,
    `modes=${[...selection.enabledModeIds].join(',')}`,
    `variants=${variants.length}`,
    `rounds=${rounds}`,
    `warmupRounds=${warmupRounds}`,
    `longSessionMs=${longSessionMs}`,
    `traceArtifactMode=${traceArtifactMode}`
  ].join(' '))
  console.log('Launching Chromium for browser lifecycle benchmark')
  const browser = await chromium.launch({ headless: true })
  const browserVersion = browser.version()

  try {
    for (const [index, variant] of variants.entries()) {
      const variantStartedAt = performance.now()
      const variantNumber = index + 1
      console.log(`Preparing browser lifecycle page ${variantNumber}/${variants.length}: ${variant.id}`)
      const prepareStartedAt = performance.now()
      const page = await createBrowserLifecyclePage(variant)
      console.log(`Prepared browser lifecycle page ${variantNumber}/${variants.length}: ${variant.id} in ${formatDuration(performance.now() - prepareStartedAt)}`)

      samples.push(...page.samples)
      artifacts.push(...page.artifacts)
      await collectBrowserLifecycleSamples({
        browser,
        pageRoot: page.root,
        variant,
        variantNumber,
        totalVariants: variants.length,
        rounds,
        warmupRounds,
        samples,
        artifacts
      })
      console.log(`Finished browser lifecycle variant ${variantNumber}/${variants.length}: ${variant.id} in ${formatDuration(performance.now() - variantStartedAt)}`)
    }
  } finally {
    await browser.close()
  }

  const metricUnits = new Map(browserLifecycleMetrics.map((metric) => [metric.id, metric.unit as BenchmarkMetricUnit]))

  return {
    schemaVersion: 1,
    suite: 'browser-lifecycle',
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
    fixtures: getBrowserLifecycleFixtures(variants),
    adapters: getBrowserLifecycleAdapters(variants),
    variants,
    metrics: browserLifecycleMetrics,
    samples,
    summary: summarizeReportSamples(samples, metricUnits),
    limits: [
      'This suite measures local Chromium lifecycle fixture behavior only.',
      'Tailwind CSS variants are static browser controls; Tailwind CSS has no runtime rule-generation equivalent.',
      'INP-style interaction latency is a local fixture interaction-to-settle metric, not a real Web Vitals INP value.',
      'Selector matching is inferred from rule/selector/CSSOM volume plus style recalculation because Chromium does not expose a stable direct selector-matching metric here.',
      'CSSOM memory is not reported until a stable browser collection method is available.',
      'The default long-session duration is intentionally short for local validation; use BROWSER_LIFECYCLE_LONG_SESSION_MS=300000 for review-grade runs.',
      'Trace-derived event names can change across Chromium versions, so raw trace artifacts are kept for review before publishing public conclusions.'
    ],
    artifacts
  }
}

async function collectBrowserLifecycleSamples(options: {
  browser: Browser
  pageRoot: string
  variant: BrowserLifecycleVariant
  variantNumber: number
  totalVariants: number
  rounds: number
  warmupRounds: number
  samples: BenchmarkSample[]
  artifacts: BenchmarkArtifact[]
}) {
  for (let round = 0; round < options.warmupRounds; round++) {
    const roundStartedAt = performance.now()
    console.log(`Warming browser lifecycle ${options.variantNumber}/${options.totalVariants}: ${options.variant.id}, warmup ${round + 1}/${options.warmupRounds}`)
    await measureBrowserLifecycle({
      browser: options.browser,
      pageRoot: options.pageRoot,
      variant: options.variant,
      round: -round - 1,
      roundLabel: `warmup ${round + 1}/${options.warmupRounds}`,
      timeoutMs: getBrowserLifecycleMeasureTimeoutMs(),
      traceArtifactMode: getBrowserLifecycleTraceArtifactMode(),
      collectArtifacts: false
    })
    console.log(`Warmed browser lifecycle ${options.variantNumber}/${options.totalVariants}: ${options.variant.id}, warmup ${round + 1}/${options.warmupRounds} in ${formatDuration(performance.now() - roundStartedAt)}`)
  }

  for (let round = 0; round < options.rounds; round++) {
    const roundStartedAt = performance.now()
    console.log(`Measuring browser lifecycle ${options.variantNumber}/${options.totalVariants}: ${options.variant.id}, round ${round + 1}/${options.rounds}`)
    const result = await measureBrowserLifecycle({
      browser: options.browser,
      pageRoot: options.pageRoot,
      variant: options.variant,
      round,
      roundLabel: `round ${round + 1}/${options.rounds}`,
      timeoutMs: getBrowserLifecycleMeasureTimeoutMs(),
      traceArtifactMode: getBrowserLifecycleTraceArtifactMode(),
      collectArtifacts: true
    })

    options.samples.push(...result.samples)
    if (round === options.rounds - 1) options.artifacts.push(...result.artifacts)
    console.log(`Measured browser lifecycle ${options.variantNumber}/${options.totalVariants}: ${options.variant.id}, round ${round + 1}/${options.rounds} in ${formatDuration(performance.now() - roundStartedAt)}`)
  }
}

async function createBrowserLifecyclePage(variant: BrowserLifecycleVariant): Promise<BrowserLifecyclePage> {
  const spec = getSpecForVariant(variant)
  const mode = getModeForVariant(variant)
  const classes = mode.id === 'tailwind-static' ? tailwindClasses : masterClasses
  const sourceHtml = renderLifecycleDocument({
    spec,
    modeId: mode.id,
    classes,
    longSessionMs: getLongSessionDurationMs(),
    includeStaticClassSource: mode.id === 'master-static' || mode.id === 'tailwind-static'
  })

  if (mode.id === 'master-static' || mode.id === 'tailwind-static') {
    const build = await buildLifecycleStaticCSS({
      variantId: variant.id,
      family: classes.family,
      html: addStaticHarness(sourceHtml)
    })

    return writeBrowserLifecyclePage({
      variantId: variant.id,
      html: addStaticHarness(sourceHtml),
      externalCSS: build.css,
      deliveredCSS: build.css,
      buildArtifacts: build.artifacts
    })
  }

  if (mode.id === 'master-runtime') {
    return writeBrowserLifecyclePage({
      variantId: variant.id,
      html: addRuntimeHarness(sourceHtml, {
        hideUntilRuntime: true
      }),
      runtimeJS: await readRuntimeBundle(),
      manifestJSON: await readDefaultManifestJSON(),
      deliveredCSS: ''
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

  return writeBrowserLifecyclePage({
    variantId: variant.id,
    html: addRuntimeHarness(result.html, {
      hideUntilRuntime: false
    }),
    inlineCSS,
    hydrationManifestJSON,
    runtimeJS: await readRuntimeBundle(),
    manifestJSON: await readDefaultManifestJSON(),
    deliveredCSS: inlineCSS
  })
}

async function buildLifecycleStaticCSS(options: {
  variantId: string
  family: LifecycleFamily
  html: string
}) {
  const workspace = resolve(benchmarkRoot, '.results', 'browser-lifecycle', 'workspaces', options.variantId)
  await resetDirectory(workspace)
  await writeWorkspaceFiles(workspace, {
    'package.json': `${JSON.stringify({ private: true, type: 'module' }, null, 2)}\n`,
    'index.html': options.html,
    'input.css': options.family === 'master'
      ? '@import "@master/css";\n@source "./index.html";\n.benchmark-root{box-sizing:border-box}\n'
      : '@import "tailwindcss";\n@source "./index.html";\n.benchmark-root{box-sizing:border-box}\n'
  })
  await mkdir(resolve(workspace, 'dist'), { recursive: true })

  if (options.family === 'master') {
    await runCommand(
      process.execPath,
      [
        resolveBenchmarkPackageFile('@master/css-cli', 'dist/bin/index.js'),
        'generate',
        'index.html',
        '-o',
        'dist/output.css',
        '-v',
        '0'
      ],
      workspace
    )
  } else {
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
  }

  const cssFiles = await findCSSFiles(resolve(workspace, 'dist'))
  if (!cssFiles.length) throw new Error(`No lifecycle CSS files were generated for ${options.variantId}.`)
  const css = (await readFiles(cssFiles)).toString('utf8')
  if (!css.includes('text-center')) {
    throw new Error(`Generated lifecycle CSS for ${options.variantId} is missing text-center marker.`)
  }

  return {
    css,
    artifacts: await Promise.all(cssFiles.map((file) => measureRelativeArtifact(file)))
  }
}

async function writeBrowserLifecyclePage(options: {
  variantId: string
  html: string
  deliveredCSS: string
  externalCSS?: string
  inlineCSS?: string
  runtimeJS?: Buffer
  manifestJSON?: Buffer
  hydrationManifestJSON?: string
  buildArtifacts?: BenchmarkArtifact[]
}): Promise<BrowserLifecyclePage> {
  const root = resolve(benchmarkRoot, '.results', 'browser-lifecycle', 'pages', options.variantId)
  await resetDirectory(root)

  const files: Record<string, string> = {
    'index.html': options.html
  }

  if (options.externalCSS !== undefined) files['style.css'] = options.externalCSS
  if (options.inlineCSS !== undefined) files['inline-master-css.css'] = options.inlineCSS
  if (options.runtimeJS) files['global.min.js'] = options.runtimeJS.toString('utf8')
  if (options.manifestJSON) files['default-manifest.json'] = options.manifestJSON.toString('utf8')
  if (options.hydrationManifestJSON !== undefined) files['hydration-manifest.json'] = options.hydrationManifestJSON

  await writeWorkspaceFiles(root, files)

  const artifacts = await Promise.all(Object.keys(files).map((file) => measureRelativeArtifact(resolve(root, file))))

  return {
    root,
    samples: [
      ...createPayloadSamples(options.variantId, {
        html: Buffer.from(options.html),
        externalCSS: Buffer.from(options.externalCSS || ''),
        inlineCSS: Buffer.from(options.inlineCSS || ''),
        runtimeJS: options.runtimeJS || Buffer.alloc(0),
        manifestJSON: options.manifestJSON || Buffer.alloc(0),
        hydrationManifestJSON: Buffer.from(options.hydrationManifestJSON || '')
      }),
      ...createDeliveredCSSStructureSamples(options.variantId, options.deliveredCSS)
    ],
    artifacts: [
      ...(options.buildArtifacts || []),
      ...artifacts
    ]
  }
}

function getBrowserLifecycleVariantSpecs(): BrowserLifecycleVariantSpec[] {
  return [
    {
      scenarioId: 'initial-load',
      fixtureId: 'docs',
      detailId: 'docs',
      detailLabel: 'Docs initial load'
    },
    ...[1000, 5000, 10000].map((nodeTarget): BrowserLifecycleVariantSpec => ({
      scenarioId: 'large-dom',
      fixtureId: 'stress-dom',
      detailId: `nodes-${nodeTarget}`,
      detailLabel: `Large DOM ${nodeTarget} node target`,
      nodeTarget
    })),
    ...[100, 500, 1000].flatMap((appendCount) => (['existing-rule', 'new-rule'] satisfies AppendRuleState[]).map((appendRuleState): BrowserLifecycleVariantSpec => ({
      scenarioId: 'large-append',
      fixtureId: 'dynamic',
      detailId: `${appendRuleState}-${appendCount}`,
      detailLabel: `Append ${appendCount} elements (${appendRuleState})`,
      appendCount,
      appendRuleState
    }))),
    {
      scenarioId: 'repeated-toggle',
      fixtureId: 'dynamic',
      detailId: 'toggle-1200x6',
      detailLabel: 'Repeated toggles across 1200 items',
      nodeTarget: 3600,
      toggleRounds: 6
    },
    ...(['class-swap', 'data-attribute', 'css-variable'] satisfies ThemeModel[]).map((themeModel): BrowserLifecycleVariantSpec => ({
      scenarioId: 'theme-switch',
      fixtureId: 'dashboard',
      detailId: themeModel,
      detailLabel: `Theme switch (${themeModel})`,
      themeModel
    })),
    {
      scenarioId: 'route-navigation',
      fixtureId: 'dashboard',
      detailId: 'home-dashboard-settings-dashboard',
      detailLabel: 'Route navigation'
    },
    {
      scenarioId: 'long-session',
      fixtureId: 'dynamic',
      detailId: 'mixed-operations',
      detailLabel: 'Long session mixed operations',
      longSessionMs: getLongSessionDurationMs()
    }
  ]
}

function createBrowserLifecycleVariant(spec: BrowserLifecycleVariantSpec, mode: BrowserLifecycleModeDescriptor): BrowserLifecycleVariant {
  return {
    id: createBrowserLifecycleVariantId(spec.scenarioId, mode.id, spec.detailId),
    fixtureId: spec.fixtureId,
    adapterId: mode.adapterId,
    label: `${spec.detailLabel} / ${mode.label}`,
    scenarioId: spec.scenarioId,
    modeId: mode.id,
    detailId: spec.detailId,
    detailLabel: spec.detailLabel,
    limits: createVariantLimits(spec, mode.id)
  }
}

function createVariantLimits(spec: BrowserLifecycleVariantSpec, modeId: BrowserLifecycleModeId) {
  const limits: string[] = []
  if (spec.scenarioId === 'large-dom' && spec.nodeTarget === 10000) {
    limits.push('10,000-node target is a stress fixture and may be noisy on local machines.')
  }
  if (spec.scenarioId === 'large-append' && spec.appendRuleState === 'new-rule') {
    limits.push('Static variants include the new classes up front and are browser controls, while Master runtime/progressive generate them during interaction.')
  }
  if (spec.scenarioId === 'long-session') {
    limits.push('Default long-session duration is short unless BROWSER_LIFECYCLE_LONG_SESSION_MS is set.')
  }
  if (modeId === 'tailwind-static') {
    limits.push('Tailwind CSS is measured as a static browser-control variant, not as a runtime-equivalent implementation.')
  }
  return limits
}

function getBrowserLifecycleFixtures(variants: BrowserLifecycleVariant[]): BenchmarkFixture[] {
  const ids = new Set(variants.map((variant) => variant.fixtureId))
  return benchmarkFixtures.filter((fixture) => ids.has(fixture.id))
}

function getSpecForVariant(variant: BrowserLifecycleVariant) {
  const spec = getBrowserLifecycleVariantSpecs().find((candidate) => (
    candidate.scenarioId === variant.scenarioId
    && candidate.detailId === variant.detailId
  ))
  if (!spec) throw new Error(`Missing browser lifecycle spec for ${variant.id}.`)
  return spec
}

function getModeForVariant(variant: BrowserLifecycleVariant) {
  const mode = lifecycleModes.find((candidate) => candidate.id === variant.modeId)
  if (!mode) throw new Error(`Missing browser lifecycle mode for ${variant.id}.`)
  return mode
}

function getBrowserLifecycleSelection(): BrowserLifecycleSelection {
  return {
    enabledScenarioIds: getEnabledScenarioIds(),
    enabledModeIds: getEnabledModeIds()
  }
}

function getEnabledScenarioIds() {
  return parseEnabledIds(
    'BROWSER_LIFECYCLE_SCENARIOS',
    browserLifecycleScenarios.map((scenario) => scenario.id)
  )
}

function getEnabledModeIds() {
  return parseEnabledIds(
    'BROWSER_LIFECYCLE_MODES',
    lifecycleModes.map((mode) => mode.id)
  )
}

function parseEnabledIds<T extends string>(envName: string, allowedIds: T[]) {
  const value = process.env[envName]
  const allowed = new Set(allowedIds)
  if (!value) return new Set(allowedIds)

  const ids = value.split(',').map((entry) => entry.trim()).filter(Boolean)
  if (!ids.length) {
    throw new Error(`${envName} must include at least one id. Expected one or more of: ${allowedIds.join(', ')}.`)
  }

  const unknownIds = ids.filter((id) => !allowed.has(id as T))
  if (unknownIds.length) {
    throw new Error(`${envName} contains unknown ids: ${unknownIds.join(', ')}. Expected one or more of: ${allowedIds.join(', ')}.`)
  }

  return new Set(ids as T[])
}

function getBrowserLifecycleRounds() {
  const value = Number(process.env.BROWSER_LIFECYCLE_ROUNDS || process.env.BENCHMARK_ROUNDS || 1)
  if (!Number.isFinite(value) || value < 1) return 1
  return Math.floor(value)
}

function getBrowserLifecycleWarmupRounds() {
  const value = Number(process.env.BROWSER_LIFECYCLE_WARMUP_ROUNDS || 0)
  if (!Number.isFinite(value) || value < 0) return 0
  return Math.floor(value)
}

function getLongSessionDurationMs() {
  const value = Number(process.env.BROWSER_LIFECYCLE_LONG_SESSION_MS || 1000)
  if (!Number.isFinite(value) || value < 100) return 1000
  return Math.floor(value)
}

function getBrowserLifecycleMeasureTimeoutMs() {
  const fallback = Math.max(30000, getLongSessionDurationMs() + 120000)
  const value = Number(process.env.BROWSER_LIFECYCLE_MEASURE_TIMEOUT_MS || fallback)
  if (!Number.isFinite(value) || value < 1000) return fallback
  return Math.floor(value)
}

function getBrowserLifecycleTraceArtifactMode(): BrowserLifecycleTraceArtifactMode {
  const value = process.env.BROWSER_LIFECYCLE_TRACE_ARTIFACT_MODE || 'filtered'
  if (value === 'filtered' || value === 'raw' || value === 'off') return value
  throw new Error('BROWSER_LIFECYCLE_TRACE_ARTIFACT_MODE must be one of: filtered, raw, off.')
}

async function copyLabeledBrowserLifecycleReport(output: {
  outputRoot: string
  jsonFile: string
  markdownFile: string
}) {
  const label = getBrowserLifecycleReportLabel()
  if (!label) return

  const jsonFile = resolve(output.outputRoot, `report.${label}.json`)
  const markdownFile = resolve(output.outputRoot, `report.${label}.md`)
  await copyFile(output.jsonFile, jsonFile)
  await copyFile(output.markdownFile, markdownFile)
  console.log(`Copied browser lifecycle labeled report JSON to ${jsonFile}`)
  console.log(`Copied browser lifecycle labeled report Markdown to ${markdownFile}`)
}

function getBrowserLifecycleReportLabel() {
  const value = process.env.BROWSER_LIFECYCLE_REPORT_LABEL
  if (!value) return ''

  const label = value.toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '')

  if (!label) {
    throw new Error('BROWSER_LIFECYCLE_REPORT_LABEL must contain at least one alphanumeric, dot, underscore, or dash character after sanitization.')
  }

  return label
}

function formatDuration(ms: number) {
  if (ms < 1000) return `${Number(ms.toFixed(1))}ms`
  return `${Number((ms / 1000).toFixed(2))}s`
}

async function readRuntimeBundle() {
  if (!runtimeBundlePromise) {
    runtimeBundlePromise = (async () => {
      const file = resolveBenchmarkPackageFile('@master/css-runtime', 'dist/global.min.js')
      assertExistingFile(file, 'Run `pnpm --filter @master/css-runtime build` before `bench:browser-lifecycle`.')
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
    defaultManifestPromise = readDefaultManifestJSON().then((buffer) => JSON.parse(buffer.toString('utf8')) as MasterCSSManifest)
  }
  return defaultManifestPromise
}

function assertExistingFile(file: string, message: string) {
  if (!existsSync(file)) {
    throw new Error(`Missing file: ${file}\n${message}`)
  }
}

declare global {
  var __benchmarkReady: boolean | undefined
  var __markLifecycleReady: (() => void) | undefined
  var __lifecycleMetrics: {
    runtimeScriptLoadedMs?: number
    runtimeReadyMs?: number
    runtimeBootstrapMs?: number
    runtimeObserveMs?: number
    progressiveAdopted?: number
    runtimeMutationMs?: number
    collectMutations?: boolean
    mutationObserverCallbackCount?: number
    mutationObserverCallbackDurationMs?: number
    lcpMs?: number
    error?: string
  } | undefined
  var __runLifecycleScenario: () => Promise<LifecycleActionResult>
  var __readLifecycleState: () => LifecycleState & { runtimeStyleText?: string }
}
