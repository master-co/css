import { createServer, type Server } from 'node:http'
import { existsSync } from 'node:fs'
import { readFile, writeFile } from 'node:fs/promises'
import { extname, isAbsolute, relative, resolve } from 'node:path'
import { performance } from 'node:perf_hooks'
import { chromium, type Browser, type Page } from '@playwright/test'
import { render } from '@master/css-server'
import type { MasterCSSManifest } from '@master/css'
import { benchmarkAdapters, benchmarkFixtures } from '../fixtures/manifest'
import { summarizeBytes } from './bytes'
import { collectEnvironment, collectPackageVersions } from './environment'
import { validateFixtures } from './fixtures'
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
    BenchmarkMetric,
    BenchmarkMetricUnit,
    BenchmarkReport,
    BenchmarkSample,
    BenchmarkVariant
} from './types'

export type InteractionModeId =
    | 'master-static'
    | 'master-runtime'
    | 'master-progressive'
    | 'tailwind-static'

export type InteractionScenarioId =
    | 'existing-class-toggle'
    | 'new-class-toggle'
    | 'dom-append-remove'
    | 'theme-switch'
    | 'viewport-resize'
    | 'mutation-cleanup-cycle'

export type RuntimeMutationStrategyId =
    | 'baseline'
    | 'defer-remove'
    | 'suppress-remove-during-trace'

interface ChromeTraceEvent {
    name?: string
    ph?: string
    dur?: number
}

interface InteractionModeDescriptor {
    id: InteractionModeId
    adapterId: 'master-static' | 'master-runtime' | 'master-progressive' | 'tailwind-cli'
    label: string
}

interface InteractionScenarioDescriptor {
    id: InteractionScenarioId
    label: string
    description: string
}

export type InteractionPageSuite =
    | 'interaction-cost'
    | 'runtime-mutation-diagnostics'
    | 'runtime-style-invalidation-diagnostics'

export interface InteractionPage {
    root: string
    artifacts: BenchmarkArtifact[]
}

interface InteractionMeasurement {
    samples: BenchmarkSample[]
    artifacts: BenchmarkArtifact[]
}

export interface InteractionResult {
    elapsedMs: number
    runtimeMutationMs: number
    runtimeGeneratedRuleCountDelta: number
    runtimeStyleRawBytesDelta: number
    domNodeCount: number
    affectedElementCount: number
    computedStyleValid: number
    cleanupValid: number
    progressiveAdopted: number
    runtimeStyleText: string
    details: Record<string, unknown>
}

export interface RetainedRuleState {
    retainedClassNames: string[]
    retainedClassRuleCount: number
    retainedClassRawBytes: number
}

export interface RuntimeState {
    runtimeAvailable: boolean
    progressiveAdopted: number
    runtimeGeneratedRuleCount: number
    runtimeStyleRawBytes: number
    runtimeStyleText: string
    classCounts: Record<string, number>
    classUtilityNames: string[]
    retainedClassNames: string[]
    retainedClassRuleCount: number
    retainedClassRawBytes: number
    domNodeCount: number
}

interface InteractionClassModel {
    family: 'master' | 'tailwind'
    body: string[]
    shell: string[]
    header: string[]
    title: string[]
    subtitle: string[]
    grid: string[]
    itemBase: string[]
    itemLight: string[]
    itemActive: string[]
    itemDark: string[]
    itemNew: string[]
    itemTemp: string[]
    itemTitle: string[]
    itemMeta: string[]
    panel: string[]
    button: string[]
}

const fixedViewport = {
    width: 1280,
    height: 720
}

export const interactionFixtureIds = [
    'dynamic',
    'dashboard',
    'stress-dom'
] satisfies BenchmarkFixtureId[]

export const interactionModes = [
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
] satisfies InteractionModeDescriptor[]

export const interactionScenarios = [
    {
        id: 'existing-class-toggle',
        label: 'Existing class toggle',
        description: 'Toggle state classes that already exist in the delivered or hydrated CSS.'
    },
    {
        id: 'new-class-toggle',
        label: 'New class toggle',
        description: 'Toggle a class absent from initial CSS so Master runtime/progressive has to generate a rule.'
    },
    {
        id: 'dom-append-remove',
        label: 'DOM append/remove',
        description: 'Insert and remove repeated components using already-known classes.'
    },
    {
        id: 'theme-switch',
        label: 'Theme switch',
        description: 'Switch repeated items between light and dark utility class sets.'
    },
    {
        id: 'viewport-resize',
        label: 'Viewport resize',
        description: 'Resize the viewport with the same DOM and CSS to capture recalculation/layout cost.'
    },
    {
        id: 'mutation-cleanup-cycle',
        label: 'Mutation cleanup cycle',
        description: 'Repeat insert/remove cycles and verify temporary runtime classes are cleaned up.'
    }
] satisfies InteractionScenarioDescriptor[]

export const interactionCostMetrics = [
    {
        id: 'interaction-ready-ms',
        label: 'Mutation to ready',
        unit: 'ms',
        description: 'Elapsed time from the interaction mutation start until the page completes the post-mutation animation-frame settle.'
    },
    {
        id: 'runtime-mutation-ms',
        label: 'Runtime rule update',
        unit: 'ms',
        description: 'Instrumented Master CSS runtime ensure/delete class-rules time during the measured interaction, where a runtime exists.'
    },
    {
        id: 'runtime-generated-rule-count-delta',
        label: 'Runtime rule delta',
        unit: 'count',
        description: 'Change in recursive style#master-css CSSOM rule count after the interaction.'
    },
    {
        id: 'runtime-style-raw-bytes-delta',
        label: 'Runtime style byte delta',
        unit: 'B',
        description: 'Change in raw bytes for style#master-css after the interaction.'
    },
    {
        id: 'style-recalculation-ms',
        label: 'Style recalculation',
        unit: 'ms',
        description: 'Trace-derived style recalculation duration during the interaction.'
    },
    {
        id: 'layout-ms',
        label: 'Layout',
        unit: 'ms',
        description: 'Trace-derived layout duration during the interaction.'
    },
    {
        id: 'paint-ms',
        label: 'Paint',
        unit: 'ms',
        description: 'Trace-derived paint and pre-paint duration during the interaction.'
    },
    {
        id: 'long-task-count',
        label: 'Long tasks',
        unit: 'count',
        description: 'Count of trace task events at or above 50 ms during the interaction.'
    },
    {
        id: 'dom-node-count',
        label: 'DOM nodes',
        unit: 'count',
        description: 'Total DOM element count after the interaction settles.'
    },
    {
        id: 'affected-element-count',
        label: 'Affected elements',
        unit: 'count',
        description: 'Number of fixture elements intentionally touched by the scenario.'
    },
    {
        id: 'computed-style-valid',
        label: 'Computed style valid',
        unit: 'count',
        description: '1 when the scenario computed-style assertion passed, otherwise 0.'
    },
    {
        id: 'cleanup-valid',
        label: 'Cleanup valid',
        unit: 'count',
        description: '1 when temporary DOM nodes are removed and temporary classes are absent from runtime classCounts after scenarios that remove nodes.'
    },
    {
        id: 'progressive-adopted',
        label: 'Progressive adopted',
        unit: 'count',
        description: '1 when the Master progressive variant adopted server-rendered style#master-css before interaction.'
    }
] satisfies BenchmarkMetric[]

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

    const result = render(sourceHtml, await readDefaultManifest(), {
        hydrationManifest: 'inject'
    })
    const inlineCSS = result.css?.text || ''
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

function renderInteractionDocument(options: {
    fixtureId: BenchmarkFixtureId
    modeId: InteractionModeId
    scenarioId: InteractionScenarioId
    classes: InteractionClassModel
    includeStaticClassSource: boolean
    runtimeMutationStrategy?: RuntimeMutationStrategyId
    postInteractionSettleFrames?: number
}) {
    const fixture = getInteractionFixtureShape(options.fixtureId)
    const staticClassSource = options.includeStaticClassSource
        ? renderStaticClassSource(options.classes)
        : ''
    const items = renderInteractionItems(options.classes, fixture.itemCount)

    return [
        '<!doctype html>',
        '<html lang="en">',
        '<head>',
        '    <meta charset="utf-8">',
        '    <meta name="viewport" content="width=device-width, initial-scale=1">',
        `    <title>${escapeHTML(fixture.label)} interaction benchmark</title>`,
        '</head>',
        `<body class="${classAttribute(options.classes.body)}">`,
        '    <span id="interaction-style-probe" class="text-center" hidden>style probe</span>',
        '    <div id="benchmark-loaded" hidden>loaded</div>',
        `    <main class="${classAttribute(options.classes.shell)}">`,
        `        <header class="${classAttribute(options.classes.header)}">`,
        `            <h1 class="${classAttribute(options.classes.title)}">${escapeHTML(fixture.label)} interaction fixture</h1>`,
        `            <p class="${classAttribute(options.classes.subtitle)}">${escapeHTML(fixture.description)}</p>`,
        '        </header>',
        `        <section class="${classAttribute(options.classes.panel)}">`,
        `            <button class="${classAttribute(options.classes.button)}" type="button">Action</button>`,
        '            <div id="interaction-scratch"></div>',
        '        </section>',
        `        <section class="interaction-grid ${classAttribute(options.classes.grid)}" data-fixture="${options.fixtureId}">`,
        items,
        '        </section>',
        staticClassSource,
        '    </main>',
        renderInteractionScript({
            fixtureId: options.fixtureId,
            modeId: options.modeId,
            scenarioId: options.scenarioId,
            classes: options.classes,
            affectedCount: fixture.affectedCount,
            appendCount: fixture.appendCount,
            cleanupCycles: fixture.cleanupCycles,
            runtimeMutationStrategy: options.runtimeMutationStrategy,
            postInteractionSettleFrames: options.postInteractionSettleFrames
        }),
        '</body>',
        '</html>'
    ].join('\n')
}

function renderInteractionItems(classes: InteractionClassModel, count: number) {
    return Array.from({ length: count }, (_, index) => {
        const stateClasses = index % 3 === 0 ? classes.itemActive : classes.itemLight
        return [
            `            <article class="${classAttribute([...classes.itemBase, ...stateClasses])}" data-index="${index}">`,
            `                <strong class="${classAttribute(classes.itemTitle)}">Item ${index + 1}</strong>`,
            `                <span class="${classAttribute(classes.itemMeta)}">${index % 3 === 0 ? 'Active' : 'Idle'}</span>`,
            '            </article>'
        ].join('\n')
    }).join('\n')
}

function renderStaticClassSource(classes: InteractionClassModel) {
    return `        <div style="display:none" aria-hidden="true" class="${classAttribute(getAllInteractionClasses(classes))}"></div>`
}

function renderInteractionScript(options: {
    fixtureId: BenchmarkFixtureId
    modeId: InteractionModeId
    scenarioId: InteractionScenarioId
    classes: InteractionClassModel
    affectedCount: number
    appendCount: number
    cleanupCycles: number
    runtimeMutationStrategy?: RuntimeMutationStrategyId
    postInteractionSettleFrames?: number
}) {
    const config = JSON.stringify({
        fixtureId: options.fixtureId,
        modeId: options.modeId,
        scenarioId: options.scenarioId,
        affectedCount: options.affectedCount,
        appendCount: options.appendCount,
        cleanupCycles: options.cleanupCycles,
        postInteractionSettleFrames: options.postInteractionSettleFrames ?? 3,
        runtimeMutationStrategy: options.runtimeMutationStrategy || 'baseline',
        classes: {
            itemBase: options.classes.itemBase,
            light: options.classes.itemLight,
            active: options.classes.itemActive,
            dark: options.classes.itemDark,
            newRule: options.classes.itemNew,
            temp: options.classes.itemTemp,
            itemTitle: options.classes.itemTitle,
            itemMeta: options.classes.itemMeta
        }
    })

    return [
        '    <script>',
        `        window.__interactionConfig = ${config};`,
        '        window.__runInteractionScenario = async function() {',
        '            const config = window.__interactionConfig;',
        '            const metrics = window.__interactionMetrics || { runtimeMutationMs: 0, collectInteractionMutations: false };',
        '            metrics.runtimeMutationMs = 0;',
        '            if (metrics.runtimeDiagnosticsEnabled) resetRuntimeMutationDiagnostics(metrics);',
        '            const before = readRuntimeState();',
        '            const startedAt = performance.now();',
        '            metrics.collectInteractionMutations = true;',
        '            let scenarioDetails = {};',
        '            if (config.scenarioId === "existing-class-toggle") scenarioDetails = runExistingClassToggle(config);',
        '            if (config.scenarioId === "new-class-toggle") scenarioDetails = runNewClassToggle(config);',
        '            if (config.scenarioId === "dom-append-remove") scenarioDetails = runAppendRemove(config);',
        '            if (config.scenarioId === "theme-switch") scenarioDetails = runThemeSwitch(config);',
        '            if (config.scenarioId === "mutation-cleanup-cycle") scenarioDetails = await runCleanupCycle(config);',
        '            await waitPostInteractionSettleFrames(config.postInteractionSettleFrames);',
        '            const strategyFlushResult = flushDeferredRuntimeRemovalsBeforeResult();',
        '            if (config.scenarioId === "mutation-cleanup-cycle") scenarioDetails = finalizeCleanupCycleDetails(config, scenarioDetails, strategyFlushResult);',
        '            scenarioDetails = finalizeScenarioDetails(config, scenarioDetails);',
        '            metrics.collectInteractionMutations = false;',
        '            const after = readRuntimeState();',
        '            return createInteractionResult({',
        '                before,',
        '                after,',
        '                elapsedMs: performance.now() - startedAt,',
        '                runtimeMutationMs: metrics.runtimeMutationMs || 0,',
        '                scenarioDetails',
        '            });',
        '        };',
        '        window.__readInteractionState = readRuntimeState;',
        '        window.__readRuntimeMutationDiagnostics = readRuntimeMutationDiagnostics;',
        '        window.__waitInteractionFrames = waitFrames;',
        '        window.__finishViewportInteraction = function(input) {',
        '            const after = readRuntimeState();',
        '            return createInteractionResult({',
        '                before: input.before,',
        '                after,',
        '                elapsedMs: input.elapsedMs,',
        '                runtimeMutationMs: 0,',
        '                scenarioDetails: {',
        '                    affectedElementCount: countAffectedItems(),',
        '                    computedStyleValid: input.beforeWidth !== input.resizedWidth,',
        '                    cleanupValid: true,',
        '                    beforeWidth: input.beforeWidth,',
        '                    resizedWidth: input.resizedWidth',
        '                }',
        '            });',
        '        };',
        '        function runExistingClassToggle(config) {',
        '            const items = getAffectedItems(config.affectedCount);',
        '            const target = items[1] || items[0];',
        '            const beforeColor = getComputedStyle(target).backgroundColor;',
        '            for (const item of items) {',
        '                if (hasEveryClass(item, config.classes.active)) {',
        '                    removeClasses(item, config.classes.active);',
        '                    addClasses(item, config.classes.light);',
        '                } else {',
        '                    removeClasses(item, config.classes.light);',
        '                    addClasses(item, config.classes.active);',
        '                }',
        '            }',
        '            const afterColor = getComputedStyle(target).backgroundColor;',
        '            return {',
        '                affectedElementCount: items.length,',
        '                computedStyleValid: beforeColor !== afterColor,',
        '                cleanupValid: true,',
        '                beforeColor,',
        '                afterColor,',
        '                targetIndex: Number(target.dataset.index || 0),',
        '                validation: "backgroundColor"',
        '            };',
        '        }',
        '        function runNewClassToggle(config) {',
        '            const items = getAffectedItems(config.affectedCount);',
        '            const target = items[0];',
        '            const beforeOutlineStyle = getComputedStyle(target).outlineStyle;',
        '            const beforeOutlineWidth = getComputedStyle(target).outlineWidth;',
        '            for (const item of items) addClasses(item, config.classes.newRule);',
        '            return {',
        '                affectedElementCount: items.length,',
        '                computedStyleValid: false,',
        '                cleanupValid: true,',
        '                beforeOutlineStyle,',
        '                beforeOutlineWidth,',
        '                targetIndex: Number(target.dataset.index || 0),',
        '                validation: "outline"',
        '            };',
        '        }',
        '        function runAppendRemove(config) {',
        '            const scratch = getScratch();',
        '            scratch.textContent = "";',
        '            for (let index = 0; index < config.appendCount; index++) {',
        '                scratch.appendChild(createInteractionItem(config, index));',
        '            }',
        '            const appendedCount = scratch.children.length;',
        '            scratch.textContent = "";',
        '            return {',
        '                affectedElementCount: config.appendCount,',
        '                computedStyleValid: appendedCount === config.appendCount,',
        '                cleanupValid: scratch.children.length === 0,',
        '                appendedCount',
        '            };',
        '        }',
        '        function runThemeSwitch(config) {',
        '            const items = getAffectedItems(config.affectedCount);',
        '            const target = items[0];',
        '            const beforeColor = getComputedStyle(target).backgroundColor;',
        '            for (const item of items) {',
        '                removeClasses(item, config.classes.light);',
        '                removeClasses(item, config.classes.active);',
        '                addClasses(item, config.classes.dark);',
        '            }',
        '            const afterColor = getComputedStyle(target).backgroundColor;',
        '            document.documentElement.dataset.theme = document.documentElement.dataset.theme === "dark" ? "light" : "dark";',
        '            return {',
        '                affectedElementCount: items.length,',
        '                computedStyleValid: beforeColor !== afterColor,',
        '                cleanupValid: true,',
        '                beforeColor,',
        '                afterColor,',
        '                targetIndex: Number(target.dataset.index || 0),',
        '                validation: "backgroundColor"',
        '            };',
        '        }',
        '        async function runCleanupCycle(config) {',
        '            const scratch = getScratch();',
        '            scratch.textContent = "";',
        '            for (let cycle = 0; cycle < config.cleanupCycles; cycle++) {',
        '                for (let index = 0; index < config.appendCount; index++) {',
        '                    scratch.appendChild(createInteractionItem(config, index, config.classes.temp));',
        '                }',
        '                await waitFrames(1);',
        '                scratch.textContent = "";',
        '                await waitFrames(1);',
        '            }',
        '            const state = readRuntimeState();',
        '            const tempClassNames = config.classes.temp;',
        '            const runtimeClean = !state.runtimeAvailable || tempClassNames.every((className) => !state.classCounts[className]);',
        '            const cleanupValid = scratch.children.length === 0 && runtimeClean;',
        '            return {',
        '                affectedElementCount: config.appendCount * config.cleanupCycles,',
        '                mutationCycleCount: config.cleanupCycles,',
        '                appendCount: config.appendCount,',
        '                removedNodeCount: config.appendCount * config.cleanupCycles,',
        '                computedStyleValid: true,',
        '                cleanupValid,',
        '                cleanupValidDuringTrace: cleanupValid,',
        '                cleanupValidAfterFlush: cleanupValid,',
        '                runtimeClean,',
        '                runtimeCleanDuringTrace: runtimeClean,',
        '                runtimeCleanAfterFlush: runtimeClean',
        '            };',
        '        }',
        '        function createInteractionItem(config, index, extraClasses) {',
        '            const item = document.createElement("article");',
        '            addClasses(item, config.classes.itemBase);',
        '            addClasses(item, config.classes.light);',
        '            if (extraClasses) addClasses(item, extraClasses);',
        '            item.dataset.appended = String(index);',
        '            const title = document.createElement("strong");',
        '            addClasses(title, config.classes.itemTitle);',
        '            title.textContent = `Appended ${index + 1}`;',
        '            const meta = document.createElement("span");',
        '            addClasses(meta, config.classes.itemMeta);',
        '            meta.textContent = "Inserted";',
        '            item.append(title, meta);',
        '            return item;',
        '        }',
        '        function createInteractionResult(input) {',
        '            const details = input.scenarioDetails || {};',
        '            const after = input.after;',
        '            return {',
        '                elapsedMs: input.elapsedMs,',
        '                runtimeMutationMs: input.runtimeMutationMs,',
        '                runtimeGeneratedRuleCountDelta: after.runtimeGeneratedRuleCount - input.before.runtimeGeneratedRuleCount,',
        '                runtimeStyleRawBytesDelta: after.runtimeStyleRawBytes - input.before.runtimeStyleRawBytes,',
        '                domNodeCount: after.domNodeCount,',
        '                affectedElementCount: details.affectedElementCount || countAffectedItems(),',
        '                computedStyleValid: details.computedStyleValid ? 1 : 0,',
        '                cleanupValid: details.cleanupValid ? 1 : 0,',
        '                progressiveAdopted: after.progressiveAdopted,',
        '                runtimeStyleText: after.runtimeStyleText,',
        '                details',
        '            };',
        '        }',
        '        function finalizeScenarioDetails(config, details) {',
        '            if (!details || !details.validation) return details || {};',
        '            const target = document.querySelector(`[data-index="${details.targetIndex}"]`);',
        '            if (!target) return { ...details, computedStyleValid: false, missingTarget: true };',
        '            const style = getComputedStyle(target);',
        '            if (details.validation === "backgroundColor") {',
        '                const afterColor = style.backgroundColor;',
        '                return { ...details, afterColor, computedStyleValid: details.beforeColor !== afterColor };',
        '            }',
        '            if (details.validation === "outline") {',
        '                const afterOutlineStyle = style.outlineStyle;',
        '                const afterOutlineWidth = style.outlineWidth;',
        '                return {',
        '                    ...details,',
        '                    afterOutlineStyle,',
        '                    afterOutlineWidth,',
        '                    computedStyleValid: afterOutlineStyle !== "none" && afterOutlineWidth !== "0px"',
        '                };',
        '            }',
        '            return details;',
        '        }',
        '        function finalizeCleanupCycleDetails(config, details, strategyFlushResult) {',
        '            const state = readRuntimeState();',
        '            const tempClassNames = config.classes.temp;',
        '            const runtimeCleanAfterFlush = !state.runtimeAvailable || tempClassNames.every((className) => !state.classCounts[className]);',
        '            const cleanupValidAfterFlush = getScratch().children.length === 0 && runtimeCleanAfterFlush;',
        '            return {',
        '                ...details,',
        '                cleanupValid: cleanupValidAfterFlush,',
        '                cleanupValidAfterFlush,',
        '                runtimeCleanAfterFlush,',
        '                strategyFlushResult: strategyFlushResult || null',
        '            };',
        '        }',
        '        function flushDeferredRuntimeRemovalsBeforeResult() {',
        '            const metrics = window.__interactionMetrics;',
        '            if (metrics?.runtimeMutationStrategyId !== "defer-remove") return null;',
        '            if (typeof window.__flushRuntimeMutationStrategy !== "function") return null;',
        '            return window.__flushRuntimeMutationStrategy("before-result");',
        '        }',
        '        function readRuntimeState() {',
        '            const runtime = globalThis.masterCSSRuntime;',
        '            const runtimeStyleText = runtime?.style?.textContent || runtime?.text || "";',
        '            const retainedClassNames = [...(runtime?.retainedClassNames || [])].map(String);',
        '            const retainedRuleState = readRetainedRuleState(runtime, retainedClassNames);',
        '            return {',
        '                runtimeAvailable: Boolean(runtime),',
        '                progressiveAdopted: runtime?.progressive ? 1 : 0,',
        '                runtimeGeneratedRuleCount: runtime?.classUtilities?.size || countCSSRules(runtime?.style?.sheet?.cssRules),',
        '                runtimeStyleRawBytes: new TextEncoder().encode(runtimeStyleText).length,',
        '                runtimeStyleText,',
        '                classCounts: Object.fromEntries(runtime?.classCounts || []),',
        '                classUtilityNames: [...(runtime?.classUtilities?.keys?.() || [])].map(String),',
        '                retainedClassNames,',
        '                retainedClassRuleCount: retainedRuleState.retainedClassRuleCount,',
        '                retainedClassRawBytes: retainedRuleState.retainedClassRawBytes,',
        '                domNodeCount: document.getElementsByTagName("*").length',
        '            };',
        '        }',
        '        function readRetainedRuleState(runtime, retainedClassNames) {',
        '            let retainedClassRuleCount = 0;',
        '            let retainedClassRawBytes = 0;',
        '            for (const className of retainedClassNames) {',
        '                const rules = runtime?.classUtilities?.get?.(className) || [];',
        '                for (const rule of rules) {',
        '                    const nodes = Array.isArray(rule?.nodes) ? rule.nodes : null;',
        '                    if (nodes?.length) {',
        '                        retainedClassRuleCount += nodes.length;',
        '                        for (const node of nodes) retainedClassRawBytes += new TextEncoder().encode(node.text || "").length;',
        '                    } else {',
        '                        retainedClassRuleCount++;',
        '                        retainedClassRawBytes += new TextEncoder().encode(rule?.text || "").length;',
        '                    }',
        '                }',
        '            }',
        '            return { retainedClassRuleCount, retainedClassRawBytes };',
        '        }',
        '        function readRuntimeMutationDiagnostics() {',
        '            const metrics = window.__interactionMetrics || {};',
        '            return {',
        '                mutationObserverCallbackCount: metrics.mutationObserverCallbackCount || 0,',
        '                mutationObserverCallbackDurationMs: metrics.mutationObserverCallbackDurationMs || 0,',
        '                mutationRecordCount: metrics.mutationRecordCount || 0,',
        '                mutationAddedNodeCount: metrics.mutationAddedNodeCount || 0,',
        '                mutationRemovedNodeCount: metrics.mutationRemovedNodeCount || 0,',
        '                mutationClassAttributeCount: metrics.mutationClassAttributeCount || 0,',
        '                runtimeAddCallCount: metrics.runtimeAddCallCount || 0,',
        '                runtimeRemoveCallCount: metrics.runtimeRemoveCallCount || 0,',
        '                runtimeAddClassCount: metrics.runtimeAddClassCount || 0,',
        '                runtimeRemoveClassCount: metrics.runtimeRemoveClassCount || 0,',
        '                runtimeAddDurationMs: metrics.runtimeAddDurationMs || 0,',
        '                runtimeRemoveDurationMs: metrics.runtimeRemoveDurationMs || 0,',
        '                runtimeDeferredRemoveCallCount: metrics.runtimeDeferredRemoveCallCount || 0,',
        '                runtimeDeferredRemoveClassCount: metrics.runtimeDeferredRemoveClassCount || 0,',
        '                runtimeSuppressedRemoveCallCount: metrics.runtimeSuppressedRemoveCallCount || 0,',
        '                runtimeSuppressedRemoveClassCount: metrics.runtimeSuppressedRemoveClassCount || 0,',
        '                runtimeFlushRemoveCallCount: metrics.runtimeFlushRemoveCallCount || 0,',
        '                runtimeFlushRemoveClassCount: metrics.runtimeFlushRemoveClassCount || 0,',
        '                runtimeFlushRemoveDurationMs: metrics.runtimeFlushRemoveDurationMs || 0,',
        '                runtimeQueuedRemoveClassCount: metrics.runtimeQueuedRemoveClassCount || 0',
        '            };',
        '        }',
        '        function countCSSRules(rules) {',
        '            if (!rules) return 0;',
        '            let total = 0;',
        '            for (const rule of rules) total += "cssRules" in rule ? countCSSRules(rule.cssRules) : 1;',
        '            return total;',
        '        }',
        '        function getAffectedItems(count) { return Array.from(document.querySelectorAll(".interaction-item")).slice(0, count); }',
        '        function countAffectedItems() { return getAffectedItems(window.__interactionConfig.affectedCount).length; }',
        '        function getScratch() { return document.getElementById("interaction-scratch"); }',
        '        function hasEveryClass(element, classes) { return classes.every((className) => element.classList.contains(className)); }',
        '        function addClasses(element, classes) { if (classes.length) element.classList.add(...classes); }',
        '        function removeClasses(element, classes) { if (classes.length) element.classList.remove(...classes); }',
        '        function waitPostInteractionSettleFrames(count) {',
        '            const frameCount = Number.isFinite(count) ? Math.max(0, Math.floor(count)) : 3;',
        '            return frameCount > 0 ? waitFrames(frameCount) : Promise.resolve();',
        '        }',
        '        function waitFrames(count) {',
        '            return new Promise((resolve) => {',
        '                const step = () => {',
        '                    if (count <= 0) { resolve(); return; }',
        '                    count--;',
        '                    requestAnimationFrame(step);',
        '                };',
        '                requestAnimationFrame(step);',
        '            });',
        '        }',
        '    </script>'
    ].join('\n')
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
            const result = render(sourceHtml, await readDefaultManifest(), {
                hydrationManifest: false
            })
            return result.css?.text || ''
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

function addStaticHarness(html: string) {
    return insertBeforeBodyEnd(
        insertBeforeHeadEnd(html, '    <link rel="stylesheet" href="/style.css">'),
        [
            '    <script>',
            '        window.__benchmarkReady = false;',
            '        requestAnimationFrame(() => requestAnimationFrame(() => {',
            '            const marker = document.getElementById("benchmark-loaded");',
            '            marker.dataset.ready = "true";',
            '            document.documentElement.dataset.benchmarkReady = "true";',
            '            window.__benchmarkReady = true;',
            '        }));',
            '    </script>'
        ].join('\n')
    )
}

function addRuntimeHarness(html: string, options: {
    hideUntilRuntime: boolean
    runtimeDiagnostics?: boolean
    runtimeMutationStrategy?: RuntimeMutationStrategyId
}) {
    const withVisibility = options.hideUntilRuntime ? addHiddenAttribute(html) : html
    const runtimeMutationStrategy = options.runtimeMutationStrategy || 'baseline'

    return insertBeforeHeadEnd(withVisibility, [
        '    <script>',
        '        window.__benchmarkReady = false;',
        `        window.__interactionMetrics = createInteractionMetrics(${options.runtimeDiagnostics ? 'true' : 'false'}, ${JSON.stringify(runtimeMutationStrategy)});`,
        '        function createInteractionMetrics(runtimeDiagnosticsEnabled, runtimeMutationStrategyId) {',
        '            return {',
        '                runtimeDiagnosticsEnabled,',
        '                runtimeMutationStrategyId,',
        '                runtimeMutationMs: 0,',
        '                collectInteractionMutations: false,',
        '                mutationObserverCallbackCount: 0,',
        '                mutationObserverCallbackDurationMs: 0,',
        '                mutationRecordCount: 0,',
        '                mutationAddedNodeCount: 0,',
        '                mutationRemovedNodeCount: 0,',
        '                mutationClassAttributeCount: 0,',
        '                runtimeAddCallCount: 0,',
        '                runtimeRemoveCallCount: 0,',
        '                runtimeAddClassCount: 0,',
        '                runtimeRemoveClassCount: 0,',
        '                runtimeAddDurationMs: 0,',
        '                runtimeRemoveDurationMs: 0,',
        '                runtimeDeferredRemoveCallCount: 0,',
        '                runtimeDeferredRemoveClassCount: 0,',
        '                runtimeSuppressedRemoveCallCount: 0,',
        '                runtimeSuppressedRemoveClassCount: 0,',
        '                runtimeFlushRemoveCallCount: 0,',
        '                runtimeFlushRemoveClassCount: 0,',
        '                runtimeFlushRemoveDurationMs: 0,',
        '                runtimeQueuedRemoveClassCount: 0,',
        '                runtimeRemoveQueue: []',
        '            };',
        '        }',
        '        function resetRuntimeMutationDiagnostics(metrics) {',
        '            metrics.mutationObserverCallbackCount = 0;',
        '            metrics.mutationObserverCallbackDurationMs = 0;',
        '            metrics.mutationRecordCount = 0;',
        '            metrics.mutationAddedNodeCount = 0;',
        '            metrics.mutationRemovedNodeCount = 0;',
        '            metrics.mutationClassAttributeCount = 0;',
        '            metrics.runtimeAddCallCount = 0;',
        '            metrics.runtimeRemoveCallCount = 0;',
        '            metrics.runtimeAddClassCount = 0;',
        '            metrics.runtimeRemoveClassCount = 0;',
        '            metrics.runtimeAddDurationMs = 0;',
        '            metrics.runtimeRemoveDurationMs = 0;',
        '            metrics.runtimeDeferredRemoveCallCount = 0;',
        '            metrics.runtimeDeferredRemoveClassCount = 0;',
        '            metrics.runtimeSuppressedRemoveCallCount = 0;',
        '            metrics.runtimeSuppressedRemoveClassCount = 0;',
        '            metrics.runtimeFlushRemoveCallCount = 0;',
        '            metrics.runtimeFlushRemoveClassCount = 0;',
        '            metrics.runtimeFlushRemoveDurationMs = 0;',
        '            metrics.runtimeQueuedRemoveClassCount = 0;',
        '            metrics.runtimeRemoveQueue = [];',
        '        }',
        '        if (window.__interactionMetrics.runtimeDiagnosticsEnabled) {',
        '            const NativeMutationObserver = window.MutationObserver;',
        '            window.MutationObserver = class BenchmarkMutationObserver extends NativeMutationObserver {',
        '                constructor(callback) {',
        '                    super((records, observer) => {',
        '                        const metrics = window.__interactionMetrics;',
        '                        const startedAt = performance.now();',
        '                        if (metrics?.collectInteractionMutations) {',
        '                            metrics.mutationObserverCallbackCount++;',
        '                            metrics.mutationRecordCount += records.length;',
        '                            for (const record of records) {',
        '                                metrics.mutationAddedNodeCount += record.addedNodes?.length || 0;',
        '                                metrics.mutationRemovedNodeCount += record.removedNodes?.length || 0;',
        '                                if (record.type === "attributes" && record.attributeName === "class") {',
        '                                    metrics.mutationClassAttributeCount++;',
        '                                }',
        '                            }',
        '                        }',
        '                        try {',
        '                            callback(records, observer);',
        '                        } finally {',
        '                            if (metrics?.collectInteractionMutations) metrics.mutationObserverCallbackDurationMs += performance.now() - startedAt;',
        '                        }',
        '                    });',
        '                }',
        '            };',
        '        }',
        '    </script>',
        '    <script src="/global.min.js"></script>',
        '    <script>',
        '        (() => {',
        '            const metrics = window.__interactionMetrics;',
        '            const Runtime = window.MasterCSSRuntime;',
        '            if (!Runtime) { metrics.error = "missing-runtime"; return; }',
        '            const originalObserve = Runtime.prototype.observe;',
        '            const originalEnsureClassRules = Runtime.prototype.ensureClassRules;',
        '            const originalDeleteClassRules = Runtime.prototype.deleteClassRules;',
        '            Runtime.prototype.ensureClassRules = function(...args) {',
        '                const startedAt = performance.now();',
        '                const result = originalEnsureClassRules.apply(this, args);',
        '                const elapsed = performance.now() - startedAt;',
        '                if (metrics.collectInteractionMutations) {',
        '                    metrics.runtimeMutationMs += elapsed;',
        '                    if (metrics.runtimeDiagnosticsEnabled) {',
        '                        metrics.runtimeAddCallCount++;',
        '                        metrics.runtimeAddClassCount += args.length;',
        '                        metrics.runtimeAddDurationMs += elapsed;',
        '                    }',
        '                }',
        '                return result;',
        '            };',
        '            Runtime.prototype.deleteClassRules = function(...args) {',
        '                const strategyId = metrics.runtimeMutationStrategyId || "baseline";',
        '                if (metrics.collectInteractionMutations && strategyId !== "baseline") {',
        '                    const startedAt = performance.now();',
        '                    const classNames = normalizeRuntimeClassNames(args);',
        '                    queueRuntimeRemoval(this, classNames, strategyId);',
        '                    const elapsed = performance.now() - startedAt;',
        '                    metrics.runtimeMutationMs += elapsed;',
        '                    if (metrics.runtimeDiagnosticsEnabled) {',
        '                        metrics.runtimeRemoveCallCount++;',
        '                        metrics.runtimeRemoveClassCount += classNames.length;',
        '                        metrics.runtimeRemoveDurationMs += elapsed;',
        '                    }',
        '                    return this;',
        '                }',
        '                const startedAt = performance.now();',
        '                const result = originalDeleteClassRules.apply(this, args);',
        '                const elapsed = performance.now() - startedAt;',
        '                if (metrics.collectInteractionMutations) {',
        '                    metrics.runtimeMutationMs += elapsed;',
        '                    if (metrics.runtimeDiagnosticsEnabled) {',
        '                        metrics.runtimeRemoveCallCount++;',
        '                        metrics.runtimeRemoveClassCount += args.length;',
        '                        metrics.runtimeRemoveDurationMs += elapsed;',
        '                    }',
        '                }',
        '                return result;',
        '            };',
        '            function normalizeRuntimeClassNames(args) {',
        '                const classNames = [];',
        '                for (const arg of args) {',
        '                    if (Array.isArray(arg)) {',
        '                        for (const value of arg) if (typeof value === "string" && value) classNames.push(value);',
        '                    } else if (typeof arg === "string" && arg) {',
        '                        classNames.push(arg);',
        '                    }',
        '                }',
        '                return classNames;',
        '            }',
        '            function queueRuntimeRemoval(runtime, classNames, strategyId) {',
        '                if (!classNames.length) return;',
        '                metrics.runtimeRemoveQueue.push({ runtime, classNames });',
        '                metrics.runtimeQueuedRemoveClassCount += classNames.length;',
        '                if (strategyId === "defer-remove") {',
        '                    metrics.runtimeDeferredRemoveCallCount++;',
        '                    metrics.runtimeDeferredRemoveClassCount += classNames.length;',
        '                } else if (strategyId === "suppress-remove-during-trace") {',
        '                    metrics.runtimeSuppressedRemoveCallCount++;',
        '                    metrics.runtimeSuppressedRemoveClassCount += classNames.length;',
        '                }',
        '            }',
        '            window.__flushRuntimeMutationStrategy = function(reason) {',
        '                const queue = metrics.runtimeRemoveQueue || [];',
        '                if (!queue.length) {',
        '                    return {',
        '                        reason,',
        '                        strategyId: metrics.runtimeMutationStrategyId || "baseline",',
        '                        flushed: false,',
        '                        callCount: 0,',
        '                        classCount: 0,',
        '                        durationMs: 0,',
        '                        queuedClassCountBeforeFlush: 0',
        '                    };',
        '                }',
        '                const byRuntime = new Map();',
        '                let queuedClassCountBeforeFlush = 0;',
        '                for (const entry of queue) {',
        '                    let classNames = byRuntime.get(entry.runtime);',
        '                    if (!classNames) {',
        '                        classNames = new Set();',
        '                        byRuntime.set(entry.runtime, classNames);',
        '                    }',
        '                    for (const className of entry.classNames) {',
        '                        classNames.add(className);',
        '                        queuedClassCountBeforeFlush++;',
        '                    }',
        '                }',
        '                metrics.runtimeRemoveQueue = [];',
        '                const startedAt = performance.now();',
        '                let callCount = 0;',
        '                let classCount = 0;',
        '                for (const [runtime, classNames] of byRuntime) {',
        '                    const names = [...classNames];',
        '                    if (!names.length) continue;',
        '                    originalDeleteClassRules.apply(runtime, names);',
        '                    callCount++;',
        '                    classCount += names.length;',
        '                }',
        '                const elapsed = performance.now() - startedAt;',
        '                metrics.runtimeFlushRemoveCallCount += callCount;',
        '                metrics.runtimeFlushRemoveClassCount += classCount;',
        '                metrics.runtimeFlushRemoveDurationMs += elapsed;',
        '                return {',
        '                    reason,',
        '                    strategyId: metrics.runtimeMutationStrategyId || "baseline",',
        '                    flushed: true,',
        '                    callCount,',
        '                    classCount,',
        '                    durationMs: elapsed,',
        '                    queuedClassCountBeforeFlush',
        '                };',
        '            };',
        '            Runtime.prototype.observe = function(...args) {',
        '                const result = originalObserve.apply(this, args);',
        '                requestAnimationFrame(() => requestAnimationFrame(() => {',
        '                    const marker = document.getElementById("benchmark-loaded");',
        '                    marker.dataset.ready = "true";',
        '                    document.documentElement.dataset.benchmarkReady = "true";',
        '                    window.__benchmarkReady = true;',
        '                }));',
        '                return result;',
        '            };',
        '        })();',
        '    </script>'
    ].join('\n'))
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

function getInteractionFixtureShape(fixtureId: BenchmarkFixtureId) {
    switch (fixtureId) {
        case 'dynamic':
            return {
                label: 'Dynamic',
                description: 'Primary fixture for class toggles, runtime rule generation, and mutation cleanup.',
                itemCount: 96,
                affectedCount: 64,
                appendCount: 48,
                cleanupCycles: 4
            }
        case 'dashboard':
            return {
                label: 'Dashboard',
                description: 'Repeated realistic components used as an application-control interaction fixture.',
                itemCount: 320,
                affectedCount: 160,
                appendCount: 80,
                cleanupCycles: 3
            }
        case 'stress-dom':
            return {
                label: 'Stress DOM',
                description: 'Large DOM control with fixed CSS to isolate mutation and recalculation sensitivity.',
                itemCount: 1200,
                affectedCount: 600,
                appendCount: 160,
                cleanupCycles: 3
            }
        default:
            throw new Error(`Interaction benchmark fixture is not implemented: ${fixtureId}`)
    }
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

function classAttribute(classes: string[]) {
    return escapeAttribute(unique(classes).join(' '))
}

function getAllInteractionClasses(classes: InteractionClassModel) {
    return unique([
        'text-center',
        ...classes.body,
        ...classes.shell,
        ...classes.header,
        ...classes.title,
        ...classes.subtitle,
        ...classes.grid,
        ...classes.itemBase,
        ...classes.itemLight,
        ...classes.itemActive,
        ...classes.itemDark,
        ...classes.itemNew,
        ...classes.itemTemp,
        ...classes.itemTitle,
        ...classes.itemMeta,
        ...classes.panel,
        ...classes.button
    ])
}

function unique(values: string[]) {
    return [...new Set(values.filter(Boolean))]
}

function escapeHTML(value: string) {
    return value
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
}

function escapeAttribute(value: string) {
    return escapeHTML(value)
        .replaceAll('"', '&quot;')
}

function insertBeforeHeadEnd(html: string, content: string) {
    return html.replace('</head>', `${content}\n</head>`)
}

function insertBeforeBodyEnd(html: string, content: string) {
    return html.replace('</body>', `${content}\n</body>`)
}

function addHiddenAttribute(html: string) {
    return html.replace(/<html([^>]*)>/i, (match, attrs: string) => (
        /\shidden(?:[\s=>]|$)/i.test(attrs)
            ? match
            : `<html${attrs} hidden>`
    ))
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
        runtimeRemoveQueue?: Array<{
            runtime: unknown
            classNames: string[]
        }>
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
