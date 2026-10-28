import type { BenchmarkBarItem, BenchmarkMetric, BenchmarkStackedBarItem } from '~/site/components/benchmarks/types'

export const outputItems: BenchmarkBarItem[] = [
  {
    id: 'master-static',
    label: 'Fixture A',
    value: 18.4,
    detail: 'baseline',
    color: 'blue'
  },
  {
    id: 'master-progressive',
    label: 'Fixture B',
    value: 21.8,
    detail: '+18%',
    color: 'violet'
  },
  {
    id: 'tailwind-vite',
    label: 'Fixture C',
    value: 34.2,
    detail: '1.9x',
    color: 'cyan'
  },
  {
    id: 'tailwind-cli',
    label: 'Fixture D',
    value: 38.6,
    detail: '2.1x',
    color: 'neutral'
  }
]

export const payloadItems: BenchmarkStackedBarItem[] = [
  {
    id: 'runtime',
    label: 'Runtime',
    segments: [
      { id: 'css', label: 'CSS', value: 8.6, color: 'blue' },
      { id: 'runtime-js', label: 'Runtime JS', value: 14.2, color: 'violet' },
      { id: 'manifest', label: 'Manifest', value: 5.4, color: 'cyan' }
    ],
    detail: 'first visit'
  },
  {
    id: 'static',
    label: 'Static',
    segments: [
      { id: 'css', label: 'CSS', value: 18.4, color: 'blue' },
      { id: 'runtime-js', label: 'Runtime JS', value: 0, color: 'violet' },
      { id: 'manifest', label: 'Manifest', value: 0, color: 'cyan' }
    ],
    detail: 'cached CSS'
  },
  {
    id: 'progressive',
    label: 'Progressive',
    segments: [
      { id: 'css', label: 'CSS', value: 6.1, color: 'blue' },
      { id: 'runtime-js', label: 'Runtime JS', value: 14.2, color: 'violet' },
      { id: 'manifest', label: 'Hydration', value: 1.9, color: 'green' }
    ],
    detail: 'HTML response'
  }
]

export const metrics: BenchmarkMetric[] = [
  { label: 'Fixture', value: 'dashboard' },
  { label: 'Median build', value: '148 ms', tone: 'good', detail: '10 measured rounds' },
  { label: 'Warm rebuild', value: '28 ms', tone: 'good', detail: 'single class edit' },
  { label: 'Generated rules', value: '1,284', detail: 'after pruning' },
  { label: 'Long tasks', value: '0', tone: 'good', detail: 'Chromium trace sample' }
]

export const traceItems: BenchmarkBarItem[] = [
  { id: 'long-label', label: 'A deliberately long scenario name that remains readable on a narrow screen', value: 12.5, detail: '3 samples', color: 'blue' },
  { id: 'no-work', label: 'No recorded work', value: 0, detail: '3 samples', color: 'violet' },
]

export const deltaItems = [
  { tone: 'good', value: '-38%', label: 'CSS bytes' },
  { tone: 'warn', value: '+12%', label: 'build time' },
  { tone: 'bad', value: '+42 ms', label: 'style calc' },
  { tone: 'neutral', value: 'baseline', label: 'current' },
] as const

export const sampleSummary = { min: 14.2, median: 16.8, mean: 17.1, max: 22.4, sampleCount: 25, unit: 'ms' }

export function benchmarkExamplesMarkdown() {
  return `Illustrative component data.\n\n| Fixture | CSS (kB) | Context |\n| --- | --- | --- |\n${outputItems.map(item => `| ${item.label} | ${item.value} | ${item.detail} |`).join('\n')}\n\n| Payload | Segment | kB |\n| --- | --- | --- |\n${payloadItems.flatMap(item => item.segments.map(segment => `| ${item.label} | ${segment.label} | ${segment.value} |`)).join('\n')}\n\n${metrics.map(metric => `- ${metric.label}: ${metric.value}${metric.detail ? ` — ${metric.detail}` : ''}`).join('\n')}\n\n${traceItems.map(item => `- ${item.label}: ${item.value} ms — ${item.detail}`).join('\n')}\n\n${deltaItems.map(item => `- ${item.label}: ${item.value}`).join('\n')}\n\nSample summary: min ${sampleSummary.min} ms, median ${sampleSummary.median} ms, mean ${sampleSummary.mean} ms, max ${sampleSummary.max} ms, ${sampleSummary.sampleCount} samples.\n\nThe illustrative table uses 100 kB of raw CSS, 148 ms median build time and 10 samples for each fixture, with the CSS values above. The example source date is 2026-07-01 UTC.`
}
