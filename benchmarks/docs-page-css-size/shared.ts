import cheerio from 'cheerio'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { brotliCompressSync } from 'node:zlib'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const benchmarkRoot = resolve(__dirname, '..')
const committedSnapshotFile = resolve(__dirname, 'snapshot.json')
const transientSnapshotFile = resolve(benchmarkRoot, '.results/docs-page-css-size/snapshot.json')
const inputFile = resolve(__dirname, 'input.json')
const fetchTimeoutMS = Number(process.env.DOCS_PAGE_CSS_SIZE_FETCH_TIMEOUT_MS || 15_000)

type PageInput = {
    name: string
    url: string
}

type ByteSummary = {
    rawBytes: number
    brotliBytes: number
}

type CSSAsset = ByteSummary & {
    kind: 'external' | 'inline'
    url?: string
    resolvedUrl?: string
    tag?: string
}

type PageCSSSize = {
    name: string
    url: string
    resolvedUrl: string
    css: {
        total: ByteSummary
        inline: ByteSummary
        external: ByteSummary
    }
    assets: CSSAsset[]
}

export type DocsPageCSSSizeSnapshot = {
    schemaVersion: 1
    suite: 'docs-page-css-size'
    generatedAt: string
    pages: PageCSSSize[]
}

type FetchedResource = {
    buffer: Buffer
    resolvedUrl: string
    status: number
    text: string
}

export async function collectDocsPageCSSSizeSnapshot(): Promise<DocsPageCSSSizeSnapshot> {
    const input = JSON.parse(await readFile(inputFile, 'utf8')) as PageInput[]
    const pages = await Promise.all(input.map(collectPageCSSSize))

    return {
        schemaVersion: 1,
        suite: 'docs-page-css-size',
        generatedAt: new Date().toISOString(),
        pages: pages.sort((a, b) => b.css.total.rawBytes - a.css.total.rawBytes)
    }
}

export async function writeSnapshot(snapshot: DocsPageCSSSizeSnapshot) {
    const outputFile = process.env.UPDATE_BENCHMARK_SNAPSHOT === 'true'
        ? committedSnapshotFile
        : transientSnapshotFile

    await mkdir(dirname(outputFile), { recursive: true })
    await writeFile(outputFile, `${JSON.stringify(snapshot, null, 4)}\n`)

    return outputFile
}

export function printSnapshotSummary(snapshot: DocsPageCSSSizeSnapshot) {
    const masterCSSPage = snapshot.pages.find((page) => page.name === 'Master CSS')

    if (!masterCSSPage) {
        console.log('Master CSS page is missing from docs page CSS size input.')
        return
    }

    console.log('')
    console.log('Total page CSS size (raw):')
    for (const page of snapshot.pages) {
        console.log(formatPageLine(page, masterCSSPage, 'rawBytes'))
    }

    console.log('')
    console.log('Total page CSS size (brotli):')
    for (const page of snapshot.pages) {
        console.log(formatPageLine(page, masterCSSPage, 'brotliBytes'))
    }
    console.log('')
}

async function collectPageCSSSize(input: PageInput): Promise<PageCSSSize> {
    const page = await fetchResource(input.url)
    const $ = cheerio.load(page.text)
    const inlineAssets = $('style')
        .map((_: number, element: any) => {
            const text = $(element).text()
            const summary = summarizeBytes(Buffer.from(text))

            return {
                kind: 'inline' as const,
                tag: formatStyleTag(element),
                ...summary
            }
        })
        .get()

    const externalHrefs = $('link[rel*="stylesheet"]')
        .map((_: number, element: any) => $(element).attr('href'))
        .get()
        .filter((href: unknown): href is string => typeof href === 'string' && href.length > 0)

    const externalAssets = await Promise.all(externalHrefs.map(async (href: string) => {
        const resolvedUrl = new URL(href, page.resolvedUrl).toString()
        const resource = await fetchResource(resolvedUrl)

        return {
            kind: 'external' as const,
            url: href,
            resolvedUrl: resource.resolvedUrl,
            ...summarizeBytes(resource.buffer)
        }
    }))

    const inline = sumByteSummaries(inlineAssets)
    const external = sumByteSummaries(externalAssets)

    return {
        name: input.name,
        url: input.url,
        resolvedUrl: page.resolvedUrl,
        css: {
            total: addByteSummaries(inline, external),
            inline,
            external
        },
        assets: [
            ...externalAssets,
            ...inlineAssets
        ]
    }
}

async function fetchResource(url: string): Promise<FetchedResource> {
    let response: Response

    try {
        response = await fetch(url, {
            signal: AbortSignal.timeout(fetchTimeoutMS)
        })
    } catch (error) {
        throw new Error(`Failed to fetch ${url}: ${error instanceof Error ? error.message : String(error)}`)
    }

    if (!response.ok && response.status !== 404) {
        throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`)
    }

    const buffer = Buffer.from(await response.arrayBuffer())

    return {
        buffer,
        resolvedUrl: response.url || url,
        status: response.status,
        text: buffer.toString('utf8')
    }
}

function summarizeBytes(buffer: Buffer): ByteSummary {
    return {
        rawBytes: buffer.length,
        brotliBytes: brotliCompressSync(buffer).length
    }
}

function sumByteSummaries(summaries: ByteSummary[]): ByteSummary {
    return summaries.reduce(addByteSummaries, { rawBytes: 0, brotliBytes: 0 })
}

function addByteSummaries(left: ByteSummary, right: ByteSummary): ByteSummary {
    return {
        rawBytes: left.rawBytes + right.rawBytes,
        brotliBytes: left.brotliBytes + right.brotliBytes
    }
}

function formatStyleTag(element: any) {
    return `<style${element.attribs?.id ? ` id="${element.attribs.id}"` : ''}>`
}

function formatPageLine(page: PageCSSSize, baseline: PageCSSSize, key: keyof ByteSummary) {
    const ratio = page.css.total[key] / baseline.css.total[key]

    return [
        page.name.padEnd(14),
        formatBytes(page.css.total[key]).padStart(8),
        `${ratio.toFixed(1)}x`.padStart(6),
        `Inline ${formatBytes(page.css.inline[key])}`,
        `External ${formatBytes(page.css.external[key])}`
    ].join('  ')
}

function formatBytes(value: number) {
    if (value < 1000) return `${value} B`
    return `${(value / 1000).toFixed(value < 10_000 ? 1 : 0)} kB`
}
