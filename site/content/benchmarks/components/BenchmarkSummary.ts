import pageCSS from '~/site/.generated/benchmarks/docs-page-css-size.json'
import staticComparison from '~/site/.generated/benchmarks/tailwind-static-comparison.json'
import delivery from '~/site/.generated/benchmarks/master-delivery-modes.json'
import interaction from '~/site/.generated/benchmarks/interaction-cost.json'
import evidence from '~/site/.generated/benchmarks/long-session-evidence.json'
import type { BenchmarkChartModel, BenchmarkMetric } from '@master/internal-site/benchmarks/types.ts'

type Stats = { median: number }

const kilobytes = (bytes: number) => `${(bytes / 1000).toFixed(1)} kB`

/** Two values of one unit, such as `2.1 / 2.6`. */
function pair(first: number, second: number, divisor: number, digits: number) {
  return `${(first / divisor).toFixed(digits)} / ${(second / divisor).toFixed(digits)}`
}

function metric(label: string, value: string, detail: string): BenchmarkMetric {
  return { label, value, detail }
}

function pageRows() {
  const pages = pageCSS.pages as { name: string, css: { total: { brotliBytes: number } }, sample: { brotliBytes: Stats, matchedRuleShare: Stats } }[]
  const master = pages.find((page) => page.name === 'Master CSS')!
  const share = [...pages].sort((a, b) => b.sample.matchedRuleShare.median - a.sample.matchedRuleShare.median).indexOf(master) + 1
  return [
    metric('Documentation page CSS', `${pair(master.css.total.brotliBytes, master.sample.brotliBytes.median, 1000, 1)} kB`, 'Master CSS site, Brotli: listed page / five-page median.'),
    metric('Matched style rules', `${Math.round(master.sample.matchedRuleShare.median * 100)}%`, `Master CSS site, five-page median; ${share === 1 ? 'the highest' : `number ${share}`} of ${pages.length} sites.`)
  ]
}

function staticRows() {
  const docs = staticComparison.results.find((result) => result.fixtureId === 'docs')!.variants as Record<string, { css: { brotliBytes: number, brotliFileSumBytes: number, fileCount: number }, build: { coldMedianMs: number } }>
  const master = docs['master-static-cli']
  const tailwind = docs['tailwind-cli']
  return {
    css: [
      metric('Same UI, generated CSS', `${pair(master.css.brotliBytes, tailwind.css.brotliBytes, 1000, 1)} kB`, 'Master CSS / Tailwind CSS, docs fixture, Brotli.'),
      metric('Same UI, per file', `${pair(master.css.brotliFileSumBytes, tailwind.css.brotliFileSumBytes, 1000, 1)} kB`, `Each of Master CSS’s ${master.css.fileCount} files compressed on its own.`)
    ],
    build: metric('Cold production command', `${pair(master.build.coldMedianMs, tailwind.build.coldMedianMs, 1, 0)} ms`, 'Master CSS / Tailwind CSS, docs fixture, including startup.')
  }
}

function deliveryRows() {
  const docs = delivery.results.find((result) => result.fixtureId === 'docs')!.modes as Record<string, { payload: Record<string, { brotliBytes: number }>, timing: Record<string, Stats> }>
  const runtime = docs['master-runtime']
  const progressive = docs['master-progressive']
  return [
    metric('Runtime download', kilobytes(runtime.payload.runtimeJS.brotliBytes + runtime.payload.runtimeProgram.brotliBytes), `Runtime JS ${kilobytes(runtime.payload.runtimeJS.brotliBytes)} + compiled program ${kilobytes(runtime.payload.runtimeProgram.brotliBytes)}, Brotli.`),
    metric('Progressive first load', `${progressive.timing.requestCount.median} requests`, 'HTML and runtime JS; the program loads only when a class needs it.')
  ]
}

function interactionRow() {
  const variants = interaction.results.flatMap((result) => Object.values(result.scenarios as Record<string, Record<string, { correctness: Record<string, Stats> }>>).flatMap((modes) => Object.values(modes)))
  const valid = variants.filter((variant) => variant.correctness.computedStyleValid.median === 1 && variant.correctness.cleanupValid.median === 1).length
  return metric('Post-load correctness', `${valid} / ${variants.length}`, 'Interactions passing computed-style and cleanup checks.')
}

function lifecycleRow() {
  const summaries = evidence.variantSummaries as { modeId: string, metrics: Record<string, Stats> }[]
  const recalc = (modeId: string) => summaries.find((summary) => summary.modeId === modeId)!.metrics['style-recalculation-ms'].median
  return metric('Long-session style work', `${pair(recalc('master-runtime'), recalc('tailwind-static'), 1000, 1)} s`, 'Master CSS runtime / Tailwind CSS static, one five-minute run each.')
}

const { css, build } = staticRows()

/** The headline answers, computed from the committed snapshots so the prose never repeats a stale number. */
export const BenchmarkSummaryTable = {
  kind: 'metric-table',
  label: 'Recorded results at a glance',
  metrics: [...pageRows(), ...css, build, ...deliveryRows(), interactionRow(), lifecycleRow()]
} satisfies BenchmarkChartModel
