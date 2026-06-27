import { createServer, type Server } from 'node:http'
import { readFile, writeFile } from 'node:fs/promises'
import { extname, isAbsolute, relative, resolve } from 'node:path'
import { performance } from 'node:perf_hooks'
import type { Browser, Page } from '@playwright/test'
import { benchmarkAdapters } from '../fixtures/manifest'
import { summarizeBytes } from './bytes'
import { analyzeCSSStructure, createCSSStructureSamples, cssStructureMetrics } from './css-structure'
import { benchmarkRoot, measureRelativeArtifact, resetDirectory, writeWorkspaceFiles } from './runner'
import type {
    BenchmarkAdapter,
    BenchmarkArtifact,
    BenchmarkFixtureId,
    BenchmarkMetric,
    BenchmarkSample,
    BenchmarkVariant
} from './types'

export type BrowserCacheMode = 'cold-cache' | 'warm-cache'

export interface BrowserCostPage {
    root: string
    artifacts: BenchmarkArtifact[]
}

export interface BrowserCostMeasurement {
    samples: BenchmarkSample[]
    artifacts: BenchmarkArtifact[]
}

interface ChromeTraceEvent {
    name?: string
    ph?: string
    dur?: number
}

interface StressDOMScale {
    id: 'small-dom' | 'medium-dom' | 'large-dom'
    label: string
    itemCount: number
}

interface CSSVolumeLevel {
    id: 'small-css' | 'medium-css' | 'large-css' | 'xlarge-css'
    label: string
    generatedRuleCount: number
}

const cssVolumeItemCount = 48

const fixedViewport = {
    width: 1280,
    height: 720
}

export const browserCostFixtureIds = [
    'stress-css',
    'stress-dom'
] satisfies BenchmarkFixtureId[]

export const browserCostCacheModes = [
    'cold-cache',
    'warm-cache'
] satisfies BrowserCacheMode[]

export const browserCostCSSVolumeLevels = [
    {
        id: 'small-css',
        label: 'Small CSS',
        generatedRuleCount: 250
    },
    {
        id: 'medium-css',
        label: 'Medium CSS',
        generatedRuleCount: 2500
    },
    {
        id: 'large-css',
        label: 'Large CSS',
        generatedRuleCount: 10000
    },
    {
        id: 'xlarge-css',
        label: 'XLarge CSS',
        generatedRuleCount: 30000
    }
] satisfies CSSVolumeLevel[]

export const browserCostStressDOMScales = [
    {
        id: 'small-dom',
        label: 'Small DOM',
        itemCount: 100
    },
    {
        id: 'medium-dom',
        label: 'Medium DOM',
        itemCount: 1000
    },
    {
        id: 'large-dom',
        label: 'Large DOM',
        itemCount: 3000
    }
] satisfies StressDOMScale[]

const browserTimingMetrics = [
    {
        id: 'navigation-ready-ms',
        label: 'Navigation to ready',
        unit: 'ms',
        description: 'Elapsed wall time from navigation start until the page has loaded, completed two animation frames, and passed computed-style assertions.'
    },
    {
        id: 'stylesheet-parse-ms',
        label: 'Stylesheet parse/attach',
        unit: 'ms',
        description: 'Trace-derived stylesheet parsing and attachment duration where Chromium exposes stable timeline events.'
    },
    {
        id: 'style-recalculation-ms',
        label: 'Style recalculation',
        unit: 'ms',
        description: 'Trace-derived style recalculation duration from Chromium timeline events.'
    },
    {
        id: 'layout-ms',
        label: 'Layout',
        unit: 'ms',
        description: 'Trace-derived layout duration from Chromium timeline events.'
    },
    {
        id: 'paint-ms',
        label: 'Paint',
        unit: 'ms',
        description: 'Trace-derived paint and pre-paint duration from Chromium timeline events.'
    },
    {
        id: 'long-task-count',
        label: 'Long tasks',
        unit: 'count',
        description: 'Count of trace task events at or above 50 ms.'
    }
] satisfies BenchmarkMetric[]

const cssByteMetrics = [
    {
        id: 'css-raw-bytes',
        label: 'CSS raw bytes',
        unit: 'B',
        description: 'Raw bytes for the external CSS file loaded by the fixture page.'
    },
    {
        id: 'css-gzip-bytes',
        label: 'CSS gzip bytes',
        unit: 'B',
        description: 'Gzip bytes for the external CSS file loaded by the fixture page.'
    },
    {
        id: 'css-brotli-bytes',
        label: 'CSS brotli bytes',
        unit: 'B',
        description: 'Brotli bytes for the external CSS file loaded by the fixture page.'
    }
] satisfies BenchmarkMetric[]

const browserDOMMetrics = [
    {
        id: 'dom-item-count',
        label: 'DOM fixture items',
        unit: 'count',
        description: 'Repeated fixture item count. CSS volume variants keep this fixed; stress DOM variants intentionally scale it.'
    },
    {
        id: 'dom-node-count',
        label: 'DOM nodes',
        unit: 'count',
        description: 'Total DOM element count after the benchmark page has loaded and passed computed-style assertions.'
    }
] satisfies BenchmarkMetric[]

export const browserCostMetrics = [
    ...browserTimingMetrics,
    ...browserDOMMetrics,
    ...cssByteMetrics,
    ...cssStructureMetrics
] satisfies BenchmarkMetric[]

export function getBrowserCostAdapters(): BenchmarkAdapter[] {
    const ids = new Set(['browser-css', 'browser-dom'])
    return benchmarkAdapters.filter((adapter) => ids.has(adapter.id))
}

export function createBrowserCostVariants(): BenchmarkVariant[] {
    const cssVolumeVariants = browserCostCSSVolumeLevels.flatMap((level) => browserCostCacheModes.map((cacheMode) => ({
        id: createBrowserCostCSSVolumeVariantId(level.id, cacheMode),
        fixtureId: 'stress-css' as const,
        adapterId: 'browser-css' as const,
        label: `stress-css / ${level.label} / ${formatCacheMode(cacheMode)}`
    })))

    const stressDOMVariants = browserCostStressDOMScales.flatMap((scale) => browserCostCacheModes.map((cacheMode) => ({
        id: createBrowserCostStressDOMVariantId(scale.id, cacheMode),
        fixtureId: 'stress-dom' as const,
        adapterId: 'browser-dom' as const,
        label: `stress-dom / ${scale.label} / ${formatCacheMode(cacheMode)}`
    })))

    return [
        ...cssVolumeVariants,
        ...stressDOMVariants
    ]
}

export function createBrowserCostCSSVolumeVariantId(levelId: CSSVolumeLevel['id'], cacheMode: BrowserCacheMode) {
    return `stress-css-${levelId}-${cacheMode}`
}

export function createBrowserCostCSSVolumeSamples(variantId: string, css: string): BenchmarkSample[] {
    return [
        {
            metricId: 'dom-item-count',
            variantId,
            round: 0,
            value: cssVolumeItemCount
        },
        ...createBrowserCostCSSArtifactSamples(variantId, css)
    ]
}

export function createBrowserCostStressDOMSamples(variantId: string, scale: StressDOMScale, css: string): BenchmarkSample[] {
    return [
        {
            metricId: 'dom-item-count',
            variantId,
            round: 0,
            value: scale.itemCount
        },
        ...createBrowserCostCSSArtifactSamples(variantId, css)
    ]
}

function createBrowserCostCSSArtifactSamples(variantId: string, css: string): BenchmarkSample[] {
    const bytes = summarizeBytes(Buffer.from(css))
    return [
        {
            metricId: 'css-raw-bytes',
            variantId,
            round: 0,
            value: bytes.rawBytes
        },
        {
            metricId: 'css-gzip-bytes',
            variantId,
            round: 0,
            value: bytes.gzipBytes
        },
        {
            metricId: 'css-brotli-bytes',
            variantId,
            round: 0,
            value: bytes.brotliBytes
        },
        ...createCSSStructureSamples(variantId, analyzeCSSStructure(css))
    ]
}

export async function createBrowserCostCSSVolumePage(options: {
    level: CSSVolumeLevel
    variantId: string
}) {
    const css = renderCSSVolumeCSS(options.level)

    return {
        ...await writeBrowserCostPage({
            variantId: options.variantId,
            html: renderCSSVolumeHTML(options.level),
            css,
            artifacts: []
        }),
        css
    }
}

export function createBrowserCostStressDOMVariantId(scaleId: StressDOMScale['id'], cacheMode: BrowserCacheMode) {
    return `stress-dom-${scaleId}-${cacheMode}`
}

export async function createBrowserCostStressDOMPage(options: {
    scale: StressDOMScale
    variantId: string
}) {
    const css = renderStressDOMCSS()

    return {
        ...await writeBrowserCostPage({
            variantId: options.variantId,
            html: renderStressDOMHTML(options.scale),
            css,
            artifacts: []
        }),
        css
    }
}

export async function measureBrowserCost(options: {
    browser: Browser
    pageRoot: string
    variantId: string
    cacheMode: BrowserCacheMode
    round: number
}) {
    const server = await startStaticFileServer(options.pageRoot)

    try {
        const context = await options.browser.newContext({
            viewport: fixedViewport,
            deviceScaleFactor: 1
        })
        const page = await context.newPage()

        try {
            if (options.cacheMode === 'warm-cache') {
                await page.goto(server.origin, { waitUntil: 'load' })
                await waitForBenchmarkReady(page)
                await assertCSSApplied(page)
                await page.goto('about:blank')
            }

            const artifactRoot = resolve(benchmarkRoot, '.results', 'browser-css-cost', 'artifacts', options.variantId, `round-${options.round}`)
            await resetDirectory(artifactRoot)

            const traceFile = resolve(artifactRoot, 'trace.json')
            const screenshotFile = resolve(artifactRoot, 'screenshot.png')
            const traceResult = await traceNavigation(page, server.origin)
            await writeFile(traceFile, `${JSON.stringify({ traceEvents: traceResult.events }, null, 2)}\n`)
            await page.screenshot({ path: screenshotFile, fullPage: false })

            const traceMetrics = summarizeTraceEvents(traceResult.events)
            const artifacts = await Promise.all([
                measureRelativeArtifact(traceFile),
                measureRelativeArtifact(screenshotFile)
            ])

            return {
                samples: createBrowserCostSamples(options.variantId, options.round, {
                    navigationReadyMs: traceResult.navigationReadyMs,
                    domNodeCount: traceResult.domNodeCount,
                    ...traceMetrics
                }),
                artifacts
            } satisfies BrowserCostMeasurement
        } finally {
            await context.close()
        }
    } finally {
        await server.close()
    }
}

function createBrowserCostSamples(variantId: string, round: number, metrics: {
    navigationReadyMs: number
    stylesheetParseMs: number
    styleRecalculationMs: number
    layoutMs: number
    paintMs: number
    longTaskCount: number
    domNodeCount: number
}): BenchmarkSample[] {
    return [
        {
            metricId: 'navigation-ready-ms',
            variantId,
            round,
            value: metrics.navigationReadyMs
        },
        {
            metricId: 'stylesheet-parse-ms',
            variantId,
            round,
            value: metrics.stylesheetParseMs
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
        }
    ]
}

async function writeBrowserCostPage(options: {
    variantId: string
    html: string
    css: string
    artifacts: BenchmarkArtifact[]
}): Promise<BrowserCostPage> {
    const root = resolve(benchmarkRoot, '.results', 'browser-css-cost', 'pages', options.variantId)
    await resetDirectory(root)
    await writeWorkspaceFiles(root, {
        'index.html': options.html,
        'style.css': options.css
    })

    const pageArtifacts = await Promise.all([
        measureRelativeArtifact(resolve(root, 'index.html')),
        measureRelativeArtifact(resolve(root, 'style.css'))
    ])

    return {
        root,
        artifacts: [
            ...options.artifacts,
            ...pageArtifacts
        ]
    }
}

function renderCSSVolumeHTML(level: CSSVolumeLevel) {
    const cards = Array.from({ length: cssVolumeItemCount }, (_, index) => `
        <article class="volume-card">
            <strong>Card ${index + 1}</strong>
            <p>Fixed DOM node for CSS rule-volume calibration.</p>
            <span>${level.label}</span>
        </article>
    `).join('\n')

    return [
        '<!doctype html>',
        '<html lang="en">',
        '<head>',
        '    <meta charset="utf-8">',
        '    <meta name="viewport" content="width=device-width, initial-scale=1">',
        `    <title>${level.label} browser CSS cost</title>`,
        '    <link rel="stylesheet" href="/style.css">',
        '</head>',
        '<body class="benchmark-root">',
        '    <main class="volume-shell">',
        `        <h1>${level.label}</h1>`,
        '        <p class="volume-summary">Fixed DOM with deterministic external CSS rule volume.</p>',
        '        <section class="volume-grid">',
        cards,
        '        </section>',
        '    </main>',
        renderReadyHarness(),
        '</body>',
        '</html>'
    ].join('\n')
}

function renderCSSVolumeCSS(level: CSSVolumeLevel) {
    const baseRules = [
        '.benchmark-root{box-sizing:border-box;margin:0;font-family:system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;background:#f8fafc;color:#0f172a}',
        '*,::before,::after{box-sizing:inherit}',
        '.volume-shell{max-width:1180px;margin:0 auto;padding:32px}',
        '.volume-shell h1{margin:0 0 8px;font-size:32px;line-height:1.1}',
        '.volume-summary{margin:0 0 24px;color:#475569;font-size:14px;line-height:1.6}',
        '.volume-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px}',
        '.volume-card{display:grid;gap:8px;min-width:0;padding:16px;border:1px solid #cbd5e1;border-radius:12px;background:#fff}',
        '.volume-card strong{font-size:14px}',
        '.volume-card p{margin:0;color:#475569;font-size:13px;line-height:1.5}',
        '.volume-card span{display:inline-flex;width:max-content;border-radius:999px;background:#e0f2fe;color:#0369a1;padding:2px 8px;font-size:12px;font-weight:700}',
        '@media (max-width: 820px){.volume-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}',
        '@media (max-width: 520px){.volume-shell{padding:20px}.volume-grid{grid-template-columns:1fr}}'
    ]
    const generatedRules = Array.from({ length: level.generatedRuleCount }, (_, index) => {
        const hue = (index * 37) % 360
        const pairedHue = (hue + 180) % 360
        const className = `browser-css-volume-${String(index).padStart(5, '0')}`
        return `.${className}{color:hsl(${hue} 70% 34%);background-color:hsl(${pairedHue} 70% 96%);border-color:hsl(${hue} 60% 70%)}`
    })

    return [
        ...baseRules,
        ...generatedRules,
        ''
    ].join('\n')
}

function renderStressDOMHTML(scale: StressDOMScale) {
    const items = Array.from({ length: scale.itemCount }, (_, index) => `
        <article class="card">
            <div class="card-header">
                <strong>Account ${index + 1}</strong>
                <span class="badge">${index % 3 === 0 ? 'Active' : 'Review'}</span>
            </div>
            <p>DOM stress row with fixed CSS and repeated descendants.</p>
            <div class="meter"><span style="width:${20 + index % 80}%"></span></div>
        </article>
    `).join('\n')

    return [
        '<!doctype html>',
        '<html lang="en">',
        '<head>',
        '    <meta charset="utf-8">',
        '    <meta name="viewport" content="width=device-width, initial-scale=1">',
        `    <title>Stress DOM ${scale.label}</title>`,
        '    <link rel="stylesheet" href="/style.css">',
        '</head>',
        '<body class="benchmark-root">',
        '    <main class="shell">',
        `        <h1>${scale.label}</h1>`,
        '        <section class="grid">',
        items,
        '        </section>',
        '    </main>',
        renderReadyHarness(),
        '</body>',
        '</html>'
    ].join('\n')
}

function renderStressDOMCSS() {
    return [
        '.benchmark-root{box-sizing:border-box;margin:0;font-family:system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;background:#f8fafc;color:#0f172a}',
        '*,::before,::after{box-sizing:inherit}',
        '.shell{max-width:1180px;margin:0 auto;padding:32px}',
        '.shell h1{margin:0 0 24px;font-size:32px;line-height:1.1}',
        '.grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px}',
        '.card{display:grid;gap:10px;min-width:0;padding:16px;border:1px solid #cbd5e1;border-radius:12px;background:#fff;box-shadow:0 1px 2px rgba(15,23,42,.06)}',
        '.card-header{display:flex;align-items:center;justify-content:space-between;gap:8px}',
        '.card strong{font-size:14px}',
        '.card p{margin:0;color:#475569;font-size:13px;line-height:1.5}',
        '.badge{display:inline-flex;border-radius:999px;background:#dbeafe;color:#1d4ed8;padding:2px 8px;font-size:12px;font-weight:700}',
        '.meter{height:8px;overflow:hidden;border-radius:999px;background:#e2e8f0}',
        '.meter span{display:block;height:100%;border-radius:inherit;background:#2563eb}',
        '@media (max-width: 820px){.grid{grid-template-columns:repeat(2,minmax(0,1fr))}}',
        '@media (max-width: 520px){.shell{padding:20px}.grid{grid-template-columns:1fr}}',
        ''
    ].join('\n')
}

function renderReadyHarness() {
    return [
        '    <div id="benchmark-loaded" hidden>loaded</div>',
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
}

async function traceNavigation(page: Page, url: string) {
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
    await assertCSSApplied(page)
    const domNodeCount = await page.evaluate(() => document.getElementsByTagName('*').length)
    const navigationReadyMs = performance.now() - startedAt

    await client.send('Tracing.end')
    await tracingComplete
    await client.detach()

    return {
        events,
        domNodeCount,
        navigationReadyMs
    }
}

async function waitForBenchmarkReady(page: Page) {
    await page.waitForFunction(() => (window as Window & { __benchmarkReady?: boolean }).__benchmarkReady === true, undefined, { timeout: 15000 })
}

async function assertCSSApplied(page: Page) {
    const result = await page.evaluate(() => ({
        bodyBoxSizing: getComputedStyle(document.body).boxSizing,
        ready: document.documentElement.dataset.benchmarkReady
    }))

    if (result.bodyBoxSizing !== 'border-box') {
        throw new Error(`Expected external CSS to apply body box-sizing:border-box, received ${result.bodyBoxSizing}.`)
    }

    if (result.ready !== 'true') {
        throw new Error('Benchmark page did not set the ready marker.')
    }
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
        throw new Error('Unable to allocate local browser benchmark server port.')
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
    if (extname(file) === '.html') return 'text/html; charset=utf-8'
    if (extname(file) === '.css') return 'text/css; charset=utf-8'
    if (extname(file) === '.png') return 'image/png'
    if (extname(file) === '.json') return 'application/json; charset=utf-8'
    return 'application/octet-stream'
}

function formatCacheMode(cacheMode: BrowserCacheMode) {
    return cacheMode === 'cold-cache' ? 'Cold cache' : 'Warm cache'
}
