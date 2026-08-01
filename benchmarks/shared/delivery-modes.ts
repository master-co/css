import { createServer, type Server } from 'node:http'
import { existsSync } from 'node:fs'
import { readFile, writeFile } from 'node:fs/promises'
import { extname, isAbsolute, relative, resolve } from 'node:path'
import { performance } from 'node:perf_hooks'
import type { Browser, Page } from '@playwright/test'
import { renderHTML } from '@master/css-server'
import type { MasterCSSManifest } from '@master/css-schema/manifest'
import { benchmarkAdapters } from '../fixtures/manifest'
import { getStaticFixtureSource, staticFixtureIds } from '../fixtures/static'
import { addRuntimeHarness, addStaticHarness, addStyleProbe } from './delivery-mode-harness'
import { masterDeliveryModeMetrics } from './delivery-mode-metrics'
import { createBrowserSamples, createDeliveredCSSStructureSamples, createPayloadSamples, createProgressiveHydrationDiagnosticSamples } from './delivery-mode-samples'
export { masterDeliveryModeMetrics } from './delivery-mode-metrics'
import {
  benchmarkRoot,
  measureRelativeArtifact,
  readFiles,
  resetDirectory,
  resolveBenchmarkPackageFile,
  writeWorkspaceFiles
} from './runner'
import { runStaticBuild, staticBuildTools, type StaticBuildToolId } from './static-build'
import type {
  BenchmarkAdapter,
  BenchmarkArtifact,
  BenchmarkFixtureId,
  BenchmarkSample,
  BenchmarkVariant
} from './types'

export type DeliveryModeId =
  | 'master-static'
  | 'master-runtime'
  | 'master-progressive'
  | 'tailwind-static'

interface ChromeTraceEvent {
  name?: string
  ph?: string
  dur?: number
}

interface DeliveryModeDescriptor {
  id: DeliveryModeId
  adapterId: 'master-static' | 'master-runtime' | 'master-progressive' | 'tailwind-cli'
  label: string
}

export interface DeliveryModePage {
  root: string
  samples: BenchmarkSample[]
  artifacts: BenchmarkArtifact[]
}

export interface DeliveryModeMeasurement {
  samples: BenchmarkSample[]
  artifacts: BenchmarkArtifact[]
}

export interface DeliveryModeDiagnostics {
  ready: string | undefined
  textAlign: string
  runtimeAvailable: boolean
  progressive: boolean
  hydrationFailureReason: string
  htmlHidden: boolean
  hydrationManifestRuleCount: number
  hydrationManifestLayerRuleCounts: Record<string, number>
  hydrationManifestLayerExpandedRuleCounts: Record<string, number>
  cssomTopLevelRuleCount: number
  cssomLayerRuleCount: number
  cssomLayerRuleCounts: Record<string, number>
  cssomTotalRuleCount: number
  layerRuleCountMismatches: Record<string, {
    manifestRules: number
    manifestExpandedRules: number
    cssomRules: number
  }>
  hydrationManifestSelectorsMissingFromCSSOM: {
    className: string
    layer: string
    selectorText: string
    text: string
  }[]
  runtimeClassUtilityCount: number
  runtimeClassUtilityNames: string[]
  runtimeGeneratedRuleCount: number
  runtimeStyleRawBytes: number
  runtimeStyleText: string
  connectedClassCount: number
  connectedClassNames: string[]
  missingHydratedClassCount: number
  missingHydratedClassNames: string[]
  consoleWarnings: string[]
}

export interface ProgressiveHydrationDiagnosticMeasurement {
  samples: BenchmarkSample[]
  artifacts: BenchmarkArtifact[]
  diagnostics: DeliveryModeDiagnostics
}

const fixedViewport = {
  width: 1280,
  height: 720
}

export const masterDeliveryModeFixtureIds = staticFixtureIds

export const deliveryModeDescriptors = [
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
] satisfies DeliveryModeDescriptor[]

export function getMasterDeliveryModeAdapters(): BenchmarkAdapter[] {
  const ids = new Set<string>(deliveryModeDescriptors.map((mode) => mode.adapterId))
  return benchmarkAdapters.filter((adapter) => ids.has(adapter.id))
}

export function createMasterDeliveryModeVariants(): BenchmarkVariant[] {
  return masterDeliveryModeFixtureIds.flatMap((fixtureId) => deliveryModeDescriptors.map((mode) => ({
    id: createMasterDeliveryModeVariantId(fixtureId, mode.id),
    fixtureId,
    adapterId: mode.adapterId,
    label: `${fixtureId} / ${mode.label}`
  })))
}

export function createMasterDeliveryModeVariantId(fixtureId: BenchmarkFixtureId, modeId: DeliveryModeId) {
  return `${fixtureId}-${modeId}`
}

export async function createMasterDeliveryModePage(options: {
  fixtureId: BenchmarkFixtureId
  modeId: DeliveryModeId
  variantId: string
  pageSuite?: 'master-delivery-modes' | 'progressive-hydration-diagnostics'
}): Promise<DeliveryModePage> {
  if (options.modeId === 'master-static') {
    return createStaticDeliveryModePage({
      ...options,
      toolId: 'master-static-cli'
    })
  }

  if (options.modeId === 'tailwind-static') {
    return createStaticDeliveryModePage({
      ...options,
      toolId: 'tailwind-cli'
    })
  }

  if (options.modeId === 'master-runtime') {
    return createRuntimeDeliveryModePage(options)
  }

  return createProgressiveDeliveryModePage(options)
}

export async function measureMasterDeliveryMode(options: {
  browser: Browser
  pageRoot: string
  variantId: string
  modeId: DeliveryModeId
  round: number
}) {
  const server = await startStaticFileServer(options.pageRoot)

  try {
    const context = await options.browser.newContext({
      viewport: fixedViewport,
      deviceScaleFactor: 1
    })
    const page = await context.newPage()
    const consoleWarnings = collectConsoleWarnings(page)

    try {
      const artifactRoot = resolve(benchmarkRoot, '.results', 'master-delivery-modes', 'artifacts', options.variantId, `round-${options.round}`)
      await resetDirectory(artifactRoot)

      const traceFile = resolve(artifactRoot, 'trace.json')
      const screenshotFile = resolve(artifactRoot, 'screenshot.png')
      const diagnosticsFile = resolve(artifactRoot, 'diagnostics.json')
      const runtimeStyleFile = resolve(artifactRoot, 'runtime-style.css')
      const traceResult = await traceNavigation(page, server.origin, options.modeId)
      const diagnostics = await readDeliveryDiagnostics(page, consoleWarnings)
      await writeFile(traceFile, `${JSON.stringify({ traceEvents: traceResult.events }, null, 2)}\n`)
      await writeDiagnosticsArtifacts({
        diagnostics,
        diagnosticsFile,
        runtimeStyleFile
      })
      await page.screenshot({ path: screenshotFile, fullPage: false })
      if (options.modeId === 'master-progressive') {
        assertNoMissingHydrationSelectors(options.variantId, diagnostics)
      }

      const traceMetrics = summarizeTraceEvents(traceResult.events)
      const artifactFiles = [traceFile, screenshotFile, diagnosticsFile]
      if (diagnostics.runtimeStyleText) artifactFiles.push(runtimeStyleFile)
      const artifacts = await Promise.all(artifactFiles.map((file) => measureRelativeArtifact(file)))

      return {
        samples: createBrowserSamples(options.variantId, options.round, {
          navigationReadyMs: traceResult.navigationReadyMs,
          ...traceMetrics,
          ...traceResult.deliveryMetrics
        }),
        artifacts
      } satisfies DeliveryModeMeasurement
    } finally {
      await context.close()
    }
  } finally {
    await server.close()
  }
}

export async function measureProgressiveHydrationDiagnostics(options: {
  browser: Browser
  pageRoot: string
  variantId: string
  round: number
}) {
  const server = await startStaticFileServer(options.pageRoot)

  try {
    const context = await options.browser.newContext({
      viewport: fixedViewport,
      deviceScaleFactor: 1
    })
    const page = await context.newPage()
    const consoleWarnings = collectConsoleWarnings(page)

    try {
      const artifactRoot = resolve(benchmarkRoot, '.results', 'progressive-hydration-diagnostics', 'artifacts', options.variantId, `round-${options.round}`)
      await resetDirectory(artifactRoot)

      await page.goto(server.origin, { waitUntil: 'load' })
      await waitForBenchmarkReady(page)
      await assertDeliveryModeCorrect(page, 'master-progressive')
      const diagnostics = await readDeliveryDiagnostics(page, consoleWarnings)

      const diagnosticsFile = resolve(artifactRoot, 'diagnostics.json')
      const runtimeStyleFile = resolve(artifactRoot, 'runtime-style.css')
      const screenshotFile = resolve(artifactRoot, 'screenshot.png')
      await writeDiagnosticsArtifacts({
        diagnostics,
        diagnosticsFile,
        runtimeStyleFile
      })
      await page.screenshot({ path: screenshotFile, fullPage: false })
      assertNoMissingHydrationSelectors(options.variantId, diagnostics)

      const artifactFiles = [diagnosticsFile, screenshotFile]
      if (diagnostics.runtimeStyleText) artifactFiles.push(runtimeStyleFile)

      return {
        samples: createProgressiveHydrationDiagnosticSamples(options.variantId, options.round, diagnostics),
        artifacts: await Promise.all(artifactFiles.map((file) => measureRelativeArtifact(file))),
        diagnostics
      } satisfies ProgressiveHydrationDiagnosticMeasurement
    } finally {
      await context.close()
    }
  } finally {
    await server.close()
  }
}

async function createStaticDeliveryModePage(options: {
  fixtureId: BenchmarkFixtureId
  modeId: DeliveryModeId
  variantId: string
  pageSuite?: 'master-delivery-modes' | 'progressive-hydration-diagnostics'
  toolId: Extract<StaticBuildToolId, 'master-static-cli' | 'tailwind-cli'>
}): Promise<DeliveryModePage> {
  const tool = staticBuildTools.find((candidate) => candidate.id === options.toolId)
  if (!tool) throw new Error(`Missing static build tool: ${options.toolId}`)

  const buildResult = await runStaticBuild({
    suite: 'master-delivery-modes',
    fixtureId: options.fixtureId,
    tool,
    round: 0,
    workspaceName: `${options.variantId}-static-build`
  })
  const css = (await readFiles(buildResult.cssFiles)).toString('utf8')
  const fixture = getStaticFixtureSource(options.fixtureId)
  const sourceHtml = tool.family === 'master' ? fixture.masterHtml : fixture.tailwindHtml
  const html = addStaticHarness(sourceHtml)

  return writeDeliveryModePage({
    pageSuite: options.pageSuite,
    variantId: options.variantId,
    html,
    externalCSS: css,
    deliveredCSS: css,
    buildArtifacts: buildResult.artifacts
  })
}

async function createRuntimeDeliveryModePage(options: {
  fixtureId: BenchmarkFixtureId
  variantId: string
  pageSuite?: 'master-delivery-modes' | 'progressive-hydration-diagnostics'
}): Promise<DeliveryModePage> {
  const fixture = getStaticFixtureSource(options.fixtureId)
  const html = addRuntimeHarness(fixture.masterHtml, {
    hideUntilRuntime: true
  })

  return writeDeliveryModePage({
    pageSuite: options.pageSuite,
    variantId: options.variantId,
    html,
    runtimeJS: await readRuntimeBundle(),
    manifestJSON: await readDefaultManifestJSON(),
    deliveredCSS: ''
  })
}

async function createProgressiveDeliveryModePage(options: {
  fixtureId: BenchmarkFixtureId
  variantId: string
  pageSuite?: 'master-delivery-modes' | 'progressive-hydration-diagnostics'
}): Promise<DeliveryModePage> {
  const fixture = getStaticFixtureSource(options.fixtureId)
  const sourceHtml = addStyleProbe(fixture.masterHtml)
  const manifest = await readDefaultManifest()
  const result = renderHTML(sourceHtml, {
    manifest,
    hydrationManifest: 'inject'
  })
  const hydrationManifestJSON = result.hydrationManifest
    ? JSON.stringify(result.hydrationManifest)
    : ''
  const inlineCSS = result.cssText
  const html = addRuntimeHarness(result.html, {
    hideUntilRuntime: false,
    hasStyleProbe: true
  })

  return writeDeliveryModePage({
    pageSuite: options.pageSuite,
    variantId: options.variantId,
    html,
    inlineCSS,
    hydrationManifestJSON,
    runtimeJS: await readRuntimeBundle(),
    manifestJSON: await readDefaultManifestJSON(),
    deliveredCSS: inlineCSS
  })
}

async function writeDeliveryModePage(options: {
  pageSuite?: 'master-delivery-modes' | 'progressive-hydration-diagnostics'
  variantId: string
  html: string
  deliveredCSS: string
  externalCSS?: string
  inlineCSS?: string
  runtimeJS?: Buffer
  manifestJSON?: Buffer
  hydrationManifestJSON?: string
  buildArtifacts?: BenchmarkArtifact[]
}): Promise<DeliveryModePage> {
  const root = resolve(benchmarkRoot, '.results', options.pageSuite || 'master-delivery-modes', 'pages', options.variantId)
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

function collectConsoleWarnings(page: Page) {
  const warnings: string[] = []
  page.on('console', (message) => {
    if (message.type() === 'warning') warnings.push(message.text())
  })
  return warnings
}

async function readDeliveryDiagnostics(page: Page, consoleWarnings: string[]): Promise<DeliveryModeDiagnostics> {
  const diagnostics = await page.evaluate(() => {
    const runtime = globalThis.masterCSSRuntime as unknown as {
      progressive?: boolean
      hydrationFailureReason?: string
      style?: HTMLStyleElement | null
      text?: string
      classUtilities?: Map<string, unknown>
    } | undefined
    const styleElement = document.querySelector<HTMLStyleElement>('style#master-css')
    const styleRules = styleElement?.sheet?.cssRules
    const hydrationManifestScript = document.getElementById('master-css-hydration-manifest')
    const hydrationManifest = parseHydrationManifest(hydrationManifestScript?.textContent || '')
    const hydrationManifestRules = Array.isArray(hydrationManifest?.rules) ? hydrationManifest.rules : []
    const hydrationManifestLayerRuleCounts = countHydrationManifestLayerRules(hydrationManifestRules)
    const hydrationManifestLayerExpandedRuleCounts = countHydrationManifestLayerRules(hydrationManifestRules, true)
    const runtimeStyleText = runtime?.style?.textContent || runtime?.text || ''
    const runtimeClassUtilityNames = [...(runtime?.classUtilities?.keys?.() || [])].map(String).sort()
    const connectedClassNames = collectConnectedClassNames()
    const runtimeClassUtilityNameSet = new Set(runtimeClassUtilityNames)
    const missingHydratedClassNames = connectedClassNames.filter((className) => !runtimeClassUtilityNameSet.has(className))
    const cssom = summarizeCSSOM(styleRules)
    const layerRuleCountMismatches = findLayerRuleCountMismatches(
      hydrationManifestLayerRuleCounts,
      hydrationManifestLayerExpandedRuleCounts,
      cssom.layerRuleCounts
    )
    const hydrationManifestSelectorsMissingFromCSSOM = findHydrationManifestSelectorsMissingFromCSSOM(
      hydrationManifestRules,
      cssom.layerSelectorTexts
    )

    return {
      ready: document.documentElement.dataset.benchmarkReady,
      textAlign: getComputedStyle(document.getElementById('benchmark-style-probe')!).textAlign,
      runtimeAvailable: Boolean(runtime),
      progressive: Boolean(runtime?.progressive),
      hydrationFailureReason: runtime?.hydrationFailureReason || '',
      htmlHidden: document.documentElement.hasAttribute('hidden'),
      hydrationManifestRuleCount: hydrationManifestRules.length,
      hydrationManifestLayerRuleCounts,
      hydrationManifestLayerExpandedRuleCounts,
      cssomTopLevelRuleCount: styleRules?.length || 0,
      cssomLayerRuleCount: cssom.layerRuleCount,
      cssomLayerRuleCounts: cssom.layerRuleCounts,
      cssomTotalRuleCount: cssom.totalRuleCount,
      layerRuleCountMismatches,
      hydrationManifestSelectorsMissingFromCSSOM,
      runtimeClassUtilityCount: runtimeClassUtilityNames.length,
      runtimeClassUtilityNames,
      runtimeGeneratedRuleCount: cssom.totalRuleCount,
      runtimeStyleRawBytes: new TextEncoder().encode(runtimeStyleText).length,
      runtimeStyleText,
      connectedClassCount: connectedClassNames.length,
      connectedClassNames,
      missingHydratedClassCount: missingHydratedClassNames.length,
      missingHydratedClassNames
    }

    function parseHydrationManifest(source: string) {
      try {
        return source ? JSON.parse(source) as {
          rules?: {
            className?: string
            layer?: string
            nodes?: unknown[]
            selectorText?: string
            text?: string
          }[]
        } : undefined
      } catch {
        return undefined
      }
    }

    function countHydrationManifestLayerRules(
      rules: NonNullable<ReturnType<typeof parseHydrationManifest>>['rules'],
      expanded = false
    ) {
      const counts: Record<string, number> = {}
      for (const rule of rules || []) {
        const layer = rule.layer || 'unknown'
        counts[layer] = (counts[layer] || 0) + (expanded ? rule.nodes?.length || 1 : 1)
      }
      return counts
    }

    function findLayerRuleCountMismatches(
      manifestRuleCounts: Record<string, number>,
      manifestExpandedRuleCounts: Record<string, number>,
      cssomRuleCounts: Record<string, number>
    ) {
      const mismatches: Record<string, {
        manifestRules: number
        manifestExpandedRules: number
        cssomRules: number
      }> = {}
      const layers = new Set([
        ...Object.keys(manifestRuleCounts),
        ...Object.keys(manifestExpandedRuleCounts),
        ...Object.keys(cssomRuleCounts)
      ])

      for (const layer of layers) {
        if (layer === 'theme') continue
        const manifestRules = manifestRuleCounts[layer] || 0
        const manifestExpandedRules = manifestExpandedRuleCounts[layer] || 0
        const cssomRules = cssomRuleCounts[layer] || 0
        if (manifestExpandedRules !== cssomRules) {
          mismatches[layer] = {
            manifestRules,
            manifestExpandedRules,
            cssomRules
          }
        }
      }

      return mismatches
    }

    function findHydrationManifestSelectorsMissingFromCSSOM(
      rules: NonNullable<ReturnType<typeof parseHydrationManifest>>['rules'],
      layerSelectorTexts: Record<string, string[]>
    ) {
      const selectorsByLayer = new Map(Object.entries(layerSelectorTexts).map(([layer, selectors]) => [layer, new Set(selectors)]))
      return (rules || []).filter((rule) => {
        if (!rule.selectorText) return false
        return !selectorsByLayer.get(rule.layer || 'unknown')?.has(rule.selectorText)
      }).map((rule) => ({
        className: rule.className || '',
        layer: rule.layer || 'unknown',
        selectorText: rule.selectorText || '',
        text: rule.text || ''
      }))
    }

    function collectConnectedClassNames() {
      const names = new Set<string>()
      for (const element of document.querySelectorAll('[class]')) {
        for (const className of (element.getAttribute('class') || '').split(/\s+/)) {
          if (className) names.add(className)
        }
      }
      return [...names].sort()
    }

    function summarizeCSSOM(rules?: CSSRuleList) {
      const layerRuleCounts: Record<string, number> = {}
      const layerSelectorTexts: Record<string, string[]> = {}
      let layerRuleCount = 0
      let totalRuleCount = 0

      if (rules) {
        for (const rule of rules) {
          const childRules = 'cssRules' in rule ? (rule as CSSGroupingRule).cssRules : undefined
          if (childRules) {
            const name = 'name' in rule ? String((rule as CSSGroupingRule & { name?: string }).name || 'anonymous') : rule.constructor.name
            layerRuleCounts[name] = childRules.length
            layerSelectorTexts[name] = collectSelectorTexts(childRules)
            layerRuleCount += childRules.length
            totalRuleCount += countCSSRules(childRules)
          } else {
            totalRuleCount++
          }
        }
      }

      return {
        layerRuleCount,
        layerRuleCounts,
        layerSelectorTexts,
        totalRuleCount
      }
    }

    function collectSelectorTexts(rules?: CSSRuleList) {
      if (!rules) return []
      const selectors: string[] = []
      for (const rule of rules) {
        if ('selectorText' in rule) {
          selectors.push(String((rule as CSSStyleRule).selectorText))
        } else if ('cssRules' in rule) {
          selectors.push(...collectSelectorTexts((rule as CSSGroupingRule).cssRules))
        }
      }
      return selectors
    }

    function countCSSRules(rules?: CSSRuleList): number {
      if (!rules) return 0
      let total = 0
      for (const rule of rules) {
        total += 'cssRules' in rule
          ? countCSSRules((rule as CSSGroupingRule).cssRules)
          : 1
      }
      return total
    }
  })

  return {
    ...diagnostics,
    consoleWarnings
  }
}

async function writeDiagnosticsArtifacts(options: {
  diagnostics: DeliveryModeDiagnostics
  diagnosticsFile: string
  runtimeStyleFile: string
}) {
  const { runtimeStyleText, ...diagnosticsJSON } = options.diagnostics
  await writeFile(options.diagnosticsFile, `${JSON.stringify({
    ...diagnosticsJSON,
    runtimeStyleTextArtifact: runtimeStyleText ? 'runtime-style.css' : undefined
  }, null, 2)}\n`)
  if (runtimeStyleText) await writeFile(options.runtimeStyleFile, runtimeStyleText)
}

function assertNoMissingHydrationSelectors(variantId: string, diagnostics: DeliveryModeDiagnostics) {
  if (!diagnostics.hydrationManifestSelectorsMissingFromCSSOM.length) return

  const missingSelectors = diagnostics.hydrationManifestSelectorsMissingFromCSSOM
    .map((selector) => `${selector.className || selector.selectorText} (${selector.selectorText})`)
    .join(', ')

  throw new Error([
    `${variantId} generated hydration manifest selectors that browser CSSOM did not preserve.`,
    `Missing selectors: ${missingSelectors}`,
    'Use browser-CSSOM-valid fixture class syntax before publishing benchmark results.'
  ].join('\n'))
}

async function traceNavigation(page: Page, url: string, modeId: DeliveryModeId) {
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

  const startedAt = performance.now()
  await page.goto(url, { waitUntil: 'load' })
  await waitForBenchmarkReady(page)
  await assertDeliveryModeCorrect(page, modeId)
  const deliveryMetrics = await readDeliveryMetrics(page)
  const navigationReadyMs = performance.now() - startedAt

  await client.send('Tracing.end')
  await tracingComplete
  await client.detach()

  return {
    events,
    deliveryMetrics,
    navigationReadyMs
  }
}

async function waitForBenchmarkReady(page: Page) {
  await page.waitForFunction(() => (window as Window & { __benchmarkReady?: boolean }).__benchmarkReady === true, undefined, { timeout: 15000 })
}

async function assertDeliveryModeCorrect(page: Page, modeId: DeliveryModeId) {
  const state = await page.evaluate(() => ({
    ready: document.documentElement.dataset.benchmarkReady,
    textAlign: getComputedStyle(document.getElementById('benchmark-style-probe')!).textAlign,
    runtimeAvailable: Boolean(globalThis.masterCSSRuntime),
    progressive: Boolean(globalThis.masterCSSRuntime?.progressive),
    htmlHidden: document.documentElement.hasAttribute('hidden')
  }))

  if (state.ready !== 'true') {
    throw new Error('Benchmark page did not set the ready marker.')
  }

  if (state.textAlign !== 'center') {
    throw new Error(`Expected style probe text-align:center, received ${state.textAlign}.`)
  }

  if ((modeId === 'master-runtime' || modeId === 'master-progressive') && !state.runtimeAvailable) {
    throw new Error(`${modeId} did not expose globalThis.masterCSSRuntime.`)
  }

  if (modeId === 'master-runtime' && state.progressive) {
    throw new Error('Master runtime variant unexpectedly adopted progressive style output.')
  }

  if (modeId === 'master-runtime' && state.htmlHidden) {
    throw new Error('Master runtime variant did not reveal the hidden html element.')
  }
}

async function readDeliveryMetrics(page: Page) {
  return page.evaluate(() => {
    const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[]
    const manifestEntry = resources.find((entry) => entry.name.endsWith('/default-manifest.json'))
    const metrics = globalThis.__deliveryMetrics || {}

    return {
      requestCount: resources.filter((entry) => entry.name.startsWith(location.origin)).length + 1,
      runtimeReadyMs: metrics.runtimeReadyMs || 0,
      runtimeBootstrapMs: metrics.runtimeBootstrapMs || 0,
      manifestLoadMs: manifestEntry?.duration || 0,
      runtimeObserveMs: metrics.runtimeObserveMs || 0,
      progressiveAdopted: metrics.progressiveAdopted || 0,
      runtimeGeneratedRuleCount: metrics.runtimeGeneratedRuleCount || 0,
      runtimeStyleRawBytes: metrics.runtimeStyleRawBytes || 0
    }
  })
}

function summarizeTraceEvents(events: ChromeTraceEvent[]) {
  return {
    stylesheetParseMs: sumTraceDurations(events, new Set([
      'ParseAuthorStyleSheet',
      'ParseStyleSheet',
      'CSSParserImpl::parseStyleSheet'
    ])),
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
        'cache-control': 'public, max-age=3600, immutable'
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
    throw new Error('Unable to allocate local delivery mode benchmark server port.')
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

async function readRuntimeBundle() {
  const file = resolveBenchmarkPackageFile('@master/css-runtime', 'dist/global.min.js')
  assertExistingFile(file, 'Run `pnpm --filter @master/css-runtime build` before `bench:master-delivery-modes`.')
  return readFile(file)
}

async function readDefaultManifestJSON() {
  const file = resolveBenchmarkPackageFile('@master/css-preset', 'src/default-manifest.json')
  assertExistingFile(file, 'Expected @master/css-preset default manifest to exist.')
  return readFile(file)
}

async function readDefaultManifest() {
  return JSON.parse((await readDefaultManifestJSON()).toString('utf8')) as MasterCSSManifest
}

function assertExistingFile(file: string, message: string) {
  if (!existsSync(file)) {
    throw new Error(`Missing file: ${file}\n${message}`)
  }
}

declare global {
  var MasterCSSRuntime: {
    prototype: {
      observe: (...args: unknown[]) => unknown
    }
  }
  var masterCSSRuntime: {
    progressive?: boolean
  }
  var __deliveryMetrics: {
    error?: string
    runtimeScriptLoadedMs?: number
    runtimeReadyMs?: number
    runtimeBootstrapMs?: number
    runtimeObserveMs?: number
    progressiveAdopted?: number
    runtimeGeneratedRuleCount?: number
    runtimeStyleRawBytes?: number
  } | undefined

  interface Window {
    __benchmarkReady?: boolean
  }
}
