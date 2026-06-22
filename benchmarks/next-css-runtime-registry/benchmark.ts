import { chromium, type Browser, type BrowserContext, type Page } from '@playwright/test'
import { brotliCompressSync, gzipSync } from 'node:zlib'
import { execFile, spawn, type ChildProcessWithoutNullStreams } from 'node:child_process'
import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { createServer } from 'node:http'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import process from 'node:process'

const benchmarkRoot = dirname(fileURLToPath(import.meta.url))
const repoRoot = resolve(benchmarkRoot, '../..')
const playgroundRoot = resolve(repoRoot, 'packages/next/playground')
const workRoot = resolve(benchmarkRoot, '.work')
const args = parseArgs(process.argv.slice(2))
const rounds = numberArg('rounds', 'MASTER_CSS_NEXT_REGISTRY_BENCH_ROUNDS', 15)
const warmupRounds = numberArg('warmup', 'MASTER_CSS_NEXT_REGISTRY_BENCH_WARMUP_ROUNDS', 3)
const outputJSON = resolve(args.get('json') || process.env.MASTER_CSS_NEXT_REGISTRY_BENCH_JSON || join(benchmarkRoot, 'results.json'))
const outputMarkdown = resolve(args.get('markdown') || process.env.MASTER_CSS_NEXT_REGISTRY_BENCH_MD || join(benchmarkRoot, 'results.md'))
const routeConfigs = [
    { path: '/', label: 'home' },
    { path: '/stress', label: 'stress' },
    { path: '/late', label: 'late' }
] as const
const variants = [
    { name: 'direct', label: 'Direct import' },
    { name: 'dynamic-ssr-false', label: 'Dynamic ssr false' }
] as const
const profiles = [
    {
        name: 'desktop-cold',
        label: 'Desktop cold load',
        viewport: { width: 1365, height: 900 },
        cpuThrottlingRate: 1,
        network: undefined
    },
    {
        name: 'throttled-mobile',
        label: 'Throttled mobile',
        viewport: { width: 390, height: 844 },
        cpuThrottlingRate: 4,
        network: {
            latency: 150,
            downloadThroughput: Math.floor(1.6 * 1024 * 1024 / 8),
            uploadThroughput: Math.floor(750 * 1024 / 8)
        }
    }
] as const
const metricKeys = [
    'ttfb',
    'fcp',
    'lcp',
    'domContentLoaded',
    'load',
    'runtimeCreated',
    'runtimeHydrated',
    'runtimeObserved',
    'cls',
    'longTaskTotal',
    'longTaskMax',
    'transferSize',
    'encodedBodySize',
    'decodedBodySize',
    'jsTransferSize',
    'cssTransferSize',
    'resourceCount'
] as const

type VariantName = typeof variants[number]['name']
type RoutePath = typeof routeConfigs[number]['path']
type ProfileName = typeof profiles[number]['name']
type MetricKey = typeof metricKeys[number]
type Summary = { min: number, max: number, mean: number, median: number }
type MetricSummary = Partial<Record<MetricKey, Summary>>
type SmokeResult = {
    ok: boolean
    routeChecks: Record<string, RouteSmokeResult>
    lateClassObserved: boolean
    errors: string[]
}
type RouteSmokeResult = {
    htmlHasContent: boolean
    hasMasterStyle: boolean
    hasHydrationManifest: boolean
    hydrationManifestRuleCount: number
    runtimeCreated: boolean
    runtimeObserved: boolean
    progressive: boolean
    hydrationFailureReason?: string
    classCount: number
    utilityCount: number
}
type BuildMetrics = {
    ms: number
    output: Record<string, OutputMetrics>
}
type OutputMetrics = {
    htmlBytes: number
    masterStyleBytes: number
    hydrationManifestBytes: number
    hydrationManifestRuleCount: number
    initialJSChunkCount: number
    initialJSRawBytes: number
    initialJSGzipBytes: number
    initialJSBrotliBytes: number
}
type SampleMetrics = Record<MetricKey, number> & {
    route: RoutePath
    profile: ProfileName
    progressive: boolean
    observing: boolean
    classCount: number
    utilityCount: number
    hydrationFailureReason?: string
}
type RouteProfileResult = {
    route: RoutePath
    profile: ProfileName
    samples: SampleMetrics[]
    summary: MetricSummary
}
type VariantResult = {
    name: VariantName
    label: string
    appDir: string
    build: BuildMetrics
    smoke: SmokeResult
    routes: RouteProfileResult[]
}
type BenchmarkReport = {
    schemaVersion: 1
    generatedAt: string
    package: '@master/css.next'
    tool: 'playwright'
    config: {
        rounds: number
        warmupRounds: number
        routes: readonly RoutePath[]
        profiles: readonly ProfileName[]
    }
    browser: {
        name: 'chromium'
        version: string
    }
    variants: VariantResult[]
    comparisons: Comparison[]
    recommendation: Recommendation
}
type Comparison = {
    route: RoutePath
    profile: ProfileName
    metrics: Partial<Record<MetricKey, {
        direct: number
        dynamic: number
        delta: number
        deltaPercent: number
    }>>
}
type Recommendation = {
    winner: VariantName | 'inconclusive'
    reason: string
}

main().catch((error: unknown) => {
    console.error(error instanceof Error ? error.stack || error.message : error)
    process.exit(1)
})

async function main() {
    await rm(workRoot, { recursive: true, force: true })
    await mkdir(workRoot, { recursive: true })

    const browser = await chromium.launch()
    const variantResults: VariantResult[] = []

    try {
        for (const variant of variants) {
            console.log(`\nPreparing ${variant.label}`)
            const appDir = await prepareApp(variant.name)
            const build = await buildApp(appDir)
            const server = await startNextServer(appDir)

            try {
                build.output = await collectOutputMetrics(server.url, appDir)
                const smoke = await runSmokeTests(browser, server.url)

                if (!smoke.ok) {
                    variantResults.push({
                        name: variant.name,
                        label: variant.label,
                        appDir,
                        build,
                        smoke,
                        routes: []
                    })
                    throw new Error(`${variant.label} smoke test failed:\n${smoke.errors.join('\n')}`)
                }

                const routes: RouteProfileResult[] = []
                for (const route of routeConfigs) {
                    for (const profile of profiles) {
                        const routeProfile = await runRouteProfile(browser, server.url, route.path, profile.name)
                        routes.push(routeProfile)
                        printRouteProfile(variant.name, routeProfile)
                    }
                }

                variantResults.push({
                    name: variant.name,
                    label: variant.label,
                    appDir,
                    build,
                    smoke,
                    routes
                })
            } finally {
                await server.close()
            }
        }

        const report: BenchmarkReport = {
            schemaVersion: 1,
            generatedAt: new Date().toISOString(),
            package: '@master/css.next',
            tool: 'playwright',
            config: {
                rounds,
                warmupRounds,
                routes: routeConfigs.map((route) => route.path),
                profiles: profiles.map((profile) => profile.name)
            },
            browser: {
                name: 'chromium',
                version: browser.version()
            },
            variants: variantResults,
            comparisons: compareVariants(variantResults),
            recommendation: recommend(variantResults)
        }

        await writeJSON(outputJSON, report)
        await writeFile(outputMarkdown, renderMarkdown(report))
        console.log(`\nWrote ${toRepoPath(outputJSON)}`)
        console.log(`Wrote ${toRepoPath(outputMarkdown)}`)
        console.log(`Recommendation: ${report.recommendation.winner} - ${report.recommendation.reason}`)
    } finally {
        await browser.close()
    }
}

async function prepareApp(variant: VariantName) {
    const appDir = join(workRoot, variant)
    await mkdir(join(appDir, 'app'), { recursive: true })
    await cp(join(playgroundRoot, 'tsconfig.json'), join(appDir, 'tsconfig.json'))
    await cp(join(playgroundRoot, 'next-env.d.ts'), join(appDir, 'next-env.d.ts'))
    await cp(join(playgroundRoot, 'master-css-manifest.d.ts'), join(appDir, 'master-css-manifest.d.ts'))
    await writeFile(join(appDir, 'package.json'), createPackageJSON())
    await writeFile(join(appDir, 'next.config.mjs'), createNextConfig())
    await writeFile(join(appDir, 'app/globals.css'), createGlobalsCSS())
    await writeFile(join(appDir, 'app/layout.tsx'), createLayout(variant))
    if (variant === 'dynamic-ssr-false') {
        await writeFile(join(appDir, 'app/CSSRuntimeRegistryMount.tsx'), createDynamicRegistryMount())
    }
    await writeFile(join(appDir, 'app/page.tsx'), createHomePage())
    await mkdir(join(appDir, 'app/stress'), { recursive: true })
    await writeFile(join(appDir, 'app/stress/page.tsx'), createStressPage())
    await mkdir(join(appDir, 'app/late'), { recursive: true })
    await writeFile(join(appDir, 'app/late/page.tsx'), createLatePage())
    await writeFile(join(appDir, 'app/late/LateClient.tsx'), createLateClient())
    return appDir
}

function createPackageJSON() {
    return `${JSON.stringify({
        private: true,
        type: 'module',
        scripts: {
            build: 'next build',
            start: 'next start'
        },
        dependencies: {
            '@master/css': 'workspace:^',
            '@master/css.react': 'workspace:^',
            next: '^16.2.9',
            react: '^19.2.7',
            'react-dom': '^19.2.7'
        },
        devDependencies: {
            '@master/css.next': 'workspace:^',
            '@types/node': '^25.9.4',
            '@types/react': '^19.2.17',
            '@types/react-dom': '^19.2.3',
            typescript: '^6.0.3'
        }
    }, null, 4)}\n`
}

function createNextConfig() {
    return [
        `import { withMasterCSS } from '@master/css.next'`,
        ``,
        `/** @type {import('next').NextConfig} */`,
        `const nextConfig = withMasterCSS({`,
        `    reactStrictMode: true`,
        `}, {`,
        `    buildReport: true,`,
        `    debug: false`,
        `})`,
        ``,
        `export default nextConfig`,
        ``
    ].join('\n')
}

function createGlobalsCSS() {
    return [
        `@import '@master/css';`,
        ``,
        `html,`,
        `body {`,
        `    margin: 0;`,
        `    min-height: 100%;`,
        `    background: #f8fafc;`,
        `}`,
        ``,
        `@theme {`,
        `    --color-primary: #0070f3;`,
        `    --color-surface: #ffffff;`,
        `    --color-strong: #0f172a;`,
        `    --color-muted: #64748b;`,
        `}`,
        ``
    ].join('\n')
}

function createLayout(variant: VariantName) {
    if (variant === 'direct') {
        return [
            `import './globals.css'`,
            `import type { ReactNode } from 'react'`,
            `import { CSSRuntimeRegistry } from '@master/css.react'`,
            ``,
            `export const metadata = {`,
            `    title: 'Master CSS registry benchmark',`,
            `    description: 'CSSRuntimeRegistry benchmark fixture'`,
            `}`,
            ``,
            `export default function RootLayout({ children }: { children: ReactNode }) {`,
            `    return (`,
            `        <html lang="en">`,
            `            <body>`,
            `                <CSSRuntimeRegistry>`,
            `                    {children}`,
            `                </CSSRuntimeRegistry>`,
            `            </body>`,
            `        </html>`,
            `    )`,
            `}`,
            ``
        ].join('\n')
    }

    return [
        `import './globals.css'`,
        `import type { ReactNode } from 'react'`,
        `import { CSSRuntimeRegistryMount } from './CSSRuntimeRegistryMount'`,
        ``,
        `export const metadata = {`,
        `    title: 'Master CSS registry benchmark',`,
        `    description: 'CSSRuntimeRegistry benchmark fixture'`,
        `}`,
        ``,
        `export default function RootLayout({ children }: { children: ReactNode }) {`,
        `    return (`,
        `        <html lang="en">`,
        `            <body>`,
        `                <CSSRuntimeRegistryMount />`,
        `                {children}`,
        `            </body>`,
        `        </html>`,
        `    )`,
        `}`,
        ``
    ].join('\n')
}

function createDynamicRegistryMount() {
    return [
        `'use client'`,
        ``,
        `import dynamic from 'next/dynamic'`,
        ``,
        `const DynamicCSSRuntimeRegistry = dynamic(`,
        `    () => import('@master/css.react').then((module) => module.CSSRuntimeRegistry),`,
        `    { ssr: false }`,
        `)`,
        ``,
        `export function CSSRuntimeRegistryMount() {`,
        `    return <DynamicCSSRuntimeRegistry />`,
        `}`,
        ``
    ].join('\n')
}

function createHomePage() {
    return [
        `export default function Home() {`,
        `    return (`,
        `        <main data-benchmark-page="home" className="min-h:100vh p:10x bg:surface fg:strong font:sans">`,
        `            <section className="max-w:760px mx:auto">`,
        `                <p className="text:14px fg:primary mb:2x">Next.js Adapter API</p>`,
        `                <h1 className="font:48px font:heavy tracking:tight">Master CSS registry benchmark</h1>`,
        `                <p className="font:20px line-height:1.5 mt:4x fg:muted">`,
        `                    Progressive CSS is pre-rendered by the Next adapter, then hydrated by the browser runtime.`,
        `                </p>`,
        `                <a className="inline-flex align-items:center h:44px px:5x mt:6x bg:primary fg:white r:6px text:14px font:semibold" href="/stress">`,
        `                    Open stress route`,
        `                </a>`,
        `            </section>`,
        `        </main>`,
        `    )`,
        `}`,
        ``
    ].join('\n')
}

function createStressPage() {
    return [
        `const items = Array.from({ length: 1000 }, (_, index) => index)`,
        ``,
        `function classNameFor(index: number) {`,
        `    return [`,
        `        'block',`,
        `        'bg:surface',`,
        `        'fg:strong',`,
        `        'border:1px|solid|#e2e8f0',`,
        `        'r:4px',`,
        `        'my:1px',`,
        `        'height:1px',`,
        `        \`width:\${index + 1}px\``,
        `    ].join(' ')`,
        `}`,
        ``,
        `export default function StressPage() {`,
        `    return (`,
        `        <main data-benchmark-page="stress" className="min-h:100vh p:8x bg:surface fg:strong">`,
        `            <h1 className="font:32px font:bold mb:4x">Stress route</h1>`,
        `            <section data-benchmark-root="stress-list" className="max-w:1040px">`,
        `                {items.map((index) => (`,
        `                    <div key={index} data-benchmark-item={index} className={classNameFor(index)} />`,
        `                ))}`,
        `            </section>`,
        `        </main>`,
        `    )`,
        `}`,
        ``
    ].join('\n')
}

function createLatePage() {
    return [
        `import { LateClient } from './LateClient'`,
        ``,
        `export default function LatePage() {`,
        `    return (`,
        `        <main data-benchmark-page="late" className="min-h:100vh p:10x bg:surface fg:strong">`,
        `            <h1 className="font:32px font:bold mb:4x">Late class route</h1>`,
        `            <LateClient />`,
        `        </main>`,
        `    )`,
        `}`,
        ``
    ].join('\n')
}

function createLateClient() {
    return [
        `'use client'`,
        ``,
        `import { useEffect, useState } from 'react'`,
        ``,
        `export function LateClient() {`,
        `    const [ready, setReady] = useState(false)`,
        ``,
        `    useEffect(() => {`,
        `        const frame = requestAnimationFrame(() => setReady(true))`,
        `        return () => cancelAnimationFrame(frame)`,
        `    }, [])`,
        ``,
        `    return (`,
        `        <div`,
        `            data-benchmark-late={ready ? 'ready' : 'pending'}`,
        `            className={ready ? 'late-target bg:primary fg:white p:8x r:6px' : 'late-target p:8x r:6px'}`,
        `        >`,
        `            Client-only class target`,
        `        </div>`,
        `    )`,
        `}`,
        ``
    ].join('\n')
}

async function buildApp(appDir: string): Promise<BuildMetrics> {
    const startedAt = performance.now()
    const result = await execFileBuffered('pnpm', ['--dir', appDir, 'exec', 'next', 'build'], {
        cwd: repoRoot,
        env: {
            ...process.env,
            NEXT_TELEMETRY_DISABLED: '1'
        },
        timeout: 180_000
    })
    const elapsed = performance.now() - startedAt
    if (result.stdout.trim()) console.log(result.stdout.trim())
    if (result.stderr.trim()) console.error(result.stderr.trim())
    return {
        ms: elapsed,
        output: {}
    }
}

async function collectOutputMetrics(baseURL: string, appDir: string): Promise<Record<string, OutputMetrics>> {
    const output: Record<string, OutputMetrics> = {}
    for (const route of routeConfigs) {
        const html = await fetchText(new URL(route.path, baseURL).href)
        const hydrationManifest = await readHydrationManifestFromHTML(html, baseURL)
        const scriptSources = extractScriptSources(html)
        const scriptSizes = await measureNextStaticFiles(appDir, scriptSources)
        output[route.path] = {
            htmlBytes: Buffer.byteLength(html),
            masterStyleBytes: Buffer.byteLength(readMasterStyle(html)),
            hydrationManifestBytes: Buffer.byteLength(hydrationManifest.source),
            hydrationManifestRuleCount: hydrationManifest.ruleCount,
            initialJSChunkCount: scriptSizes.count,
            initialJSRawBytes: scriptSizes.raw,
            initialJSGzipBytes: scriptSizes.gzip,
            initialJSBrotliBytes: scriptSizes.brotli
        }
    }
    return output
}

async function runSmokeTests(browser: Browser, baseURL: string): Promise<SmokeResult> {
    const errors: string[] = []
    const routeChecks: Record<string, RouteSmokeResult> = {}

    for (const route of routeConfigs) {
        const html = await fetchText(new URL(route.path, baseURL).href)
        let hydrationManifestRuleCount = 0
        try {
            hydrationManifestRuleCount = (await readHydrationManifestFromHTML(html, baseURL)).ruleCount
        } catch (error) {
            errors.push(`${route.path}: ${formatError(error)}`)
        }

        const { context, page } = await createPage(browser, 'desktop-cold')
        await installBenchmarkHook(page)
        try {
            await page.goto(new URL(route.path, baseURL).href, { waitUntil: 'load' })
            await waitForRuntime(page)
            const runtime = await readRuntimeState(page)
            const htmlHasContent = html.includes(`data-benchmark-page="${route.label}"`)
            const hasMasterStyle = html.includes('id="master-css"') || html.includes("id='master-css'")
            const hasHydrationManifest = hydrationManifestRuleCount > 0
            routeChecks[route.path] = {
                htmlHasContent,
                hasMasterStyle,
                hasHydrationManifest,
                hydrationManifestRuleCount,
                runtimeCreated: runtime.created,
                runtimeObserved: runtime.observing,
                progressive: runtime.progressive,
                hydrationFailureReason: runtime.hydrationFailureReason,
                classCount: runtime.classCount,
                utilityCount: runtime.utilityCount
            }

            if (!htmlHasContent) errors.push(`${route.path}: server HTML did not include benchmark route content.`)
            if (!hasMasterStyle) errors.push(`${route.path}: server HTML did not include style#master-css.`)
            if (!hasHydrationManifest) errors.push(`${route.path}: hydration manifest was missing or empty.`)
            if (!runtime.created) errors.push(`${route.path}: masterCSSRuntime was not created.`)
            if (!runtime.observing) errors.push(`${route.path}: masterCSSRuntime did not observe the document.`)
            if (!runtime.progressive) errors.push(`${route.path}: runtime did not adopt progressive hydration.`)
            if (runtime.hydrationFailureReason) errors.push(`${route.path}: hydration fallback reason: ${runtime.hydrationFailureReason}`)
        } finally {
            await context.close()
        }
    }

    const lateClassObserved = await verifyLateClass(browser, baseURL)
    if (!lateClassObserved) errors.push('/late: runtime did not observe the client-only bg:primary class.')

    return {
        ok: errors.length === 0,
        routeChecks,
        lateClassObserved,
        errors
    }
}

async function verifyLateClass(browser: Browser, baseURL: string) {
    const { context, page } = await createPage(browser, 'desktop-cold')
    await installBenchmarkHook(page)
    try {
        await page.goto(new URL('/late', baseURL).href, { waitUntil: 'load' })
        await waitForRuntime(page)
        await page.waitForFunction(() => document.querySelector('[data-benchmark-late="ready"]'))
        await page.waitForFunction(() => Boolean(globalThis.masterCSSRuntime?.classCounts?.has('bg:primary')))
        return await page.evaluate(() => {
            const target = document.querySelector<HTMLElement>('[data-benchmark-late="ready"]')
            return Boolean(
                target
                && target.classList.contains('bg:primary')
                && globalThis.masterCSSRuntime?.classCounts?.has('bg:primary')
            )
        })
    } finally {
        await context.close()
    }
}

async function runRouteProfile(
    browser: Browser,
    baseURL: string,
    route: RoutePath,
    profile: ProfileName
): Promise<RouteProfileResult> {
    const samples: SampleMetrics[] = []
    const totalRounds = warmupRounds + rounds

    for (let index = 0; index < totalRounds; index++) {
        const { context, page } = await createPage(browser, profile)
        await installBenchmarkHook(page)
        try {
            await page.goto(new URL(route, baseURL).href, { waitUntil: 'load' })
            await waitForRuntime(page)
            if (route === '/late') {
                await page.waitForFunction(() => document.querySelector('[data-benchmark-late="ready"]'))
            }
            await page.waitForTimeout(250)
            const metrics = await collectPageMetrics(page, route, profile)
            if (metrics.hydrationFailureReason) {
                throw new Error(`${route} ${profile}: hydration fallback reason: ${metrics.hydrationFailureReason}`)
            }
            if (!metrics.progressive || !metrics.observing) {
                throw new Error(`${route} ${profile}: runtime did not stay in progressive observing mode.`)
            }
            if (index >= warmupRounds) samples.push(metrics)
        } finally {
            await context.close()
        }
    }

    return {
        route,
        profile,
        samples,
        summary: summarizeSamples(samples)
    }
}

async function createPage(browser: Browser, profileName: ProfileName): Promise<{ context: BrowserContext, page: Page }> {
    const profile = profiles.find((candidate) => candidate.name === profileName)
    if (!profile) throw new Error(`Unknown profile ${profileName}`)
    const context = await browser.newContext({
        viewport: profile.viewport,
        deviceScaleFactor: profileName === 'throttled-mobile' ? 3 : 1,
        isMobile: profileName === 'throttled-mobile',
        userAgent: profileName === 'throttled-mobile'
            ? 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'
            : undefined
    })
    const page = await context.newPage()
    const client = await context.newCDPSession(page)
    await client.send('Network.enable')
    await client.send('Network.setCacheDisabled', { cacheDisabled: true })
    if (profile.cpuThrottlingRate > 1) {
        await client.send('Emulation.setCPUThrottlingRate', { rate: profile.cpuThrottlingRate })
    }
    if (profile.network) {
        await client.send('Network.emulateNetworkConditions', {
            offline: false,
            latency: profile.network.latency,
            downloadThroughput: profile.network.downloadThroughput,
            uploadThroughput: profile.network.uploadThroughput,
            connectionType: 'cellular4g'
        })
    }
    return { context, page }
}

async function installBenchmarkHook(page: Page) {
    await page.addInitScript({
        content: `
(() => {
    const benchmark = {
        runtimeEvents: [],
        cls: 0,
        lcp: 0,
        longTasks: []
    }

    function readRuntime(cssRuntime) {
        return {
            progressive: Boolean(cssRuntime && cssRuntime.progressive),
            classCount: Number(cssRuntime && cssRuntime.classCounts && cssRuntime.classCounts.size || 0),
            utilityCount: Number(cssRuntime && cssRuntime.classUtilities && cssRuntime.classUtilities.size || 0),
            hydrationFailureReason: cssRuntime && cssRuntime.hydrationFailureReason
        }
    }

    function hasRuntimeEvent(event) {
        for (const entry of benchmark.runtimeEvents) {
            if (entry.event === event) return true
        }
        return false
    }

    function recordRuntimeEvent(event, cssRuntime) {
        if (hasRuntimeEvent(event)) return
        benchmark.runtimeEvents.push({
            event,
            time: performance.now(),
            ...readRuntime(cssRuntime)
        })
    }

    const hook = {
        listeners: new Map(),
        on(event, callback) {
            if (!this.listeners.has(event)) this.listeners.set(event, new Set())
            this.listeners.get(event).add(callback)
        },
        off(event, callback) {
            const listeners = this.listeners.get(event)
            if (listeners) listeners.delete(callback)
        },
        emit(event, ...payload) {
            const context = payload[0] || {}
            recordRuntimeEvent(event, context.cssRuntime)
            const listeners = this.listeners.get(event)
            if (listeners) {
                for (const listener of listeners) listener(...payload)
            }
        }
    }

    globalThis.__MASTER_CSS_BENCHMARK__ = benchmark
    globalThis.__MASTER_CSS_DEVTOOLS_HOOK__ = hook

    function pollRuntime() {
        const runtime = globalThis.masterCSSRuntime
        if (runtime) {
            recordRuntimeEvent('runtime:created', runtime)
            if (runtime.progressive && runtime.classUtilities && runtime.classUtilities.size) {
                recordRuntimeEvent('runtime:hydrated', runtime)
            }
            if (runtime.observing) {
                recordRuntimeEvent('runtime:observed', runtime)
                return
            }
        }
        requestAnimationFrame(pollRuntime)
    }

    requestAnimationFrame(pollRuntime)

    try {
        const lcpObserver = new PerformanceObserver((list) => {
            const entries = list.getEntries()
            const latest = entries[entries.length - 1]
            benchmark.lcp = latest && latest.startTime || benchmark.lcp
        })
        lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true })
    } catch {}

    try {
        const clsObserver = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
                if (!entry.hadRecentInput) benchmark.cls += entry.value || 0
            }
        })
        clsObserver.observe({ type: 'layout-shift', buffered: true })
    } catch {}

    try {
        const longTaskObserver = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
                benchmark.longTasks.push(entry.duration)
            }
        })
        longTaskObserver.observe({ type: 'longtask', buffered: true })
    } catch {}
})()
`
    })
}

async function waitForRuntime(page: Page) {
    await page.waitForFunction(() => Boolean(globalThis.masterCSSRuntime?.observing), undefined, { timeout: 15_000 })
}

async function readRuntimeState(page: Page) {
    return page.evaluate(() => ({
        created: Boolean(globalThis.masterCSSRuntime),
        observing: Boolean(globalThis.masterCSSRuntime?.observing),
        progressive: Boolean(globalThis.masterCSSRuntime?.progressive),
        hydrationFailureReason: globalThis.masterCSSRuntime?.hydrationFailureReason,
        classCount: Number(globalThis.masterCSSRuntime?.classCounts?.size || 0),
        utilityCount: Number(globalThis.masterCSSRuntime?.classUtilities?.size || 0)
    }))
}

async function collectPageMetrics(page: Page, route: RoutePath, profile: ProfileName): Promise<SampleMetrics> {
    const source = `(() => {
        const currentRoute = ${JSON.stringify(route)}
        const currentProfile = ${JSON.stringify(profile)}
        const keys = ${JSON.stringify(metricKeys)}
        const nav = performance.getEntriesByType('navigation')[0]
        const paints = performance.getEntriesByType('paint')
        let fcp = 0
        for (const entry of paints) {
            if (entry.name === 'first-contentful-paint') {
                fcp = entry.startTime || 0
                break
            }
        }
        const resources = performance.getEntriesByType('resource')
        const benchmark = globalThis.__MASTER_CSS_BENCHMARK__
        function eventTime(event) {
            const events = benchmark && benchmark.runtimeEvents || []
            for (const entry of events) {
                if (entry.event === event) return entry.time || 0
            }
            return 0
        }
        const runtime = globalThis.masterCSSRuntime
        const longTasks = benchmark && benchmark.longTasks || []
        let longTaskTotal = 0
        let longTaskMax = 0
        for (const duration of longTasks) {
            longTaskTotal += duration || 0
            if (duration > longTaskMax) longTaskMax = duration
        }
        let transferSize = nav && nav.transferSize || 0
        let encodedBodySize = nav && nav.encodedBodySize || 0
        let decodedBodySize = nav && nav.decodedBodySize || 0
        let jsTransferSize = 0
        let cssTransferSize = 0
        for (const entry of resources) {
            transferSize += entry.transferSize || 0
            encodedBodySize += entry.encodedBodySize || 0
            decodedBodySize += entry.decodedBodySize || 0
            if (entry.initiatorType === 'script' || entry.name.endsWith('.js')) {
                jsTransferSize += entry.transferSize || 0
            }
            if (entry.initiatorType === 'css' || entry.name.endsWith('.css')) {
                cssTransferSize += entry.transferSize || 0
            }
        }
        const values = {
            route: currentRoute,
            profile: currentProfile,
            ttfb: nav ? nav.responseStart - nav.requestStart : 0,
            fcp,
            lcp: benchmark && benchmark.lcp || fcp,
            domContentLoaded: nav && nav.domContentLoadedEventEnd || 0,
            load: nav && nav.loadEventEnd || 0,
            runtimeCreated: eventTime('runtime:created'),
            runtimeHydrated: eventTime('runtime:hydrated'),
            runtimeObserved: eventTime('runtime:observed'),
            cls: benchmark && benchmark.cls || 0,
            longTaskTotal,
            longTaskMax,
            transferSize,
            encodedBodySize,
            decodedBodySize,
            jsTransferSize,
            cssTransferSize,
            resourceCount: resources.length,
            progressive: Boolean(runtime && runtime.progressive),
            observing: Boolean(runtime && runtime.observing),
            classCount: Number(runtime && runtime.classCounts && runtime.classCounts.size || 0),
            utilityCount: Number(runtime && runtime.classUtilities && runtime.classUtilities.size || 0),
            hydrationFailureReason: runtime && runtime.hydrationFailureReason
        }
        for (const key of keys) {
            values[key] = Number(values[key] || 0)
        }
        return values
    })()`
    return await page.evaluate(source) as SampleMetrics
}

function summarizeSamples(samples: SampleMetrics[]): MetricSummary {
    const summary: MetricSummary = {}
    for (const key of metricKeys) {
        summary[key] = summarize(samples.map((sample) => sample[key]))
    }
    return summary
}

function summarize(values: number[]): Summary {
    const finite = values.filter(Number.isFinite).sort((left, right) => left - right)
    if (!finite.length) return { min: 0, max: 0, mean: 0, median: 0 }
    const sum = finite.reduce((total, value) => total + value, 0)
    const middle = Math.floor(finite.length / 2)
    return {
        min: finite[0],
        max: finite[finite.length - 1],
        mean: sum / finite.length,
        median: finite.length % 2 ? finite[middle] : (finite[middle - 1] + finite[middle]) / 2
    }
}

function compareVariants(results: VariantResult[]): Comparison[] {
    const direct = results.find((result) => result.name === 'direct')
    const dynamic = results.find((result) => result.name === 'dynamic-ssr-false')
    if (!direct || !dynamic) return []

    const comparisons: Comparison[] = []
    for (const route of routeConfigs) {
        for (const profile of profiles) {
            const directRoute = direct.routes.find((result) => result.route === route.path && result.profile === profile.name)
            const dynamicRoute = dynamic.routes.find((result) => result.route === route.path && result.profile === profile.name)
            if (!directRoute || !dynamicRoute) continue
            const metrics: Comparison['metrics'] = {}
            for (const key of metricKeys) {
                const directMedian = directRoute.summary[key]?.median
                const dynamicMedian = dynamicRoute.summary[key]?.median
                if (!Number.isFinite(directMedian) || !Number.isFinite(dynamicMedian) || directMedian === undefined || dynamicMedian === undefined) continue
                const delta = dynamicMedian - directMedian
                metrics[key] = {
                    direct: directMedian,
                    dynamic: dynamicMedian,
                    delta,
                    deltaPercent: directMedian === 0 ? 0 : delta / directMedian * 100
                }
            }
            comparisons.push({
                route: route.path,
                profile: profile.name,
                metrics
            })
        }
    }
    return comparisons
}

function recommend(results: VariantResult[]): Recommendation {
    const direct = results.find((result) => result.name === 'direct')
    const dynamic = results.find((result) => result.name === 'dynamic-ssr-false')
    if (!direct?.smoke.ok || !dynamic?.smoke.ok) {
        return {
            winner: 'direct',
            reason: 'At least one variant failed correctness checks; keep the direct import baseline.'
        }
    }

    const comparisons = compareVariants(results)
    let runtimeReadinessRegressions = 0
    let fcpOrLCPWins = 0
    for (const comparison of comparisons) {
        const runtimeObserved = comparison.metrics.runtimeObserved
        if (runtimeObserved && (runtimeObserved.delta > 100 || runtimeObserved.deltaPercent > 10)) {
            runtimeReadinessRegressions++
        }
        for (const key of ['fcp', 'lcp'] as const) {
            const metric = comparison.metrics[key]
            if (metric && metric.delta < 0 && Math.abs(metric.deltaPercent) >= 5) {
                fcpOrLCPWins++
            }
        }
    }

    if (runtimeReadinessRegressions >= Math.ceil(comparisons.length / 2) && fcpOrLCPWins <= 1) {
        return {
            winner: 'direct',
            reason: `Dynamic delayed runtime readiness in ${runtimeReadinessRegressions}/${comparisons.length} comparisons without consistent FCP/LCP gains.`
        }
    }

    let directScore = 0
    let dynamicScore = 0
    for (const comparison of comparisons) {
        for (const key of ['fcp', 'lcp', 'load', 'runtimeObserved', 'longTaskTotal', 'jsTransferSize'] as const) {
            const metric = comparison.metrics[key]
            if (!metric) continue
            if (Math.abs(metric.deltaPercent) < 3) continue
            if (metric.delta < 0) {
                dynamicScore++
            } else {
                directScore++
            }
        }
    }

    if (dynamicScore > directScore + 2) {
        return {
            winner: 'dynamic-ssr-false',
            reason: `Dynamic won ${dynamicScore} material metric comparisons versus ${directScore} for direct import.`
        }
    }

    if (directScore > dynamicScore + 2) {
        return {
            winner: 'direct',
            reason: `Direct import won ${directScore} material metric comparisons versus ${dynamicScore} for dynamic.`
        }
    }

    return {
        winner: 'inconclusive',
        reason: `Material wins were close: direct ${directScore}, dynamic ${dynamicScore}. Prefer direct import unless app-specific data proves otherwise.`
    }
}

function renderMarkdown(report: BenchmarkReport) {
    const lines: string[] = [
        '# Next.js CSSRuntimeRegistry benchmark',
        '',
        `- Generated: ${report.generatedAt}`,
        `- Browser: ${report.browser.name} ${report.browser.version}`,
        `- Rounds: ${report.config.rounds} measured, ${report.config.warmupRounds} warmup`,
        `- Recommendation: **${report.recommendation.winner}** - ${report.recommendation.reason}`,
        '',
        '## Correctness',
        '',
        '| Variant | Smoke | Late class | Errors |',
        '|---|---:|---:|---|'
    ]

    for (const variant of report.variants) {
        lines.push(`| ${variant.label} | ${variant.smoke.ok ? 'pass' : 'fail'} | ${variant.smoke.lateClassObserved ? 'pass' : 'fail'} | ${variant.smoke.errors.join('<br>')} |`)
    }

    lines.push(
        '',
        '## Build Output',
        '',
        '| Variant | Route | Build | HTML | style#master-css | Hydration manifest | Hydration rules | Initial JS | Initial JS gzip | Initial JS brotli |',
        '|---|---|---:|---:|---:|---:|---:|---:|---:|---:|'
    )

    for (const variant of report.variants) {
        for (const route of routeConfigs) {
            const output = variant.build.output[route.path]
            if (!output) continue
            lines.push([
                variant.label,
                route.path,
                formatMs(variant.build.ms),
                formatBytes(output.htmlBytes),
                formatBytes(output.masterStyleBytes),
                formatBytes(output.hydrationManifestBytes),
                String(output.hydrationManifestRuleCount),
                `${output.initialJSChunkCount} / ${formatBytes(output.initialJSRawBytes)}`,
                formatBytes(output.initialJSGzipBytes),
                formatBytes(output.initialJSBrotliBytes)
            ].join(' | ').replace(/^/, '| ').replace(/$/, ' |'))
        }
    }

    lines.push(
        '',
        '## First Load Medians',
        '',
        '| Variant | Route | Profile | TTFB | FCP | LCP | DCL | Load | Runtime created | Runtime hydrated | Runtime observed | Long tasks | JS transfer | Total transfer |',
        '|---|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|'
    )

    for (const variant of report.variants) {
        for (const routeProfile of variant.routes) {
            lines.push([
                variant.label,
                routeProfile.route,
                routeProfile.profile,
                formatSummaryMs(routeProfile.summary.ttfb),
                formatSummaryMs(routeProfile.summary.fcp),
                formatSummaryMs(routeProfile.summary.lcp),
                formatSummaryMs(routeProfile.summary.domContentLoaded),
                formatSummaryMs(routeProfile.summary.load),
                formatSummaryMs(routeProfile.summary.runtimeCreated),
                formatSummaryMs(routeProfile.summary.runtimeHydrated),
                formatSummaryMs(routeProfile.summary.runtimeObserved),
                formatSummaryMs(routeProfile.summary.longTaskTotal),
                formatSummaryBytes(routeProfile.summary.jsTransferSize),
                formatSummaryBytes(routeProfile.summary.transferSize)
            ].join(' | ').replace(/^/, '| ').replace(/$/, ' |'))
        }
    }

    lines.push(
        '',
        '## Dynamic vs Direct Delta',
        '',
        'Negative deltas mean `dynamic-ssr-false` is faster or smaller. Positive deltas favor direct import.',
        '',
        '| Route | Profile | FCP | LCP | Load | Runtime observed | Long tasks | JS transfer |',
        '|---|---|---:|---:|---:|---:|---:|---:|'
    )

    for (const comparison of report.comparisons) {
        lines.push([
            comparison.route,
            comparison.profile,
            formatDelta(comparison.metrics.fcp),
            formatDelta(comparison.metrics.lcp),
            formatDelta(comparison.metrics.load),
            formatDelta(comparison.metrics.runtimeObserved),
            formatDelta(comparison.metrics.longTaskTotal),
            formatByteDelta(comparison.metrics.jsTransferSize)
        ].join(' | ').replace(/^/, '| ').replace(/$/, ' |'))
    }

    lines.push('')
    return `${lines.join('\n')}\n`
}

async function readHydrationManifestFromHTML(html: string, baseURL: string) {
    const match = html.match(/<style\b(?=[^>]*\bid=(["'])master-css\1)([^>]*)>/)
    const attrs = match?.[2] || ''
    const sourceMatch = attrs.match(/\bdata-master-css-hydration-manifest=(["'])(.*?)\1/)
    if (!sourceMatch) {
        return {
            source: '',
            ruleCount: 0
        }
    }
    const sourceURL = new URL(sourceMatch[2], baseURL).href
    const source = await fetchText(sourceURL)
    let ruleCount = 0
    try {
        const parsed = JSON.parse(source) as { rules?: unknown[] }
        ruleCount = Array.isArray(parsed.rules) ? parsed.rules.length : 0
    } catch {}
    return {
        source,
        ruleCount
    }
}

function readMasterStyle(html: string) {
    return html.match(/<style\b(?=[^>]*\bid=(["'])master-css\1)[^>]*>([\s\S]*?)<\/style>/)?.[2] || ''
}

function extractScriptSources(html: string) {
    const sources = new Set<string>()
    for (const match of html.matchAll(/<script\b[^>]*\bsrc=(["'])(.*?)\1/g)) {
        sources.add(match[2])
    }
    return [...sources]
}

async function measureNextStaticFiles(appDir: string, sources: string[]) {
    const files = sources
        .map((source) => source.split('?')[0])
        .filter((source) => source.startsWith('/_next/'))
        .map((source) => join(appDir, '.next', source.slice('/_next/'.length)))
    let raw = 0
    let gzip = 0
    let brotli = 0
    let count = 0
    const seen = new Set<string>()
    for (const file of files) {
        if (seen.has(file)) continue
        seen.add(file)
        try {
            const content = await readFile(file)
            raw += content.length
            gzip += gzipSync(content).length
            brotli += brotliCompressSync(content).length
            count++
        } catch {}
    }
    return { count, raw, gzip, brotli }
}

async function startNextServer(appDir: string) {
    const port = await getFreePort()
    const child = spawn('pnpm', ['--dir', appDir, 'exec', 'next', 'start', '-p', String(port), '-H', '127.0.0.1'], {
        cwd: repoRoot,
        env: {
            ...process.env,
            NEXT_TELEMETRY_DISABLED: '1'
        }
    })
    const logs: string[] = []
    child.stdout.on('data', (chunk: Buffer) => logs.push(chunk.toString()))
    child.stderr.on('data', (chunk: Buffer) => logs.push(chunk.toString()))
    const url = `http://127.0.0.1:${port}`

    try {
        await waitForHTTP(url, child, logs)
    } catch (error) {
        await closeProcess(child)
        throw error
    }

    return {
        url,
        close: () => closeProcess(child)
    }
}

async function waitForHTTP(url: string, child: ChildProcessWithoutNullStreams, logs: string[]) {
    const startedAt = performance.now()
    while (performance.now() - startedAt < 30_000) {
        if (child.exitCode !== null) {
            throw new Error(`next start exited early with code ${child.exitCode}\n${logs.join('')}`)
        }
        try {
            const response = await fetch(url)
            if (response.ok) return
        } catch {}
        await delay(250)
    }
    throw new Error(`Timed out waiting for ${url}\n${logs.join('')}`)
}

async function closeProcess(child: ChildProcessWithoutNullStreams) {
    if (child.exitCode !== null) return
    child.kill('SIGTERM')
    const exited = await Promise.race([
        new Promise<boolean>((resolveExit) => child.once('exit', () => resolveExit(true))),
        delay(5_000).then(() => false)
    ])
    if (!exited && child.exitCode === null) {
        child.kill('SIGKILL')
        await new Promise((resolveExit) => child.once('exit', resolveExit))
    }
}

async function getFreePort() {
    const server = createServer()
    return new Promise<number>((resolvePort, rejectPort) => {
        server.once('error', rejectPort)
        server.listen(0, '127.0.0.1', () => {
            const address = server.address()
            server.close(() => {
                if (address && typeof address !== 'string') {
                    resolvePort(address.port)
                } else {
                    rejectPort(new Error('Cannot resolve free port.'))
                }
            })
        })
    })
}

async function fetchText(url: string) {
    const response = await fetch(url)
    if (!response.ok) throw new Error(`Fetch failed ${response.status} for ${url}`)
    return response.text()
}

async function execFileBuffered(
    command: string,
    commandArgs: string[],
    options: { cwd: string, env: NodeJS.ProcessEnv, timeout: number }
) {
    return new Promise<{ stdout: string, stderr: string }>((resolveExec, rejectExec) => {
        execFile(command, commandArgs, {
            cwd: options.cwd,
            env: options.env,
            timeout: options.timeout,
            maxBuffer: 1024 * 1024 * 16
        }, (error, stdout, stderr) => {
            if (error) {
                rejectExec(new Error([
                    error.message,
                    stdout,
                    stderr
                ].filter(Boolean).join('\n')))
                return
            }
            resolveExec({ stdout, stderr })
        })
    })
}

async function writeJSON(file: string, value: unknown) {
    await mkdir(dirname(file), { recursive: true })
    await writeFile(file, `${JSON.stringify(value, null, 2)}\n`)
}

function printRouteProfile(variant: VariantName, routeProfile: RouteProfileResult) {
    const fcp = routeProfile.summary.fcp?.median || 0
    const lcp = routeProfile.summary.lcp?.median || 0
    const observed = routeProfile.summary.runtimeObserved?.median || 0
    console.log(`${variant} ${routeProfile.route} ${routeProfile.profile}: FCP ${formatMs(fcp)}, LCP ${formatMs(lcp)}, observed ${formatMs(observed)}`)
}

function parseArgs(values: string[]) {
    const parsed = new Map<string, string>()
    for (let index = 0; index < values.length; index++) {
        const value = values[index]
        if (!value.startsWith('--')) continue
        parsed.set(value.slice(2), values[index + 1])
        index++
    }
    return parsed
}

function numberArg(name: string, envName: string, fallback: number) {
    const value = args.get(name) || process.env[envName]
    if (!value) return fallback
    const number = Number(value)
    if (!Number.isFinite(number) || number < 0) throw new Error(`Invalid ${name}: ${value}`)
    return number
}

function delay(ms: number) {
    return new Promise((resolveDelay) => setTimeout(resolveDelay, ms))
}

function formatError(error: unknown) {
    return error instanceof Error ? error.message : String(error)
}

function formatMs(value: number) {
    return `${value.toFixed(2)} ms`
}

function formatBytes(value: number) {
    return `${value.toLocaleString('en-US')} B`
}

function formatSummaryMs(summary?: Summary) {
    return summary ? formatMs(summary.median) : ''
}

function formatSummaryBytes(summary?: Summary) {
    return summary ? formatBytes(Math.round(summary.median)) : ''
}

function formatDelta(metric?: { delta: number, deltaPercent: number }) {
    if (!metric) return ''
    return `${metric.delta >= 0 ? '+' : ''}${formatMs(metric.delta)} (${metric.deltaPercent >= 0 ? '+' : ''}${metric.deltaPercent.toFixed(1)}%)`
}

function formatByteDelta(metric?: { delta: number, deltaPercent: number }) {
    if (!metric) return ''
    return `${metric.delta >= 0 ? '+' : ''}${formatBytes(Math.round(metric.delta))} (${metric.deltaPercent >= 0 ? '+' : ''}${metric.deltaPercent.toFixed(1)}%)`
}

function toRepoPath(file: string) {
    const relative = file.startsWith(`${repoRoot}/`) ? file.slice(repoRoot.length + 1) : file
    return relative
}
