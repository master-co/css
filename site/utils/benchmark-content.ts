import path from 'node:path'
import { extractReferenceMdx, portableMarkdown } from '../reference/markdown'
import type { BenchmarkBarItem, BenchmarkBarsProps, BenchmarkChartModel } from '@master/internal-site/benchmarks/types.ts'
import { formatMetricValue } from '@master/internal-site/benchmarks/utils.ts'
import pageCssSnapshot from '../.generated/benchmarks/docs-page-css-size.json'
import * as summaryCharts from '../content/benchmarks/components/BenchmarkSummary'
import * as pageCSSCharts from '../content/benchmarks/components/PageCSSSizeSample'
import * as revisionCharts from '../content/benchmarks/components/RevisionComparison'
import * as staticCharts from '../content/benchmarks/components/StaticTailwindComparison'
import * as buildCharts from '../content/benchmarks/components/BuildPathDiagnosticsBenchmark'
import * as browserCharts from '../content/benchmarks/components/BrowserCSSCostBenchmark'
import * as deliveryCharts from '../content/benchmarks/components/MasterDeliveryModesBenchmark'
import * as interactionCharts from '../content/benchmarks/components/InteractionCostBenchmark'
import * as lifecycleCharts from '../content/benchmarks/components/BrowserLifecycleBenchmark'

/**
 * The authored chart models `<BenchmarkChart chart={Name} />` may name in the Benchmarks MDX.
 * They are plain data, so exporting them renders nothing. MDX is never executed.
 */
export const benchmarkContentComponents: Record<string, BenchmarkChartModel> = {
  ...summaryCharts, ...pageCSSCharts, ...revisionCharts, ...staticCharts, ...buildCharts,
  ...browserCharts, ...deliveryCharts, ...interactionCharts, ...lifecycleCharts,
}

type BenchmarkText = string | number | null | undefined | readonly BenchmarkText[]

export function benchmarkLabel(value: BenchmarkText): string {
  if (typeof value === 'string' || typeof value === 'number') return String(value)
  if (Array.isArray(value)) return value.map(benchmarkLabel).join('')
  return ''
}

const cell = (value: BenchmarkText) => benchmarkLabel(value).replace(/\|/g, '\\|').replace(/</g, '&lt;').replace(/\n/g, ' ')
function table(headers: BenchmarkText[], rows: BenchmarkText[][]) {
  return `\n\n| ${headers.map(cell).join(' | ')} |\n| ${headers.map(() => '---').join(' | ')} |\n${rows.map(row => `| ${row.map(cell).join(' | ')} |`).join('\n')}\n\n`
}

/** The row label as the page shows it: the label, then its quieter note. */
const barLabel = (item: BenchmarkBarItem) => [item.label, item.labelNote]

function barsTable({ items, unit, valueFormatter }: BenchmarkBarsProps) {
  return table(['Series', 'Value', 'Detail'], items.map(item => [
    barLabel(item), item.valueLabel ?? valueFormatter?.(item.value) ?? formatMetricValue(item.value, unit), item.detail,
  ]))
}

/** Serialize chart values, labels and tables from the same models the page renders. */
export function benchmarkMarkdown(chart: BenchmarkChartModel): string {
  switch (chart.kind) {
    case 'bars':
      return barsTable(chart)
    case 'stacked-bars':
      return chart.items.map(item => {
        const total = item.total ?? item.segments.reduce((sum, segment) => sum + segment.value, 0)
        return `\n\n**${cell(item.label)}** · ${cell(chart.valueFormatter?.(total) ?? formatMetricValue(total, chart.unit))}${item.detail ? ` · ${cell(item.detail)}` : ''}`
          + table(['Component', 'Value'], item.segments.map(segment => [segment.label, segment.valueLabel ?? chart.valueFormatter?.(segment.value) ?? formatMetricValue(segment.value, chart.unit)]))
      }).join('')
    case 'metric-table':
      return table(['Metric', 'Value', 'Detail'], chart.metrics.map(metric => [metric.label, metric.value, metric.detail]))
    case 'chart-groups':
      return chart.groups.map(group => `\n\n#### ${group.title}\n\n${group.detail}${barsTable(group)}`).join('')
    case 'data-table':
      return table(chart.headers, chart.rows)
    default:
      throw new Error(`Unregistered benchmark presentation: ${String((chart as { kind?: unknown })?.kind)}`)
  }
}

export async function benchmarkContent(siteRoot: string) {
  const result = await extractReferenceMdx(path.join(siteRoot, 'content/benchmarks/content.mdx'), [], [], {
    component(name, attrs) {
      if (name === 'PageCSSSizeBenchmark') {
        return table(['Site', 'Raw CSS', 'Brotli CSS'], pageCssSnapshot.pages.map(page => [
          page.name, `${(page.css.total.rawBytes / 1000).toFixed(1)} kB`, `${(page.css.total.brotliBytes / 1000).toFixed(1)} kB`
        ])) + '\nBoth views use the same scale and the committed page snapshot.\n'
      }
      if (name !== 'BenchmarkChart') return
      const { chart: reference, ...rest } = attrs as { chart?: { type?: string, value?: string } }
      if (Object.keys(rest).length || reference?.type !== 'mdxJsxAttributeValueExpression') throw new Error('BenchmarkChart takes one chart={Name} reference')
      const chart = benchmarkContentComponents[reference.value?.trim() ?? '']
      if (!chart) throw new Error(`Unregistered benchmark chart: ${reference.value}`)
      return benchmarkMarkdown(chart)
    },
  })
  if (result.notes.length) throw new Error(`Incomplete Benchmarks export: ${result.notes.join('; ')}`)
  const markdown = result.markdown.replace(/\n{3,}/g, '\n\n')
  return { ...result, searchMarkdown: markdown, markdown: portableMarkdown(markdown) }
}
