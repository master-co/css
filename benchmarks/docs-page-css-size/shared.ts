import { load } from 'cheerio'
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
  status?: number
  contentType?: string
}

type PageCSSSize = {
  name: string
  url: string
  resolvedUrl: string
  status: number
  contentType: string
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
  limits: string[]
}

type FetchedResource = {
  buffer: Buffer
  resolvedUrl: string
  status: number
  contentType: string
  text: string
}

export async function collectDocsPageCSSSizeSnapshot(): Promise<DocsPageCSSSizeSnapshot> {
  const input = JSON.parse(await readFile(inputFile, 'utf8')) as PageInput[]
  const pages = await requireAllResources(input.map(collectPageCSSSize))

  return {
    schemaVersion: 1,
    suite: 'docs-page-css-size',
    generatedAt: new Date().toISOString(),
    pages: pages.sort((a, b) => b.css.total.rawBytes - a.css.total.rawBytes),
    limits: [
      'All documents and linked stylesheets must complete successfully with an expected MIME type; any failure rejects the complete snapshot.',
      'This measures static inline style and linked stylesheet bodies, not browser transfer sizes, JavaScript-injected CSS, CSS import graphs, or applied-rule validity.',
      'Brotli totals sum independently compressed asset bodies; linked occurrences and inline tags are counted as authored.'
    ]
  }
}

export async function writeSnapshot(snapshot: DocsPageCSSSizeSnapshot) {
  const outputFile = process.env.UPDATE_BENCHMARK_SNAPSHOT === 'true'
    ? committedSnapshotFile
    : transientSnapshotFile

  await mkdir(dirname(outputFile), { recursive: true })
  await writeFile(outputFile, `${JSON.stringify(snapshot, null, 2)}\n`)

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
  const page = await fetchResource(input.url, 'HTML')
  const $ = load(page.text)
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

  const externalAssets = await requireAllResources(externalHrefs.map(async (href: string) => {
    const resolvedUrl = new URL(href, page.resolvedUrl).toString()
    const resource = await fetchResource(resolvedUrl, 'CSS')

    return {
      kind: 'external' as const,
      url: href,
      resolvedUrl: resource.resolvedUrl,
      status: resource.status,
      contentType: resource.contentType,
      ...summarizeBytes(resource.buffer)
    }
  }))

  const inline = sumByteSummaries(inlineAssets)
  const external = sumByteSummaries(externalAssets)

  return {
    name: input.name,
    url: input.url,
    resolvedUrl: page.resolvedUrl,
    status: page.status,
    contentType: page.contentType,
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

async function requireAllResources<T>(resources: Promise<T>[]): Promise<T[]> {
  const results = await Promise.allSettled(resources)
  const errors = results.filter((result): result is PromiseRejectedResult => result.status === 'rejected')
  if (errors.length) {
    const causes = errors.map(result => result.reason)
    throw new AggregateError(causes, causes.map(error => error instanceof Error ? error.message : String(error)).join('\n'))
  }
  return results.map(result => (result as PromiseFulfilledResult<T>).value)
}

async function fetchResource(url: string, kind: 'HTML' | 'CSS'): Promise<FetchedResource> {
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(fetchTimeoutMS) })
    const contentType = response.headers.get('content-type') || ''
    const mime = contentType.split(';')[0].trim().toLowerCase()
    const expected = kind === 'CSS' ? ['text/css'] : ['text/html', 'application/xhtml+xml']
    const failure = !response.ok || response.status === 206
      ? `HTTP ${response.status} ${response.statusText}`
      : !expected.includes(mime) ? `Expected ${kind} MIME ${expected.join(' or ')}, received ${contentType || '(missing Content-Type)'}` : undefined
    if (failure) {
      await response.body?.cancel().catch(() => undefined)
      throw new Error(failure)
    }
    const buffer = Buffer.from(await response.arrayBuffer())
    return {
      buffer,
      resolvedUrl: response.url || url,
      status: response.status,
      contentType,
      text: buffer.toString('utf8')
    }
  } catch (error) {
    throw new Error(`Failed to fetch ${kind} ${url}: ${error instanceof Error ? error.message : String(error)}`, { cause: error })
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
