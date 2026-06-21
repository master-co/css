import { existsSync } from 'node:fs'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { createServer } from 'node:http'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { firefox } from '@playwright/test'

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const distRoot = resolve(packageRoot, 'dist')
const globalBundleFile = resolve(distRoot, 'global.min.js')
const defaultManifestFile = resolve(distRoot, 'default-manifest.json')
const args = parseArgs(process.argv.slice(2))
const rounds = Number(process.env.MASTER_CSS_BENCH_ROUNDS || 5)
const warmupRounds = Number(process.env.MASTER_CSS_BENCH_WARMUP_ROUNDS || 1)
const scanClassCount = Number(process.env.MASTER_CSS_BENCH_SCAN_CLASSES || 1000)
const mutationClassCount = Number(process.env.MASTER_CSS_BENCH_MUTATION_CLASSES || 1000)
const hydrationClassCount = Number(process.env.MASTER_CSS_BENCH_HYDRATION_CLASSES || 250)
const outputFile = args.get('output') || process.env.MASTER_CSS_BENCH_OUTPUT || process.env.MASTER_CSS_BENCH_JSON

const nativeProperties = [
    'width',
    'height',
    'min-width',
    'max-width',
    'margin',
    'padding',
    'top',
    'right',
    'bottom',
    'left'
]

if (!existsSync(globalBundleFile) || !existsSync(defaultManifestFile)) {
    console.error('Runtime benchmark requires built runtime artifacts.')
    console.error('Run `pnpm --filter @master/css-runtime build` first.')
    process.exit(1)
}

const { createCSS, createHydrationManifest } = await import('@master/css-engine')
const defaultManifest = (await import('@master/css-preset/default-manifest.json', { with: { type: 'json' } })).default

function createClassNames(count) {
    return Array.from({ length: count }, (_, index) => {
        const property = nativeProperties[index % nativeProperties.length]
        return `${property}:${index + 1}px`
    })
}

function createClassMarkup(classNames) {
    return classNames
        .map((className, index) => `<div data-bench="${index}" class="${escapeAttribute(className)}"></div>`)
        .join('')
}

function escapeAttribute(value) {
    return value
        .replaceAll('&', '&amp;')
        .replaceAll('"', '&quot;')
        .replaceAll('<', '&lt;')
}

function parseArgs(values) {
    const parsed = new Map()
    for (let index = 0; index < values.length; index++) {
        const value = values[index]
        if (!value.startsWith('--')) continue
        parsed.set(value.slice(2), values[index + 1])
        index++
    }
    return parsed
}

function createHydrationFixture(classNames) {
    const css = createCSS(defaultManifest, undefined, {
        nativeDeclarationMatcher: () => true
    })
    css.add(...classNames)
    return {
        bodyMarkup: createClassMarkup(classNames),
        hydrationManifest: createHydrationManifest(css),
        styleText: css.text
    }
}

function startServer() {
    const server = createServer(async (request, response) => {
        const path = new URL(request.url || '/', 'http://127.0.0.1').pathname

        try {
            if (path === '/') {
                response.writeHead(200, {
                    'content-type': 'text/html; charset=utf-8',
                    'cache-control': 'no-store'
                })
                response.end('<!doctype html><html hidden><head><meta charset="utf-8"></head><body></body></html>')
                return
            }

            if (path === '/global.min.js') {
                response.writeHead(200, {
                    'content-type': 'text/javascript; charset=utf-8',
                    'cache-control': 'no-store'
                })
                response.end(await readFile(globalBundleFile))
                return
            }

            if (path === '/default-manifest.json') {
                response.writeHead(200, {
                    'content-type': 'application/json; charset=utf-8',
                    'cache-control': 'no-store'
                })
                response.end(await readFile(defaultManifestFile))
                return
            }

            response.writeHead(404)
            response.end('Not found')
        } catch (error) {
            response.writeHead(500)
            response.end(error instanceof Error ? error.stack : String(error))
        }
    })

    return new Promise((resolveServer) => {
        server.listen(0, '127.0.0.1', () => {
            const address = server.address()
            if (!address || typeof address === 'string') throw new Error('Cannot resolve benchmark server address.')
            resolveServer({
                close: () => new Promise((resolveClose) => server.close(resolveClose)),
                url: `http://127.0.0.1:${address.port}`
            })
        })
    })
}

async function loadRuntime(page, scriptURL) {
    return page.evaluate(async (url) => {
        const startedAt = performance.now()
        const script = document.createElement('script')
        script.type = 'module'
        script.src = url
        document.head.append(script)

        while (!globalThis.cssRuntime?.observing) {
            if (performance.now() - startedAt > 10_000) {
                throw new Error('Timed out waiting for cssRuntime to observe the document.')
            }
            await new Promise((resolveFrame) => requestAnimationFrame(resolveFrame))
        }

        return performance.now() - startedAt
    }, scriptURL)
}

async function createPage(browser, baseURL, bodyMarkup = '') {
    const page = await browser.newPage()
    await page.goto(baseURL)
    if (bodyMarkup) {
        await page.evaluate((html) => {
            document.body.innerHTML = html
        }, bodyMarkup)
    }
    return page
}

async function createObservedPage(browser, baseURL, scriptURL, bodyMarkup = '') {
    const page = await createPage(browser, baseURL, bodyMarkup)
    await loadRuntime(page, scriptURL)
    return page
}

async function createProgressivePage(browser, baseURL, fixture, includeManifest) {
    const page = await createPage(browser, baseURL)
    await page.evaluate(({ bodyMarkup, hydrationManifest, styleText, withManifest }) => {
        const style = document.createElement('style')
        style.id = 'master'
        style.setAttribute('blocking', 'render')
        style.textContent = styleText
        document.head.append(style)

        if (withManifest) {
            const hydrationManifestScript = document.createElement('script')
            hydrationManifestScript.id = 'master-css-hydration-manifest'
            hydrationManifestScript.type = 'application/json'
            hydrationManifestScript.textContent = JSON.stringify(hydrationManifest)
            document.head.append(hydrationManifestScript)
        }

        document.body.innerHTML = bodyMarkup
    }, {
        bodyMarkup: fixture.bodyMarkup,
        hydrationManifest: fixture.hydrationManifest,
        styleText: fixture.styleText,
        withManifest: includeManifest
    })
    return page
}

async function runBenchmark(name, callback) {
    const samples = []
    const totalRounds = warmupRounds + rounds

    for (let index = 0; index < totalRounds; index++) {
        const value = await callback()
        if (index >= warmupRounds) samples.push(value)
    }

    return {
        name,
        samples,
        ...summarize(samples)
    }
}

function summarize(samples) {
    const sorted = [...samples].sort((left, right) => left - right)
    const sum = samples.reduce((total, value) => total + value, 0)
    const middle = Math.floor(sorted.length / 2)
    return {
        max: sorted[sorted.length - 1],
        mean: sum / samples.length,
        median: sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2,
        min: sorted[0]
    }
}

function formatMs(value) {
    return `${value.toFixed(2)} ms`
}

function printResults(results) {
    console.log('Master CSS runtime browser benchmark')
    console.log('Browser: Firefox via Playwright')
    console.log(`Rounds: ${rounds} measured, ${warmupRounds} warmup`)
    console.log(`Class counts: scan=${scanClassCount}, mutation=${mutationClassCount}, hydration=${hydrationClassCount}`)
    console.log('')

    for (const result of results) {
        console.log([
            result.name.padEnd(48),
            `median ${formatMs(result.median)}`.padEnd(18),
            `mean ${formatMs(result.mean)}`.padEnd(16),
            `min ${formatMs(result.min)}`.padEnd(15),
            `max ${formatMs(result.max)}`
        ].join(' '))
    }

    console.log('')
    console.log('Advisory only: compare before/after on the same machine, browser, build, and class counts.')
}

async function writeResults(results, browserVersion) {
    if (!outputFile) return
    await mkdir(dirname(outputFile), { recursive: true })
    await writeFile(outputFile, `${JSON.stringify({
        schemaVersion: 1,
        package: '@master/css-runtime',
        tool: 'playwright',
        generatedAt: new Date().toISOString(),
        browser: {
            name: 'firefox',
            version: browserVersion
        },
        config: {
            rounds,
            warmupRounds,
            scanClassCount,
            mutationClassCount,
            hydrationClassCount
        },
        benchmarks: results.map((result) => ({
            name: result.name,
            unit: 'ms',
            samples: result.samples,
            min: result.min,
            max: result.max,
            mean: result.mean,
            median: result.median
        }))
    }, null, 2)}\n`)
}

const server = await startServer()
let browser

try {
    browser = await firefox.launch()
    const browserVersion = browser.version()

    const scriptURL = `${server.url}/global.min.js`
    const scanClasses = createClassNames(scanClassCount)
    const mutationClasses = createClassNames(mutationClassCount)
    const hydrationClasses = createClassNames(hydrationClassCount)
    const scanMarkup = createClassMarkup(scanClasses)
    const mutationMarkup = createClassMarkup(mutationClasses)
    const hydrationFixture = createHydrationFixture(hydrationClasses)
    const results = []

    results.push(await runBenchmark('initial DOM scan + unique class add', async () => {
        const page = await createPage(browser, server.url, scanMarkup)
        try {
            const elapsed = await loadRuntime(page, scriptURL)
            const generatedCount = await page.evaluate(() => globalThis.cssRuntime.classUtilities.size)
            if (generatedCount !== scanClasses.length) {
                throw new Error(`Expected ${scanClasses.length} generated classes, got ${generatedCount}.`)
            }
            return elapsed
        } finally {
            await page.close()
        }
    }))

    results.push(await runBenchmark('mutation add/remove classes', async () => {
        const page = await createObservedPage(browser, server.url, scriptURL)
        try {
            const elapsed = await page.evaluate(async ({ html }) => {
                const container = document.createElement('section')
                container.innerHTML = html
                const startedAt = performance.now()
                document.body.append(container)
                await new Promise((resolveMutation) => setTimeout(resolveMutation, 0))
                container.remove()
                await new Promise((resolveMutation) => setTimeout(resolveMutation, 0))
                return performance.now() - startedAt
            }, { html: mutationMarkup })
            const state = await page.evaluate(() => ({
                classes: globalThis.cssRuntime.classCounts.size,
                utilities: globalThis.cssRuntime.classUtilities.size
            }))
            if (state.classes || state.utilities) {
                throw new Error(`Expected mutation cleanup to empty runtime state, got ${JSON.stringify(state)}.`)
            }
            return elapsed
        } finally {
            await page.close()
        }
    }))

    results.push(await runBenchmark('direct CSSOM add/remove generated rules', async () => {
        const page = await createObservedPage(browser, server.url, scriptURL)
        try {
            const elapsed = await page.evaluate((classes) => {
                const startedAt = performance.now()
                globalThis.cssRuntime.add(...classes)
                globalThis.cssRuntime.remove(...classes)
                return performance.now() - startedAt
            }, mutationClasses)
            const generatedCount = await page.evaluate(() => globalThis.cssRuntime.classUtilities.size)
            if (generatedCount) {
                throw new Error(`Expected direct add/remove cleanup to empty classUtilities, got ${generatedCount}.`)
            }
            return elapsed
        } finally {
            await page.close()
        }
    }))

    results.push(await runBenchmark('progressive hydration success path', async () => {
        const page = await createProgressivePage(browser, server.url, hydrationFixture, true)
        try {
            const elapsed = await loadRuntime(page, scriptURL)
            const state = await page.evaluate(() => ({
                failure: globalThis.cssRuntime.hydrationFailureReason,
                progressive: globalThis.cssRuntime.progressive,
                utilities: globalThis.cssRuntime.classUtilities.size
            }))
            if (!state.progressive || state.failure || state.utilities !== hydrationClasses.length) {
                throw new Error(`Expected successful hydration, got ${JSON.stringify(state)}.`)
            }
            return elapsed
        } finally {
            await page.close()
        }
    }))

    results.push(await runBenchmark('progressive hydration fallback path', async () => {
        const page = await createProgressivePage(browser, server.url, hydrationFixture, false)
        try {
            const elapsed = await loadRuntime(page, scriptURL)
            const state = await page.evaluate(() => ({
                failure: globalThis.cssRuntime.hydrationFailureReason,
                progressive: globalThis.cssRuntime.progressive,
                utilities: globalThis.cssRuntime.classUtilities.size
            }))
            if (state.progressive || state.utilities !== hydrationClasses.length) {
                throw new Error(`Expected fallback hydration, got ${JSON.stringify(state)}.`)
            }
            return elapsed
        } finally {
            await page.close()
        }
    }))

    printResults(results)
    await writeResults(results, browserVersion)
} finally {
    await browser?.close()
    await server.close()
}
