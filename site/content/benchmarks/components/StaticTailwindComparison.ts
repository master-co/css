import snapshot from '~/site/.generated/benchmarks/tailwind-static-comparison.json'
import type { BenchmarkBarItem, BenchmarkChartModel, BenchmarkColor, BenchmarkMetric } from '~/site/components/benchmarks/types'

type VariantId = 'master-static-cli' | 'master-static-vite' | 'tailwind-cli' | 'tailwind-vite'
type PrimaryVariantId = 'master-static-cli' | 'tailwind-cli'

type VariantResult = {
  css: {
    rawBytes: number
    gzipBytes: number
    brotliBytes: number
    fileCount: number
    sha256: string
  }
  build: {
    coldMedianMs: number
    repeatMedianMs: number
    sampleCount: number
  }
  structure: {
    styleRules: number
    selectors: number
    declarations: number
    customProperties: number
    importantDeclarations: number
    atRules: number
    layerBlocks: number
    mediaBlocks: number
    supportsBlocks: number
    containerBlocks: number
    keyframes: number
    unlayeredStyleRules: number
    layerStyleRules: {
      theme: number
      base: number
      defaults: number
      components: number
      utilities: number
      other: number
    }
    selectorCombinators: number
    maxSelectorSpecificityScore: number
    maxSelectorComplexityScore: number
  }
}

type FixtureResult = {
  fixtureId: string
  variants: Record<VariantId, VariantResult>
}

const primaryFixtureId = 'docs'
const variants = snapshot.variants as { id: VariantId; label: string }[]
const results = snapshot.results as FixtureResult[]

const primaryVariants = [
  {
    id: 'master-static-cli',
    label: 'Master CSS',
    color: 'yellow'
  },
  {
    id: 'tailwind-cli',
    label: 'Tailwind CSS',
    color: 'cyan'
  }
] satisfies { id: PrimaryVariantId; label: string; color: BenchmarkColor }[]

function getFixtureName(fixtureId: string) {
  return snapshot.fixtures.find((fixture) => fixture.id === fixtureId)?.name ?? fixtureId
}

function getPrimaryResult() {
  const result = results.find((candidate) => candidate.fixtureId === primaryFixtureId)
  if (!result) throw new Error(`Missing benchmark fixture result: ${primaryFixtureId}`)
  return result
}

function formatKilobytes(bytes: number) {
  return `${(bytes / 1000).toFixed(1)} kB`
}

function formatMilliseconds(value: number) {
  return `${value.toFixed(value >= 100 ? 0 : 1)} ms`
}

function formatCount(value: number) {
  return value.toLocaleString('en-US')
}

function formatRatio(value: number, baseline: number) {
  if (value <= 0 || baseline <= 0) return 'n/a'
  return `${Number((Math.max(value, baseline) / Math.min(value, baseline)).toFixed(1)).toLocaleString('en-US')}x`
}

function formatLowerRatio(value: number, baseline: number, label: string) {
  if (value >= baseline) return
  return `${formatRatio(value, baseline)} ${label}`
}

function createCssBarItems(result: FixtureResult): BenchmarkBarItem[] {
  const baselineByVariant: Record<PrimaryVariantId, number> = {
    'master-static-cli': result.variants['tailwind-cli'].css.brotliBytes,
    'tailwind-cli': result.variants['master-static-cli'].css.brotliBytes
  }

  return primaryVariants.map((variant) => {
    const value = result.variants[variant.id].css.brotliBytes
    return {
      id: `${result.fixtureId}-${variant.id}-css`,
      label: variant.label,
      labelNote: formatLowerRatio(value, baselineByVariant[variant.id], 'smaller'),
      value: value / 1000,
      valueLabel: formatKilobytes(value),
      color: variant.color
    }
  })
}

function createBuildBarItems(result: FixtureResult): BenchmarkBarItem[] {
  const baselineByVariant: Record<PrimaryVariantId, number> = {
    'master-static-cli': result.variants['tailwind-cli'].build.coldMedianMs,
    'tailwind-cli': result.variants['master-static-cli'].build.coldMedianMs
  }

  return primaryVariants.map((variant) => {
    const value = result.variants[variant.id].build.coldMedianMs
    return {
      id: `${result.fixtureId}-${variant.id}-build`,
      label: variant.label,
      labelNote: formatLowerRatio(value, baselineByVariant[variant.id], 'faster'),
      value,
      valueLabel: formatMilliseconds(value),
      color: variant.color
    }
  })
}

function createDeclarationBarItems(result: FixtureResult): BenchmarkBarItem[] {
  const baselineByVariant: Record<PrimaryVariantId, number> = {
    'master-static-cli': result.variants['tailwind-cli'].structure.declarations,
    'tailwind-cli': result.variants['master-static-cli'].structure.declarations
  }

  return primaryVariants.map((variant) => {
    const value = result.variants[variant.id].structure.declarations
    return {
      id: `${result.fixtureId}-${variant.id}-declarations`,
      label: variant.label,
      labelNote: formatLowerRatio(value, baselineByVariant[variant.id], 'fewer'),
      value,
      valueLabel: formatCount(value),
      color: variant.color
    }
  })
}

function createSummaryMetrics(): BenchmarkMetric[] {
  const masterCliWins = results.filter((result) => result.variants['master-static-cli'].css.brotliBytes < result.variants['tailwind-cli'].css.brotliBytes).length
  const tailwindCliBuildWins = results.filter((result) => result.variants['tailwind-cli'].build.coldMedianMs < result.variants['master-static-cli'].build.coldMedianMs).length
  const sampleCount = results[0]?.variants['master-static-cli'].build.sampleCount ?? 0

  return [
    {
      label: 'Fixtures',
      value: results.length
    },
    {
      label: 'CSS output',
      value: `${masterCliWins}/${results.length}`,
      detail: 'fixtures where Master CSS is smaller than Tailwind CSS by brotli bytes in the CLI setup',
      tone: 'good'
    },
    {
      label: 'Build command',
      value: `${tailwindCliBuildWins}/${results.length}`,
      detail: 'fixtures where Tailwind CSS has the lower cold production command median in the CLI setup',
      tone: 'warn'
    },
    {
      label: 'Build samples',
      value: sampleCount,
      detail: 'measured command rounds per variant',
      tone: 'neutral'
    },
    {
      label: 'CSS structure',
      value: 'AST',
      detail: 'rules, selectors, declarations, layers, at-rules, and selector scores are parsed from generated CSS',
      tone: 'neutral'
    }
  ]
}

export const StaticComparisonSummary: BenchmarkChartModel = {
  kind: 'metric-table',
  label: 'Static CSS output metrics',
  metrics: createSummaryMetrics()
}

export const StaticCSSOutputChart: BenchmarkChartModel = { kind: 'bars', items: createCssBarItems(getPrimaryResult()), unit: 'kB' }

export const StaticBuildChart: BenchmarkChartModel = { kind: 'bars', items: createBuildBarItems(getPrimaryResult()), unit: 'ms' }

export const StaticStructureChart: BenchmarkChartModel = { kind: 'bars', items: createDeclarationBarItems(getPrimaryResult()), unit: 'count' }

export const StaticCSSBytesTable: BenchmarkChartModel = {
  kind: 'data-table',
  label: 'Static CSS bytes results',
  numericFrom: 3,
  headers: ['Fixture', 'Variant', 'Raw', 'Gzip', 'Brotli', 'Files'],
  rows: results.flatMap((result) => variants.map((variant) => {
    const value = result.variants[variant.id].css
    return [
      getFixtureName(result.fixtureId),
      variant.label,
      formatKilobytes(value.rawBytes),
      formatKilobytes(value.gzipBytes),
      formatKilobytes(value.brotliBytes),
      value.fileCount
    ]
  }))
}

export const StaticBuildTable: BenchmarkChartModel = {
  kind: 'data-table',
  label: 'Static build results',
  numericFrom: 3,
  headers: ['Fixture', 'Variant', 'Cold median', 'Repeat median', 'Samples'],
  rows: results.flatMap((result) => variants.map((variant) => {
    const value = result.variants[variant.id].build
    return [
      getFixtureName(result.fixtureId),
      variant.label,
      formatMilliseconds(value.coldMedianMs),
      formatMilliseconds(value.repeatMedianMs),
      value.sampleCount
    ]
  }))
}

export const StaticStructureTable: BenchmarkChartModel = {
  kind: 'data-table',
  label: 'Static structure results',
  numericFrom: 3,
  headers: ['Fixture', 'Variant', 'Rules', 'Selectors', 'Declarations', 'Custom properties', 'At-rules', 'Layer blocks', 'Unlayered rules', 'Combinators', 'Max specificity', 'Max complexity'],
  rows: results.flatMap((result) => variants.map((variant) => {
    const value = result.variants[variant.id].structure
    return [
      getFixtureName(result.fixtureId),
      variant.label,
      formatCount(value.styleRules),
      formatCount(value.selectors),
      formatCount(value.declarations),
      formatCount(value.customProperties),
      formatCount(value.atRules),
      formatCount(value.layerBlocks),
      formatCount(value.unlayeredStyleRules),
      formatCount(value.selectorCombinators),
      formatCount(value.maxSelectorSpecificityScore),
      formatCount(value.maxSelectorComplexityScore)
    ]
  }))
}
