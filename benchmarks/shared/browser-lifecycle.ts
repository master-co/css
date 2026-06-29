import { createServer, type Server } from 'node:http'
import { existsSync } from 'node:fs'
import { copyFile, mkdir, readFile, writeFile } from 'node:fs/promises'
import { extname, isAbsolute, relative, resolve } from 'node:path'
import { performance } from 'node:perf_hooks'
import { chromium, type Browser, type CDPSession, type Page } from '@playwright/test'
import { render } from '@master/css-server'
import type { MasterCSSManifest } from '@master/css'
import { benchmarkAdapters, benchmarkFixtures } from '../fixtures/manifest'
import { summarizeBytes } from './bytes'
import { analyzeCSSStructure } from './css-structure'
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
    BenchmarkMetric,
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

type LifecycleFamily = 'master' | 'tailwind'
type ThemeModel = 'class-swap' | 'data-attribute' | 'css-variable'
type AppendRuleState = 'existing-rule' | 'new-rule'

interface ChromeTraceEvent {
    name?: string
    ph?: string
    dur?: number
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

interface BrowserLifecycleVariantSpec {
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

interface BrowserLifecycleVariant extends BenchmarkVariant {
    scenarioId: BrowserLifecycleScenarioId
    modeId: BrowserLifecycleModeId
    detailId: string
    detailLabel: string
}

interface BrowserLifecycleSelection {
    enabledScenarioIds: Set<BrowserLifecycleScenarioId>
    enabledModeIds: Set<BrowserLifecycleModeId>
}

interface LifecycleClassModel {
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

interface BrowserLifecycleMeasurement {
    samples: BenchmarkSample[]
    artifacts: BenchmarkArtifact[]
}

interface LifecycleTraceMetrics {
    stylesheetParseMs: number
    styleRecalculationMs: number
    styleRecalculationCount: number
    layoutMs: number
    paintMs: number
    longTaskCount: number
}

interface LifecycleActionResult {
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

interface LifecycleState {
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

interface LifecycleStateWithRuntimeStyle extends LifecycleState {
    runtimeStyleText?: string
}

interface LifecycleMeasurementValues {
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

interface LifecycleTraceActionResult {
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

const fixedViewport = {
    width: 1280,
    height: 720
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

export const browserLifecycleMetrics = [
    {
        id: 'html-raw-bytes',
        label: 'HTML raw bytes',
        unit: 'B',
        description: 'Raw bytes for the benchmark page HTML.'
    },
    {
        id: 'html-gzip-bytes',
        label: 'HTML gzip bytes',
        unit: 'B',
        description: 'Gzip bytes for the benchmark page HTML.'
    },
    {
        id: 'html-brotli-bytes',
        label: 'HTML brotli bytes',
        unit: 'B',
        description: 'Brotli bytes for the benchmark page HTML.'
    },
    {
        id: 'external-css-raw-bytes',
        label: 'External CSS raw bytes',
        unit: 'B',
        description: 'Raw bytes for externally linked CSS.'
    },
    {
        id: 'external-css-gzip-bytes',
        label: 'External CSS gzip bytes',
        unit: 'B',
        description: 'Gzip bytes for externally linked CSS.'
    },
    {
        id: 'external-css-brotli-bytes',
        label: 'External CSS brotli bytes',
        unit: 'B',
        description: 'Brotli bytes for externally linked CSS.'
    },
    {
        id: 'inline-css-raw-bytes',
        label: 'Inline CSS raw bytes',
        unit: 'B',
        description: 'Raw bytes for inline style#master-css.'
    },
    {
        id: 'inline-css-gzip-bytes',
        label: 'Inline CSS gzip bytes',
        unit: 'B',
        description: 'Gzip bytes for inline style#master-css.'
    },
    {
        id: 'inline-css-brotli-bytes',
        label: 'Inline CSS brotli bytes',
        unit: 'B',
        description: 'Brotli bytes for inline style#master-css.'
    },
    {
        id: 'runtime-js-raw-bytes',
        label: 'Runtime JS raw bytes',
        unit: 'B',
        description: 'Raw bytes for the Master CSS browser runtime bundle.'
    },
    {
        id: 'runtime-js-gzip-bytes',
        label: 'Runtime JS gzip bytes',
        unit: 'B',
        description: 'Gzip bytes for the Master CSS browser runtime bundle.'
    },
    {
        id: 'runtime-js-brotli-bytes',
        label: 'Runtime JS brotli bytes',
        unit: 'B',
        description: 'Brotli bytes for the Master CSS browser runtime bundle.'
    },
    {
        id: 'manifest-json-raw-bytes',
        label: 'Manifest JSON raw bytes',
        unit: 'B',
        description: 'Raw bytes for the runtime default manifest JSON payload.'
    },
    {
        id: 'manifest-json-gzip-bytes',
        label: 'Manifest JSON gzip bytes',
        unit: 'B',
        description: 'Gzip bytes for the runtime default manifest JSON payload.'
    },
    {
        id: 'manifest-json-brotli-bytes',
        label: 'Manifest JSON brotli bytes',
        unit: 'B',
        description: 'Brotli bytes for the runtime default manifest JSON payload.'
    },
    {
        id: 'hydration-manifest-raw-bytes',
        label: 'Hydration manifest raw bytes',
        unit: 'B',
        description: 'Raw bytes for inline progressive hydration manifest JSON.'
    },
    {
        id: 'hydration-manifest-gzip-bytes',
        label: 'Hydration manifest gzip bytes',
        unit: 'B',
        description: 'Gzip bytes for inline progressive hydration manifest JSON.'
    },
    {
        id: 'hydration-manifest-brotli-bytes',
        label: 'Hydration manifest brotli bytes',
        unit: 'B',
        description: 'Brotli bytes for inline progressive hydration manifest JSON.'
    },
    {
        id: 'delivered-style-rule-count',
        label: 'Delivered style rules',
        unit: 'count',
        description: 'Style rule count for CSS delivered before runtime-generated rules.'
    },
    {
        id: 'delivered-selector-count',
        label: 'Delivered selectors',
        unit: 'count',
        description: 'Selector count for CSS delivered before runtime-generated rules.'
    },
    {
        id: 'delivered-declaration-count',
        label: 'Delivered declarations',
        unit: 'count',
        description: 'Declaration count for CSS delivered before runtime-generated rules.'
    },
    {
        id: 'navigation-ready-ms',
        label: 'Navigation to ready',
        unit: 'ms',
        description: 'Elapsed wall time from navigation or interaction start until the page reaches the benchmark ready marker.'
    },
    {
        id: 'stylesheet-parse-ms',
        label: 'Stylesheet parse/attach',
        unit: 'ms',
        description: 'Trace-derived stylesheet parsing and attachment duration where Chromium exposes stable events.'
    },
    {
        id: 'style-recalculation-ms',
        label: 'Style recalculation',
        unit: 'ms',
        description: 'Trace-derived style recalculation duration from Chromium timeline events.'
    },
    {
        id: 'style-recalculation-count',
        label: 'Style recalculation count',
        unit: 'count',
        description: 'Count of trace events treated as style recalculation.'
    },
    {
        id: 'layout-ms',
        label: 'Layout',
        unit: 'ms',
        description: 'Trace-derived layout duration.'
    },
    {
        id: 'paint-ms',
        label: 'Paint',
        unit: 'ms',
        description: 'Trace-derived paint and pre-paint duration.'
    },
    {
        id: 'long-task-count',
        label: 'Long tasks',
        unit: 'count',
        description: 'Count of trace task events at or above 50 ms.'
    },
    {
        id: 'fcp-ms',
        label: 'FCP',
        unit: 'ms',
        description: 'Local fixture first-contentful-paint from the browser Performance API.'
    },
    {
        id: 'lcp-ms',
        label: 'LCP candidate',
        unit: 'ms',
        description: 'Local fixture largest-contentful-paint candidate captured by PerformanceObserver.'
    },
    {
        id: 'inp-style-interaction-ms',
        label: 'INP-style interaction latency',
        unit: 'ms',
        description: 'Local fixture interaction-to-settle latency. This is not a real Web Vitals INP value.'
    },
    {
        id: 'js-heap-used-bytes',
        label: 'JS heap used',
        unit: 'B',
        description: 'Chromium Runtime.getHeapUsage usedSize where available.'
    },
    {
        id: 'dom-node-count',
        label: 'DOM nodes',
        unit: 'count',
        description: 'Total DOM element count after the measured scenario.'
    },
    {
        id: 'affected-element-count',
        label: 'Affected elements',
        unit: 'count',
        description: 'Number of elements intentionally touched by the measured scenario.'
    },
    {
        id: 'average-class-count',
        label: 'Average class count',
        unit: 'count',
        description: 'Average classList length across DOM elements after the measured scenario.'
    },
    {
        id: 'cssom-rule-count',
        label: 'CSSOM rules',
        unit: 'count',
        description: 'Recursive CSSOM rule count across accessible stylesheets after the measured scenario.'
    },
    {
        id: 'runtime-ready-ms',
        label: 'Runtime ready',
        unit: 'ms',
        description: 'Browser performance timestamp when Master CSS runtime finished observe/hydration.'
    },
    {
        id: 'runtime-bootstrap-ms',
        label: 'Runtime bootstrap',
        unit: 'ms',
        description: 'Time from runtime script execution to runtime observe/hydration completion.'
    },
    {
        id: 'runtime-observe-ms',
        label: 'Runtime observe/hydrate',
        unit: 'ms',
        description: 'Synchronous duration of CSSRuntime.observe(), including progressive hydration when applicable.'
    },
    {
        id: 'runtime-mutation-ms',
        label: 'Runtime mutation work',
        unit: 'ms',
        description: 'Instrumented Master CSS runtime ensure/delete class-rules duration during the measured scenario.'
    },
    {
        id: 'runtime-generated-rule-count',
        label: 'Runtime generated rules',
        unit: 'count',
        description: 'Runtime class utility count or recursive style#master-css rule count after the measured scenario.'
    },
    {
        id: 'runtime-generated-rule-count-delta',
        label: 'Runtime generated rule delta',
        unit: 'count',
        description: 'Change in runtime generated rule count during the measured scenario.'
    },
    {
        id: 'runtime-style-raw-bytes',
        label: 'Runtime style raw bytes',
        unit: 'B',
        description: 'Raw bytes of style#master-css after the measured scenario.'
    },
    {
        id: 'runtime-style-raw-bytes-delta',
        label: 'Runtime style byte delta',
        unit: 'B',
        description: 'Change in raw style#master-css bytes during the measured scenario.'
    },
    {
        id: 'retained-class-count',
        label: 'Retained classes',
        unit: 'count',
        description: 'Runtime retainedClassNames count after the measured scenario.'
    },
    {
        id: 'retained-rule-count',
        label: 'Retained rules',
        unit: 'count',
        description: 'Estimated retained generated rule count after the measured scenario.'
    },
    {
        id: 'mutation-observer-callback-count',
        label: 'MutationObserver callbacks',
        unit: 'count',
        description: 'Number of MutationObserver callback deliveries during the measured scenario.'
    },
    {
        id: 'mutation-observer-callback-duration-ms',
        label: 'MutationObserver callback duration',
        unit: 'ms',
        description: 'Instrumented duration spent inside delivered MutationObserver callbacks.'
    },
    {
        id: 'route-count',
        label: 'Routes',
        unit: 'count',
        description: 'Number of route states visited by the scenario.'
    },
    {
        id: 'progressive-adopted',
        label: 'Progressive adopted',
        unit: 'count',
        description: '1 when the Master progressive variant adopted server-rendered CSS before the scenario.'
    },
    {
        id: 'computed-style-valid',
        label: 'Computed style valid',
        unit: 'count',
        description: '1 when the scenario computed-style assertion passed, otherwise 0.'
    }
] satisfies BenchmarkMetric[]

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

    console.log([
        'Browser lifecycle selection:',
        `scenarios=${[...selection.enabledScenarioIds].join(',')}`,
        `modes=${[...selection.enabledModeIds].join(',')}`,
        `variants=${variants.length}`,
        `rounds=${rounds}`,
        `warmupRounds=${warmupRounds}`,
        `longSessionMs=${longSessionMs}`
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
            round: -round - 1
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
            round
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

    const result = render(sourceHtml, await readDefaultManifest(), {
        hydrationManifest: 'inject'
    })
    const inlineCSS = result.css?.text || ''
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

async function measureBrowserLifecycle(options: {
    browser: Browser
    pageRoot: string
    variant: BrowserLifecycleVariant
    round: number
}): Promise<BrowserLifecycleMeasurement> {
    const server = await startStaticFileServer(options.pageRoot)

    try {
        const context = await options.browser.newContext({
            viewport: fixedViewport,
            deviceScaleFactor: 1
        })
        const page = await context.newPage()
        const consoleWarnings = collectConsoleWarnings(page)

        try {
            const artifactRoot = resolve(benchmarkRoot, '.results', 'browser-lifecycle', 'artifacts', options.variant.id, `round-${options.round}`)
            await resetDirectory(artifactRoot)

            const traceFile = resolve(artifactRoot, 'trace.json')
            const diagnosticsFile = resolve(artifactRoot, 'diagnostics.json')
            const screenshotFile = resolve(artifactRoot, 'screenshot.png')
            const runtimeStyleFile = resolve(artifactRoot, 'runtime-style.css')
            const measurement = options.variant.scenarioId === 'initial-load'
                ? await measureLifecycleNavigation(page, server.origin)
                : await measureLifecycleInteraction(page, server.origin)
            await writeFile(traceFile, `${JSON.stringify({ traceEvents: measurement.events }, null, 2)}\n`)
            await page.screenshot({ path: screenshotFile, fullPage: false })

            const diagnostics = {
                variant: options.variant,
                values: measurement.values,
                state: measurement.state,
                action: measurement.action,
                consoleWarnings,
                runtimeStyleArtifact: measurement.runtimeStyleText ? 'runtime-style.css' : undefined
            }
            await writeFile(diagnosticsFile, `${JSON.stringify(diagnostics, null, 2)}\n`)
            if (measurement.runtimeStyleText) await writeFile(runtimeStyleFile, measurement.runtimeStyleText)

            const artifactFiles = [traceFile, diagnosticsFile, screenshotFile]
            if (measurement.runtimeStyleText) artifactFiles.push(runtimeStyleFile)

            return {
                samples: createLifecycleMetricSamples(options.variant.id, options.round, measurement.values),
                artifacts: await Promise.all(artifactFiles.map((file) => measureRelativeArtifact(file)))
            }
        } finally {
            await context.close()
        }
    } finally {
        await server.close()
    }
}

async function measureLifecycleNavigation(page: Page, url: string) {
    const result = await tracePage(page, async (client) => {
        const startedAt = performance.now()
        await page.goto(url, { waitUntil: 'load' })
        await waitForBenchmarkReady(page)
        await assertLifecycleCorrect(page)
        const state = await readLifecycleState(page)
        const runtimeMetrics = await readRuntimeMetrics(page)
        const heapUsedBytes = await readJSHeapUsedBytes(client)
        const navigationReadyMs = performance.now() - startedAt

        return {
            navigationReadyMs,
            state,
            action: createEmptyActionResult(),
            runtimeMetrics,
            heapUsedBytes
        }
    })

    return createMeasuredResult(result)
}

async function measureLifecycleInteraction(page: Page, url: string) {
    await page.goto(url, { waitUntil: 'load' })
    await waitForBenchmarkReady(page)
    await assertLifecycleCorrect(page)

    const result = await tracePage(page, async (client) => {
        const startedAt = performance.now()
        const action = await page.evaluate(() => globalThis.__runLifecycleScenario())
        const state = await readLifecycleState(page)
        const runtimeMetrics = await readRuntimeMetrics(page)
        const heapUsedBytes = await readJSHeapUsedBytes(client)
        const navigationReadyMs = performance.now() - startedAt

        return {
            navigationReadyMs,
            state,
            action,
            runtimeMetrics,
            heapUsedBytes
        }
    })

    return createMeasuredResult(result)
}

async function tracePage(page: Page, action: (client: CDPSession) => Promise<LifecycleTraceActionResult>) {
    const context = page.context()
    const client = await context.newCDPSession(page)
    const events: ChromeTraceEvent[] = []
    const tracingComplete = new Promise<void>((resolveComplete) => {
        client.once('Tracing.tracingComplete', () => resolveComplete())
    })

    client.on('Tracing.dataCollected', (event: { value?: ChromeTraceEvent[] }) => {
        if (event.value) events.push(...event.value)
    })

    await client.send('Performance.enable').catch(() => undefined)
    await client.send('Tracing.start', {
        categories: [
            'devtools.timeline',
            'disabled-by-default-devtools.timeline',
            'blink',
            'loading'
        ].join(','),
        transferMode: 'ReportEvents'
    })

    try {
        const actionResult = await action(client)
        await client.send('Tracing.end')
        await tracingComplete

        return {
            ...actionResult,
            events
        }
    } finally {
        await client.detach().catch(() => undefined)
    }
}

function createMeasuredResult(result: {
    events: ChromeTraceEvent[]
    navigationReadyMs: number
    state: LifecycleStateWithRuntimeStyle
    action: LifecycleActionResult
    runtimeMetrics: {
        runtimeReadyMs: number
        runtimeBootstrapMs: number
        runtimeObserveMs: number
    }
    heapUsedBytes: number
}) {
    const traceMetrics = summarizeTraceEvents(result.events)
    const values: LifecycleMeasurementValues = {
        navigationReadyMs: result.navigationReadyMs,
        stylesheetParseMs: traceMetrics.stylesheetParseMs,
        styleRecalculationMs: traceMetrics.styleRecalculationMs,
        styleRecalculationCount: traceMetrics.styleRecalculationCount,
        layoutMs: traceMetrics.layoutMs,
        paintMs: traceMetrics.paintMs,
        longTaskCount: traceMetrics.longTaskCount,
        fcpMs: result.state.fcpMs,
        lcpMs: result.state.lcpMs,
        inpStyleInteractionMs: result.action.elapsedMs,
        jsHeapUsedBytes: result.heapUsedBytes,
        domNodeCount: result.state.domNodeCount,
        affectedElementCount: result.action.affectedElementCount,
        averageClassCount: result.state.averageClassCount,
        cssomRuleCount: result.state.cssomRuleCount,
        runtimeReadyMs: result.runtimeMetrics.runtimeReadyMs,
        runtimeBootstrapMs: result.runtimeMetrics.runtimeBootstrapMs,
        runtimeObserveMs: result.runtimeMetrics.runtimeObserveMs,
        runtimeMutationMs: result.action.runtimeMutationMs,
        runtimeGeneratedRuleCount: result.state.runtimeGeneratedRuleCount,
        runtimeGeneratedRuleCountDelta: result.action.runtimeGeneratedRuleCountDelta,
        runtimeStyleRawBytes: result.state.runtimeStyleRawBytes,
        runtimeStyleRawBytesDelta: result.action.runtimeStyleRawBytesDelta,
        retainedClassCount: result.state.retainedClassCount,
        retainedRuleCount: result.state.retainedRuleCount,
        mutationObserverCallbackCount: result.action.mutationObserverCallbackCount,
        mutationObserverCallbackDurationMs: result.action.mutationObserverCallbackDurationMs,
        routeCount: result.action.routeCount,
        progressiveAdopted: result.state.progressiveAdopted,
        computedStyleValid: result.action.computedStyleValid
    }

    return {
        events: result.events,
        values,
        state: omitRuntimeStyleText(result.state),
        action: result.action,
        runtimeStyleText: result.state.runtimeStyleText || ''
    }
}

function renderLifecycleDocument(options: {
    spec: BrowserLifecycleVariantSpec
    modeId: BrowserLifecycleModeId
    classes: LifecycleClassModel
    includeStaticClassSource: boolean
}) {
    const itemCount = getInitialItemCount(options.spec)
    const items = renderLifecycleItems(options.classes, itemCount)
    const staticClassSource = options.includeStaticClassSource
        ? renderStaticClassSource(options.classes)
        : ''

    return [
        '<!doctype html>',
        '<html lang="en">',
        '<head>',
        '    <meta charset="utf-8">',
        '    <meta name="viewport" content="width=device-width, initial-scale=1">',
        `    <title>${escapeHTML(options.spec.detailLabel)} lifecycle benchmark</title>`,
        renderLifecycleHeadStyle(),
        renderLifecycleMetricsScript({ autoReady: options.modeId === 'master-static' || options.modeId === 'tailwind-static' }),
        '</head>',
        `<body class="${classAttribute(options.classes.body)}">`,
        '    <span id="benchmark-style-probe" class="text-center" hidden>style probe</span>',
        '    <div id="benchmark-loaded" hidden>loaded</div>',
        `    <main class="${classAttribute(options.classes.shell)}">`,
        `        <header class="${classAttribute(options.classes.header)}">`,
        `            <h1 class="${classAttribute(options.classes.title)}">${escapeHTML(options.spec.detailLabel)}</h1>`,
        `            <p class="${classAttribute(options.classes.subtitle)}">Browser lifecycle fixture for ${escapeHTML(options.spec.scenarioId)}.</p>`,
        '        </header>',
        `        <section class="${classAttribute(options.classes.panel)}">`,
        `            <button class="${classAttribute(options.classes.button)}" type="button">Action</button>`,
        '            <div id="lifecycle-scratch"></div>',
        '        </section>',
        `        <section id="lifecycle-route" class="${classAttribute(options.classes.routeShell)}">`,
        `            <div class="${classAttribute(options.classes.routeHero)}">`,
        '                <strong>Lifecycle route</strong>',
        '                <p>Initial route content used before route-navigation scenarios.</p>',
        '            </div>',
        `            <section id="lifecycle-grid" class="${classAttribute(options.classes.grid)}">`,
        items,
        '            </section>',
        '        </section>',
        staticClassSource,
        '    </main>',
        renderLifecycleScenarioScript({
            spec: options.spec,
            classes: options.classes
        }),
        '</body>',
        '</html>'
    ].join('\n')
}

function renderLifecycleHeadStyle() {
    return [
        '    <style>',
        '        :root { --lifecycle-card-bg: #ffffff; --lifecycle-card-fg: #1e293b; }',
        '        :root[data-theme="dark"] { --lifecycle-card-bg: #0f172a; --lifecycle-card-fg: #ffffff; }',
        '        :root[data-theme="dark"] .lifecycle-data-card { background: #0f172a; color: #ffffff; }',
        '        .lifecycle-variable-card { background: var(--lifecycle-card-bg); color: var(--lifecycle-card-fg); }',
        '    </style>'
    ].join('\n')
}

function renderLifecycleMetricsScript(options: { autoReady: boolean }) {
    return [
        '    <script>',
        '        window.__benchmarkReady = false;',
        '        window.__lifecycleMetrics = {',
        '            runtimeScriptLoadedMs: 0,',
        '            runtimeReadyMs: 0,',
        '            runtimeBootstrapMs: 0,',
        '            runtimeObserveMs: 0,',
        '            progressiveAdopted: 0,',
        '            runtimeMutationMs: 0,',
        '            collectMutations: false,',
        '            mutationObserverCallbackCount: 0,',
        '            mutationObserverCallbackDurationMs: 0,',
        '            lcpMs: 0',
        '        };',
        '        try {',
        '            new PerformanceObserver((list) => {',
        '                const entries = list.getEntries();',
        '                const last = entries[entries.length - 1];',
        '                if (last) window.__lifecycleMetrics.lcpMs = last.startTime;',
        '            }).observe({ type: "largest-contentful-paint", buffered: true });',
        '        } catch {}',
        '        window.__markLifecycleReady = function() {',
        '            requestAnimationFrame(() => requestAnimationFrame(() => {',
        '                const marker = document.getElementById("benchmark-loaded");',
        '                if (marker) marker.dataset.ready = "true";',
        '                document.documentElement.dataset.benchmarkReady = "true";',
        '                document.documentElement.removeAttribute("hidden");',
        '                window.__benchmarkReady = true;',
        '            }));',
        '        };',
        options.autoReady ? '        window.addEventListener("load", () => window.__markLifecycleReady());' : '',
        '    </script>'
    ].filter(Boolean).join('\n')
}

function renderLifecycleScenarioScript(options: {
    spec: BrowserLifecycleVariantSpec
    classes: LifecycleClassModel
}) {
    const config = JSON.stringify({
        scenarioId: options.spec.scenarioId,
        detailId: options.spec.detailId,
        appendCount: options.spec.appendCount || 0,
        appendRuleState: options.spec.appendRuleState || 'existing-rule',
        toggleRounds: options.spec.toggleRounds || 6,
        themeModel: options.spec.themeModel || 'class-swap',
        longSessionMs: options.spec.longSessionMs || getLongSessionDurationMs(),
        classes: {
            cardBase: options.classes.cardBase,
            cardLight: options.classes.cardLight,
            cardActive: options.classes.cardActive,
            cardSelected: options.classes.cardSelected,
            cardExpanded: options.classes.cardExpanded,
            cardDark: options.classes.cardDark,
            cardNew: options.classes.cardNew,
            cardTitle: options.classes.cardTitle,
            cardMeta: options.classes.cardMeta,
            grid: options.classes.grid,
            routeHero: options.classes.routeHero
        }
    })

    return [
        '    <script>',
        `        window.__lifecycleConfig = ${config};`,
        '        window.__runLifecycleScenario = async function() {',
        '            const config = window.__lifecycleConfig;',
        '            const metrics = window.__lifecycleMetrics;',
        '            resetCollectedMetrics(metrics);',
        '            const before = readLifecycleState();',
        '            metrics.collectMutations = true;',
        '            const startedAt = performance.now();',
        '            let details = { affectedElementCount: 0, routeCount: 0, computedStyleValid: true };',
        '            if (config.scenarioId === "large-append") details = runLargeAppend(config);',
        '            if (config.scenarioId === "repeated-toggle") details = await runRepeatedToggle(config);',
        '            if (config.scenarioId === "theme-switch") details = runThemeSwitch(config);',
        '            if (config.scenarioId === "route-navigation") details = await runRouteNavigation(config);',
        '            if (config.scenarioId === "long-session") details = await runLongSession(config);',
        '            if (config.scenarioId === "large-dom") details = { affectedElementCount: countCards(), routeCount: 0, computedStyleValid: true };',
        '            await waitFrames(3);',
        '            metrics.collectMutations = false;',
        '            const after = readLifecycleState();',
        '            return {',
        '                elapsedMs: performance.now() - startedAt,',
        '                affectedElementCount: details.affectedElementCount || 0,',
        '                routeCount: details.routeCount || 0,',
        '                computedStyleValid: details.computedStyleValid ? 1 : 0,',
        '                runtimeMutationMs: metrics.runtimeMutationMs || 0,',
        '                runtimeGeneratedRuleCountDelta: after.runtimeGeneratedRuleCount - before.runtimeGeneratedRuleCount,',
        '                runtimeStyleRawBytesDelta: after.runtimeStyleRawBytes - before.runtimeStyleRawBytes,',
        '                mutationObserverCallbackCount: metrics.mutationObserverCallbackCount || 0,',
        '                mutationObserverCallbackDurationMs: metrics.mutationObserverCallbackDurationMs || 0',
        '            };',
        '        };',
        '        window.__readLifecycleState = readLifecycleState;',
        '        function runLargeAppend(config) {',
        '            const scratch = getScratch();',
        '            scratch.textContent = "";',
        '            const extra = config.appendRuleState === "new-rule" ? config.classes.cardNew : [];',
        '            for (let index = 0; index < config.appendCount; index++) scratch.appendChild(createCard(config, index, extra));',
        '            const target = scratch.querySelector(".lifecycle-card");',
        '            const style = target ? getComputedStyle(target) : null;',
        '            return { affectedElementCount: config.appendCount, routeCount: 0, computedStyleValid: Boolean(style) };',
        '        }',
        '        async function runRepeatedToggle(config) {',
        '            const cards = getCards();',
        '            for (let round = 0; round < config.toggleRounds; round++) {',
        '                const add = round % 2 === 0;',
        '                for (const card of cards) {',
        '                    toggleClasses(card, config.classes.cardActive, add);',
        '                    toggleClasses(card, config.classes.cardSelected, !add);',
        '                    toggleClasses(card, config.classes.cardExpanded, add);',
        '                }',
        '                await waitFrames(1);',
        '            }',
        '            return { affectedElementCount: cards.length * config.toggleRounds, routeCount: 0, computedStyleValid: cards.length > 0 };',
        '        }',
        '        function runThemeSwitch(config) {',
        '            const cards = getCards();',
        '            if (config.themeModel === "class-swap") {',
        '                for (const card of cards) { removeClasses(card, config.classes.cardLight); addClasses(card, config.classes.cardDark); }',
        '            }',
        '            if (config.themeModel === "data-attribute") {',
        '                for (const card of cards) card.classList.add("lifecycle-data-card");',
        '                document.documentElement.dataset.theme = "dark";',
        '            }',
        '            if (config.themeModel === "css-variable") {',
        '                for (const card of cards) card.classList.add("lifecycle-variable-card");',
        '                document.documentElement.dataset.theme = "dark";',
        '            }',
        '            const target = cards[0];',
        '            const color = target ? getComputedStyle(target).backgroundColor : "";',
        '            return { affectedElementCount: cards.length, routeCount: 0, computedStyleValid: Boolean(color) };',
        '        }',
        '        async function runRouteNavigation(config) {',
        '            const routes = ["home", "dashboard", "settings", "dashboard"];',
        '            for (const route of routes) {',
        '                renderRoute(config, route);',
        '                await waitFrames(1);',
        '            }',
        '            return { affectedElementCount: countCards(), routeCount: routes.length, computedStyleValid: countCards() > 0 };',
        '        }',
        '        async function runLongSession(config) {',
        '            const startedAt = performance.now();',
        '            let operations = 0;',
        '            while (performance.now() - startedAt < config.longSessionMs) {',
        '                runLargeAppend({ ...config, appendCount: 20, appendRuleState: operations % 2 ? "existing-rule" : "new-rule" });',
        '                await runRepeatedToggle({ ...config, toggleRounds: 1 });',
        '                runThemeSwitch({ ...config, themeModel: operations % 2 ? "class-swap" : "data-attribute" });',
        '                getScratch().textContent = "";',
        '                operations++;',
        '                await waitFrames(1);',
        '            }',
        '            return { affectedElementCount: operations * 20 + countCards() * operations, routeCount: 0, computedStyleValid: operations > 0 };',
        '        }',
        '        function renderRoute(config, route) {',
        '            const routeRoot = document.getElementById("lifecycle-route");',
        '            const count = route === "dashboard" ? 96 : route === "settings" ? 48 : 24;',
        '            const heading = route[0].toUpperCase() + route.slice(1);',
        '            routeRoot.innerHTML = `<div class="${classAttribute(config.classes.routeHero)}"><strong>${heading}</strong><p>${route} lifecycle route.</p></div><section id="lifecycle-grid" class="${classAttribute(config.classes.grid)}"></section>`;',
        '            const grid = document.getElementById("lifecycle-grid");',
        '            for (let index = 0; index < count; index++) grid.appendChild(createCard(config, index, route === "settings" ? config.classes.cardNew : []));',
        '        }',
        '        function createCard(config, index, extraClasses) {',
        '            const card = document.createElement("article");',
        '            addClasses(card, config.classes.cardBase);',
        '            addClasses(card, config.classes.cardLight);',
        '            if (extraClasses?.length) addClasses(card, extraClasses);',
        '            card.dataset.index = String(index);',
        '            const title = document.createElement("strong");',
        '            addClasses(title, config.classes.cardTitle);',
        '            title.textContent = `Item ${index + 1}`;',
        '            const meta = document.createElement("span");',
        '            addClasses(meta, config.classes.cardMeta);',
        '            meta.textContent = "Lifecycle";',
        '            card.append(title, meta);',
        '            return card;',
        '        }',
        '        function readLifecycleState() {',
        '            const runtime = globalThis.masterCSSRuntime;',
        '            const runtimeStyleText = runtime?.style?.textContent || runtime?.text || "";',
        '            const retainedClassNames = [...(runtime?.retainedClassNames || [])].map(String);',
        '            const retainedRuleCount = countRetainedRules(runtime, retainedClassNames);',
        '            const elements = [...document.querySelectorAll("*")];',
        '            const classTotal = elements.reduce((total, element) => total + element.classList.length, 0);',
        '            const fcp = performance.getEntriesByType("paint").find((entry) => entry.name === "first-contentful-paint");',
        '            return {',
        '                domNodeCount: elements.length,',
        '                averageClassCount: elements.length ? classTotal / elements.length : 0,',
        '                cssomRuleCount: countDocumentCSSOMRules(),',
        '                runtimeGeneratedRuleCount: runtime?.classUtilities?.size || countCSSRules(runtime?.style?.sheet?.cssRules),',
        '                runtimeStyleRawBytes: new TextEncoder().encode(runtimeStyleText).length,',
        '                runtimeStyleText,',
        '                retainedClassCount: retainedClassNames.length,',
        '                retainedRuleCount,',
        '                progressiveAdopted: runtime?.progressive ? 1 : 0,',
        '                fcpMs: fcp?.startTime || 0,',
        '                lcpMs: window.__lifecycleMetrics?.lcpMs || 0',
        '            };',
        '        }',
        '        function countRetainedRules(runtime, classNames) {',
        '            let total = 0;',
        '            for (const className of classNames) {',
        '                const rule = runtime?.retainedClassRules?.get?.(className);',
        '                if (Array.isArray(rule?.nodes)) total += rule.nodes.length;',
        '                else if (rule) total++;',
        '            }',
        '            return total;',
        '        }',
        '        function countDocumentCSSOMRules() {',
        '            let total = 0;',
        '            for (const sheet of document.styleSheets) {',
        '                try { total += countCSSRules(sheet.cssRules); } catch {}',
        '            }',
        '            return total;',
        '        }',
        '        function countCSSRules(rules) {',
        '            if (!rules) return 0;',
        '            let total = 0;',
        '            for (const rule of rules) total += "cssRules" in rule ? countCSSRules(rule.cssRules) : 1;',
        '            return total;',
        '        }',
        '        function resetCollectedMetrics(metrics) {',
        '            metrics.runtimeMutationMs = 0;',
        '            metrics.mutationObserverCallbackCount = 0;',
        '            metrics.mutationObserverCallbackDurationMs = 0;',
        '        }',
        '        function getCards() { return [...document.querySelectorAll(".lifecycle-card")]; }',
        '        function countCards() { return getCards().length; }',
        '        function getScratch() { return document.getElementById("lifecycle-scratch"); }',
        '        function addClasses(element, classes) { for (const className of classes || []) element.classList.add(className); }',
        '        function removeClasses(element, classes) { for (const className of classes || []) element.classList.remove(className); }',
        '        function toggleClasses(element, classes, force) { for (const className of classes || []) element.classList.toggle(className, force); }',
        '        function classAttribute(classes) { return (classes || []).join(" "); }',
        '        function waitFrames(count) { return new Promise((resolve) => { const step = () => count-- <= 0 ? resolve() : requestAnimationFrame(step); requestAnimationFrame(step); }); }',
        '    </script>'
    ].join('\n')
}

function addStaticHarness(html: string) {
    return insertBeforeHeadEnd(html, '    <link rel="stylesheet" href="/style.css">')
}

function addRuntimeHarness(html: string, options: { hideUntilRuntime: boolean }) {
    const withVisibility = options.hideUntilRuntime ? addHiddenAttribute(html) : html
    return insertBeforeHeadEnd(withVisibility, [
        '    <script>',
        '        (() => {',
        '            const NativeMutationObserver = window.MutationObserver;',
        '            window.MutationObserver = class BenchmarkLifecycleMutationObserver extends NativeMutationObserver {',
        '                constructor(callback) {',
        '                    super((records, observer) => {',
        '                        const metrics = window.__lifecycleMetrics;',
        '                        const startedAt = performance.now();',
        '                        try {',
        '                            callback(records, observer);',
        '                        } finally {',
        '                            if (metrics?.collectMutations) {',
        '                                metrics.mutationObserverCallbackCount++;',
        '                                metrics.mutationObserverCallbackDurationMs += performance.now() - startedAt;',
        '                            }',
        '                        }',
        '                    });',
        '                }',
        '            };',
        '        })();',
        '    </script>',
        '    <script src="/global.min.js"></script>',
        '    <script>',
        '        (() => {',
        '            const metrics = window.__lifecycleMetrics;',
        '            metrics.runtimeScriptLoadedMs = performance.now();',
        '            const Runtime = window.MasterCSSRuntime;',
        '            if (!Runtime) { metrics.error = "missing-runtime"; return; }',
        '            const originalObserve = Runtime.prototype.observe;',
        '            const originalEnsureClassRules = Runtime.prototype.ensureClassRules;',
        '            const originalDeleteClassRules = Runtime.prototype.deleteClassRules;',
        '            Runtime.prototype.observe = function(...args) {',
        '                const startedAt = performance.now();',
        '                const result = originalObserve.apply(this, args);',
        '                const finishedAt = performance.now();',
        '                metrics.runtimeObserveMs = finishedAt - startedAt;',
        '                metrics.runtimeReadyMs = finishedAt;',
        '                metrics.runtimeBootstrapMs = finishedAt - metrics.runtimeScriptLoadedMs;',
        '                metrics.progressiveAdopted = this.progressive ? 1 : 0;',
        '                window.__markLifecycleReady();',
        '                return result;',
        '            };',
        '            Runtime.prototype.ensureClassRules = function(...args) {',
        '                const startedAt = performance.now();',
        '                const result = originalEnsureClassRules.apply(this, args);',
        '                const elapsed = performance.now() - startedAt;',
        '                if (metrics.collectMutations) metrics.runtimeMutationMs += elapsed;',
        '                return result;',
        '            };',
        '            Runtime.prototype.deleteClassRules = function(...args) {',
        '                const startedAt = performance.now();',
        '                const result = originalDeleteClassRules.apply(this, args);',
        '                const elapsed = performance.now() - startedAt;',
        '                if (metrics.collectMutations) metrics.runtimeMutationMs += elapsed;',
        '                return result;',
        '            };',
        '        })();',
        '    </script>'
    ].join('\n'))
}

function renderLifecycleItems(classes: LifecycleClassModel, count: number) {
    return Array.from({ length: count }, (_, index) => {
        const state = index % 4 === 0 ? classes.cardActive : classes.cardLight
        return [
            `                <article class="${classAttribute([...classes.cardBase, ...state])}" data-index="${index}">`,
            `                    <strong class="${classAttribute(classes.cardTitle)}">Item ${index + 1}</strong>`,
            `                    <span class="${classAttribute(classes.cardMeta)}">${index % 4 === 0 ? 'Active' : 'Idle'}</span>`,
            '                </article>'
        ].join('\n')
    }).join('\n')
}

function renderStaticClassSource(classes: LifecycleClassModel) {
    return `        <div style="display:none" aria-hidden="true" class="${classAttribute(getAllLifecycleClasses(classes))} lifecycle-data-card lifecycle-variable-card"></div>`
}

function getAllLifecycleClasses(classes: LifecycleClassModel) {
    return [
        ...classes.body,
        ...classes.shell,
        ...classes.header,
        ...classes.title,
        ...classes.subtitle,
        ...classes.panel,
        ...classes.grid,
        ...classes.cardBase,
        ...classes.cardLight,
        ...classes.cardActive,
        ...classes.cardSelected,
        ...classes.cardExpanded,
        ...classes.cardDark,
        ...classes.cardNew,
        ...classes.cardTitle,
        ...classes.cardMeta,
        ...classes.button,
        ...classes.routeShell,
        ...classes.routeHero,
        'text-center'
    ]
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

function getInitialItemCount(spec: BrowserLifecycleVariantSpec) {
    if (spec.nodeTarget) return Math.max(1, Math.floor(spec.nodeTarget / 3))
    if (spec.scenarioId === 'initial-load') return 160
    if (spec.scenarioId === 'theme-switch') return 320
    if (spec.scenarioId === 'route-navigation') return 96
    if (spec.scenarioId === 'long-session') return 240
    return 160
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

function createPayloadSamples(variantId: string, payload: {
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

function createDeliveredCSSStructureSamples(variantId: string, css: string): BenchmarkSample[] {
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

function createLifecycleMetricSamples(variantId: string, round: number, values: LifecycleMeasurementValues): BenchmarkSample[] {
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

async function waitForBenchmarkReady(page: Page) {
    await page.waitForFunction(() => globalThis.__benchmarkReady === true, undefined, { timeout: 30000 })
}

async function assertLifecycleCorrect(page: Page) {
    const result = await page.evaluate(() => ({
        ready: document.documentElement.dataset.benchmarkReady,
        textAlign: getComputedStyle(document.getElementById('benchmark-style-probe')!).textAlign,
        hidden: document.documentElement.hasAttribute('hidden')
    }))

    if (result.ready !== 'true') throw new Error('Lifecycle benchmark page did not set the ready marker.')
    if (result.textAlign !== 'center') throw new Error(`Expected text-center probe to be centered, received ${result.textAlign}.`)
    if (result.hidden) throw new Error('Lifecycle benchmark page remained hidden after ready.')
}

async function readLifecycleState(page: Page): Promise<LifecycleStateWithRuntimeStyle> {
    return page.evaluate(() => globalThis.__readLifecycleState())
}

async function readRuntimeMetrics(page: Page) {
    return page.evaluate(() => {
        const metrics = globalThis.__lifecycleMetrics || {}
        return {
            runtimeReadyMs: metrics.runtimeReadyMs || 0,
            runtimeBootstrapMs: metrics.runtimeBootstrapMs || 0,
            runtimeObserveMs: metrics.runtimeObserveMs || 0
        }
    })
}

async function readJSHeapUsedBytes(client: CDPSession) {
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

function createEmptyActionResult(): LifecycleActionResult {
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

function omitRuntimeStyleText(state: LifecycleStateWithRuntimeStyle): LifecycleState {
    const { runtimeStyleText: _runtimeStyleText, ...serializableState } = state
    return serializableState
}

function summarizeTraceEvents(events: ChromeTraceEvent[]): LifecycleTraceMetrics {
    const styleNames = new Set([
        'UpdateLayoutTree',
        'RecalculateStyles',
        'Document::updateStyle'
    ])

    return {
        stylesheetParseMs: sumTraceDurations(events, new Set([
            'ParseAuthorStyleSheet',
            'ParseStyleSheet',
            'CSSParserImpl::parseStyleSheet'
        ])),
        styleRecalculationMs: sumTraceDurations(events, styleNames),
        styleRecalculationCount: countTraceEvents(events, styleNames),
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

function countTraceEvents(events: ChromeTraceEvent[], names: Set<string>) {
    return events.filter((event) => event.ph === 'X' && event.name && names.has(event.name)).length
}

function countLongTasks(events: ChromeTraceEvent[]) {
    return events.filter((event) => (
        event.ph === 'X'
        && typeof event.dur === 'number'
        && event.dur >= 50000
        && Boolean(event.name?.includes('RunTask') || event.name?.includes('ProcessTask'))
    )).length
}

function collectConsoleWarnings(page: Page) {
    const warnings: string[] = []
    page.on('console', (message) => {
        if (message.type() === 'warning') warnings.push(message.text())
    })
    return warnings
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
        throw new Error('Unable to allocate local browser lifecycle benchmark server port.')
    }

    return {
        origin: `http://127.0.0.1:${address.port}/`,
        close: () => closeServer(server)
    }
}

function closeServer(server: Server) {
    return new Promise<void>((resolveClose, rejectClose) => {
        server.close((error) => {
            if (error) rejectClose(error)
            else resolveClose()
        })
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

function addHiddenAttribute(html: string) {
    return html.replace(/<html([^>]*)>/i, (match, attrs: string) => (
        /\shidden(?:[\s=>]|$)/i.test(attrs)
            ? match
            : `<html${attrs} hidden>`
    ))
}

function insertBeforeHeadEnd(html: string, content: string) {
    return html.replace('</head>', `${content}\n</head>`)
}

function classAttribute(classes: string[]) {
    return classes.join(' ')
}

function escapeHTML(value: string) {
    return value.replace(/[&<>"']/g, (character) => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    })[character]!)
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
