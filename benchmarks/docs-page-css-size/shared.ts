import { load } from 'cheerio'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { brotliCompressSync } from 'node:zlib'
import { measureSelectorUsage, selectorUsageViewport, type SelectorUsage } from './usage'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const benchmarkRoot = resolve(__dirname, '..')
const committedSnapshotFile = resolve(__dirname, 'snapshot.json')
const transientSnapshotFile = resolve(benchmarkRoot, '.results/docs-page-css-size/snapshot.json')
const inputFile = resolve(__dirname, 'input.json')
const fetchTimeoutMS = Number(process.env.DOCS_PAGE_CSS_SIZE_FETCH_TIMEOUT_MS || 15_000)
// Maps a published origin to the origin that serves the build being measured, such as a local
// production build that has not been deployed yet: {"https://rc.css.master.co":"http://127.0.0.1:4517"}.
const originOverrides: Record<string, string> = JSON.parse(process.env.DOCS_PAGE_CSS_SIZE_ORIGIN_OVERRIDES || '{}')

type PageInput = {
  name: string
  url: string
  samples?: string[]
  // Measures every page the sitemap lists, resolved against the site's own origin.
  sitemap?: string
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

type PageMeasurement = {
  url: string
  measuredUrl?: string
  resolvedUrl: string
  status: number
  contentType: string
  css: {
    total: ByteSummary
    inline: ByteSummary
    external: ByteSummary
  }
  assets: CSSAsset[]
  usage: SelectorUsage
}

type Range = { min: number, median: number, max: number }

type PageCSSSize = PageMeasurement & {
  name: string
  // The listed page followed by the sampled pages of the same site.
  sample: {
    pageCount: number
    rawBytes: Range
    brotliBytes: Range
    matchedRuleShare: Range
    pages: Omit<PageMeasurement, 'assets'>[]
  }
  site?: {
    sitemap: string
    pageCount: number
    rawBytes: Range
    brotliBytes: Range
    matchedRuleShare: Range
  }
}

export type DocsPageCSSSizeSnapshot = {
  schemaVersion: 2
  suite: 'docs-page-css-size'
  generatedAt: string
  browser: { name: string, version: string, viewport: typeof selectorUsageViewport }
  originOverrides: Record<string, string>
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

export async function collectDocsPageCSSSizeSnapshot(options: {
  measureUsage?: typeof measureSelectorUsage
  readBrowserVersion?: () => Promise<string>
} = {}): Promise<DocsPageCSSSizeSnapshot> {
  const { measureUsage = measureSelectorUsage, readBrowserVersion = readChromiumVersion } = options
  const input = JSON.parse(await readFile(inputFile, 'utf8')) as PageInput[]
  const sitemapPages = await Promise.all(input.map(async (site) => site.sitemap ? readSitemapPages(site.sitemap, site.url) : []))
  const targets = input.flatMap((site, index) => [
    ...[site.url, ...(site.samples || [])].map((url) => ({ site: site.name, url, kind: 'sample' as const })),
    ...sitemapPages[index].map((url) => ({ site: site.name, url, kind: 'site' as const }))
  ])
  const collected = await requireAllResources(targets.map((target) => collectPageCSSSize(target.url)))
  const usage = await measureUsage(collected.map((page) => ({ url: page.measurement.measuredUrl || page.measurement.resolvedUrl, cssTexts: page.cssTexts })))
  const measurements = collected.map((page, index) => ({ ...page.measurement, usage: usage[index] }))
  const select = (name: string, kind: 'sample' | 'site') => measurements.filter((_, index) => targets[index].site === name && targets[index].kind === kind)
  const summarize = (pages: PageMeasurement[]) => ({
    pageCount: pages.length,
    rawBytes: range(pages.map((page) => page.css.total.rawBytes)),
    brotliBytes: range(pages.map((page) => page.css.total.brotliBytes)),
    matchedRuleShare: range(pages.map((page) => page.usage.matchedStyleRules / Math.max(1, page.usage.styleRules)), 3)
  })
  const pages = input.map((site) => {
    const sitePages = select(site.name, 'sample')
    const [listed] = sitePages
    const sitemapMeasurements = select(site.name, 'site')
    return {
      name: site.name,
      ...listed,
      sample: {
        ...summarize(sitePages),
        pages: sitePages.map(({ assets: _assets, ...page }) => page)
      },
      ...(site.sitemap && { site: { sitemap: site.sitemap, ...summarize(sitemapMeasurements) } })
    }
  })

  return {
    schemaVersion: 2,
    suite: 'docs-page-css-size',
    generatedAt: new Date().toISOString(),
    browser: { name: 'Chromium', version: await readBrowserVersion(), viewport: selectorUsageViewport },
    originOverrides,
    pages: pages.sort((a, b) => b.css.total.rawBytes - a.css.total.rawBytes),
    limits: [
      'All documents and linked stylesheets must complete successfully with an expected MIME type; any failure rejects the complete snapshot.',
      'This measures static inline style and linked stylesheet bodies, not browser transfer sizes, JavaScript-injected CSS, CSS import graphs, or applied-rule validity.',
      'Brotli totals sum independently compressed asset bodies; linked occurrences and inline tags are counted as authored.',
      'Each site is represented by its listed page; the sample adds four more documentation pages of the same site and reports the range across all five.',
      'Matched rules are style rules whose selector, without state pseudo-classes and pseudo-elements, matches an element of the loaded page at the recorded viewport; conditional rules count whatever their condition. A rule used only after later interaction counts as unmatched.',
      'Pages fetched through an origin override are recorded with their published URL and the measured URL.',
      'A site with a sitemap also reports the range across every page the sitemap lists; its pages are not stored individually.'
    ]
  }
}

async function readSitemapPages(sitemap: string, siteUrl: string) {
  const resource = await fetchResource(overrideOrigin(sitemap), 'XML')
  const origin = new URL(siteUrl).origin
  return [...resource.text.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => {
    const url = new URL(match[1].trim())
    return new URL(url.pathname + url.search, origin).toString()
  })
}

function range(values: number[], digits = 0): Range {
  const sorted = [...values].sort((a, b) => a - b)
  const middle = sorted.length / 2
  const median = sorted.length % 2 ? sorted[Math.floor(middle)] : (sorted[middle - 1] + sorted[middle]) / 2
  const round = (value: number) => Number(value.toFixed(digits))
  return { min: round(sorted[0]), median: round(median), max: round(sorted[sorted.length - 1]) }
}

async function readChromiumVersion() {
  const { chromium } = await import('@playwright/test')
  const browser = await chromium.launch()
  try {
    return browser.version()
  } finally {
    await browser.close()
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
  console.log('Five-page sample (brotli min / median / max, matched rule share median):')
  for (const page of snapshot.pages) {
    const { brotliBytes, matchedRuleShare } = page.sample
    console.log(`${page.name.padEnd(14)}  ${formatBytes(brotliBytes.min)} / ${formatBytes(brotliBytes.median)} / ${formatBytes(brotliBytes.max)}  ${(matchedRuleShare.median * 100).toFixed(0)}%`)
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

async function collectPageCSSSize(url: string): Promise<{ measurement: Omit<PageMeasurement, 'usage'>, cssTexts: string[] }> {
  const measuredUrl = overrideOrigin(url)
  const page = await fetchResource(measuredUrl, 'HTML')
  const $ = load(page.text)
  const cssTexts: string[] = []
  const inlineAssets = $('style')
    .map((_: number, element: any) => {
      const text = $(element).text()
      cssTexts.push(text)
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

  // Relative stylesheet URLs resolve against the document base, as in the browser.
  const baseUrl = new URL($('base[href]').first().attr('href') || '', page.resolvedUrl)
  const externalAssets = await requireAllResources(externalHrefs.map(async (href: string) => {
    const resolvedUrl = new URL(href, baseUrl).toString()
    const resource = await fetchResource(resolvedUrl, 'CSS')
    cssTexts.push(resource.text)

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
    cssTexts,
    measurement: {
      url,
      ...(measuredUrl !== url && { measuredUrl }),
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
}

function overrideOrigin(url: string) {
  const parsed = new URL(url)
  const origin = originOverrides[parsed.origin]
  return origin ? new URL(parsed.pathname + parsed.search, origin).toString() : url
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

async function fetchResource(url: string, kind: 'HTML' | 'CSS' | 'XML'): Promise<FetchedResource> {
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(fetchTimeoutMS) })
    const contentType = response.headers.get('content-type') || ''
    const mime = contentType.split(';')[0].trim().toLowerCase()
    const expected = { CSS: ['text/css'], HTML: ['text/html', 'application/xhtml+xml'], XML: ['application/xml', 'text/xml'] }[kind]
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
