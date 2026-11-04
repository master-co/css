import snapshot from '~/site/.generated/benchmarks/docs-page-css-size.json'
import type { BenchmarkChartModel } from '@master/internal-site/benchmarks/types.ts'

type Range = { min: number, median: number, max: number }

type Page = {
  name: string
  css: { total: { rawBytes: number, brotliBytes: number } }
  usage: { styleRules: number, matchedStyleRules: number }
  sample: { pageCount: number, rawBytes: Range, brotliBytes: Range, matchedRuleShare: Range }
  site?: { pageCount: number, rawBytes: Range, brotliBytes: Range, matchedRuleShare: Range }
}

const pages = [...snapshot.pages as Page[]].sort((a, b) => a.sample.brotliBytes.median - b.sample.brotliBytes.median)

const kilobytes = (bytes: number) => `${(bytes / 1000).toFixed(1)} kB`
const percent = (share: number) => `${Math.round(share * 100)}%`

/** Every sampled page of each site: CSS bodies and the share of their style rules that match the loaded DOM. */
export const PageCSSSampleTable = {
  kind: 'data-table',
  label: 'Documentation page CSS across five pages per site',
  numericFrom: 2,
  headers: ['Site', 'Listed page (Brotli)', 'Five-page median (Brotli)', 'Five-page range (Brotli)', 'Five-page median (raw)', 'Matched style rules, median', 'Matched style rules, range'],
  rows: pages.map((page) => [
    page.name,
    kilobytes(page.css.total.brotliBytes),
    kilobytes(page.sample.brotliBytes.median),
    `${kilobytes(page.sample.brotliBytes.min)} – ${kilobytes(page.sample.brotliBytes.max)}`,
    kilobytes(page.sample.rawBytes.median),
    percent(page.sample.matchedRuleShare.median),
    `${percent(page.sample.matchedRuleShare.min)} – ${percent(page.sample.matchedRuleShare.max)}`
  ])
} satisfies BenchmarkChartModel

const measuredSite = pages.find((page) => page.site)!

const formatRange = (range: Range, format: (value: number) => string) => `${format(range.median)} (${format(range.min)} – ${format(range.max)})`

/** Every documentation page in the measured site's sitemap: median and range. */
export const PageCSSSiteTable = {
  kind: 'metric-table',
  label: `${measuredSite.name} documentation pages`,
  metrics: [
    { label: 'Pages', value: measuredSite.site!.pageCount, detail: 'every page the sitemap lists' },
    { label: 'CSS, Brotli', value: formatRange(measuredSite.site!.brotliBytes, kilobytes), detail: 'median (minimum – maximum)' },
    { label: 'CSS, raw', value: formatRange(measuredSite.site!.rawBytes, kilobytes), detail: 'median (minimum – maximum)' },
    { label: 'Matched style rules', value: formatRange(measuredSite.site!.matchedRuleShare, percent), detail: 'median (minimum – maximum)' }
  ]
} satisfies BenchmarkChartModel
