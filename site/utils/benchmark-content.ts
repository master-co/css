import path from 'node:path'
import { Children, createElement, Fragment, isValidElement, type ReactNode } from 'react'
import { extractReferenceMdx, portableMarkdown } from '../reference/markdown'
import { BenchmarkBars, BenchmarkMetricTable, BenchmarkStackedBars } from '../components/benchmarks'
import type { BenchmarkBarItem, BenchmarkMetric, BenchmarkStackedBarItem } from '../components/benchmarks'
import { formatMetricValue } from '../components/benchmarks/utils'
import pageCssSnapshot from '../../benchmarks/docs-page-css-size/snapshot.json'
import * as staticCharts from '../app/[locale]/guide/benchmarks/components/StaticTailwindComparison'
import * as buildCharts from '../app/[locale]/guide/benchmarks/components/BuildPathDiagnosticsBenchmark'
import * as browserCharts from '../app/[locale]/guide/benchmarks/components/BrowserCSSCostBenchmark'
import * as deliveryCharts from '../app/[locale]/guide/benchmarks/components/MasterDeliveryModesBenchmark'
import * as interactionCharts from '../app/[locale]/guide/benchmarks/components/InteractionCostBenchmark'
import * as lifecycleCharts from '../app/[locale]/guide/benchmarks/components/BrowserLifecycleBenchmark'

/** Only these authored, static chart models may be evaluated. MDX is never executed. */
export const benchmarkContentComponents = {
  ...staticCharts, ...buildCharts,
  ...browserCharts, ...deliveryCharts, ...interactionCharts, ...lifecycleCharts,
}

export function benchmarkLabel(value: ReactNode): string {
  if (typeof value === 'string' || typeof value === 'number') return String(value)
  if (Array.isArray(value)) return value.map(benchmarkLabel).join('')
  if (isValidElement<{ children?: ReactNode }>(value)) return benchmarkLabel(value.props.children)
  return ''
}

const cell = (value: ReactNode) => benchmarkLabel(value).replace(/\|/g, '\\|').replace(/</g, '&lt;').replace(/\n/g, ' ')
function table(headers: ReactNode[], rows: ReactNode[][]) {
  return `\n\n| ${headers.map(cell).join(' | ')} |\n| ${headers.map(() => '---').join(' | ')} |\n${rows.map(row => `| ${row.map(cell).join(' | ')} |`).join('\n')}\n\n`
}
function htmlRows(node: ReactNode): ReactNode[][] {
  return Children.toArray(node).flatMap(child => {
    if (!isValidElement<{ children?: ReactNode }>(child)) return []
    if (child.type === 'tr') return [Children.toArray(child.props.children).map(entry => isValidElement<{ children?: ReactNode }>(entry) ? entry.props.children : entry)]
    return htmlRows(child.props.children)
  })
}

/** Serialize chart values, labels and tables from the same props used by the browser. */
export function benchmarkMarkdown(node: ReactNode): string {
  return Children.toArray(node).map(child => {
    if (typeof child === 'string' || typeof child === 'number') return String(child)
    if (!isValidElement<Record<string, any>>(child)) return ''
    const { type, props } = child
    if (type === BenchmarkBars) {
      return table(['Series', 'Value', 'Detail'], (props.items as BenchmarkBarItem[]).map(item => [
        item.label, item.valueLabel ?? props.valueFormatter?.(item.value) ?? formatMetricValue(item.value, props.unit), item.detail,
      ]))
    }
    if (type === BenchmarkStackedBars) {
      return (props.items as BenchmarkStackedBarItem[]).map(item => {
        const total = item.total ?? item.segments.reduce((sum, segment) => sum + segment.value, 0)
        return `\n\n**${cell(item.label)}** · ${cell(props.valueFormatter?.(total) ?? formatMetricValue(total, props.unit))}${item.detail ? ` · ${cell(item.detail)}` : ''}`
          + table(['Component', 'Value'], item.segments.map(segment => [segment.label, segment.valueLabel ?? props.valueFormatter?.(segment.value) ?? formatMetricValue(segment.value, props.unit)]))
      }).join('')
    }
    if (type === BenchmarkMetricTable) return table(['Metric', 'Value', 'Detail'], (props.metrics as BenchmarkMetric[]).map(metric => [metric.label, metric.value, metric.detail]))
    if (type === Fragment) return benchmarkMarkdown(props.children)
    if (typeof type === 'function') {
      if (type.name === 'ExpandContent' || type.name === 'Translate') return benchmarkMarkdown(props.children)
      const rendered = (type as (props: Record<string, any>) => ReactNode)(props)
      if (rendered == null) throw new Error(`Unregistered benchmark presentation: ${String(type)}`)
      return benchmarkMarkdown(rendered)
    }
    if (typeof type !== 'string') throw new Error(`Unregistered benchmark presentation: ${String(type)}`)
    if (type === 'table') {
      const [headers, ...rows] = htmlRows(props.children)
      const caption = Children.toArray(props.children).find(entry => isValidElement(entry) && entry.type === 'caption')
      return (caption ? benchmarkMarkdown(caption) : '') + table(headers, rows)
    }
    const content = benchmarkMarkdown(props.children)
    if (type === 'a') return `[${content}](${props.href})`
    if (type === 'code') return `\`${content}\``
    if (type === 'strong') return `**${content}**`
    if (['summary', 'caption', 'figcaption', 'p'].includes(type)) return `\n\n${content}\n\n`
    if (/^h[1-6]$/.test(type)) return `\n\n${'#'.repeat(Number(type[1]))} ${content}\n\n`
    return content
  }).join('')
}

export async function benchmarkContent(siteRoot: string) {
  const result = await extractReferenceMdx(path.join(siteRoot, 'app/[locale]/guide/benchmarks/content.mdx'), [], [], {
    component(name, attrs) {
      if (name === 'PageCSSSizeBenchmark') {
        return table(['Site', 'Raw CSS', 'Brotli CSS'], pageCssSnapshot.pages.map(page => [
          page.name, `${(page.css.total.rawBytes / 1000).toFixed(1)} kB`, `${(page.css.total.brotliBytes / 1000).toFixed(1)} kB`
        ]))
      }
      const component = benchmarkContentComponents[name as keyof typeof benchmarkContentComponents]
      if (!component) return
      if (Object.keys(attrs).length) throw new Error(`Unexpected benchmark props: ${name}`)
      return benchmarkMarkdown((component as () => ReactNode)())
    },
  })
  if (result.notes.length) throw new Error(`Incomplete Benchmarks export: ${result.notes.join('; ')}`)
  const markdown = result.markdown.replace(/\n{3,}/g, '\n\n')
  return { ...result, searchMarkdown: markdown, markdown: portableMarkdown(markdown) }
}
