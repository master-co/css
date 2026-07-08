export type BenchmarkFixtureId =
  | 'minimal'
  | 'docs'
  | 'dashboard'
  | 'dynamic'
  | 'stress-css'
  | 'stress-dom'

export type BenchmarkAdapterId =
  | 'master-runtime'
  | 'master-static'
  | 'master-progressive'
  | 'tailwind-cli'
  | 'tailwind-vite'
  | 'browser-css'
  | 'browser-dom'

export type BenchmarkSuiteId =
  | 'docs-page-css-size'
  | 'report-smoke'
  | 'build-diagnostics'
  | 'extraction-diagnostics'
  | 'compiler-diagnostics'
  | 'startup-diagnostics'
  | 'css-output-size'
  | 'css-structure'
  | 'build-performance'
  | 'master-delivery-modes'
  | 'progressive-hydration-diagnostics'
  | 'browser-css-cost'
  | 'browser-lifecycle'
  | 'interaction-cost'
  | 'runtime-mutation-diagnostics'
  | 'runtime-style-invalidation-diagnostics'

export type BenchmarkMetricUnit = 'B' | 'ms' | 'count' | 'ratio' | 'percent' | 'score'

export interface BenchmarkFixture {
  id: BenchmarkFixtureId
  name: string
  purpose: string
  stress: string
  suites: BenchmarkSuiteId[]
  limits: string[]
}

export interface BenchmarkAdapter {
  id: BenchmarkAdapterId
  name: string
  family: 'master-css' | 'tailwind-css' | 'browser'
}

export interface BenchmarkEnvironment {
  os: {
    platform: string
    release: string
    arch: string
  }
  node: string
  cpu: {
    model: string
    count: number
  }
}

export interface BenchmarkPackage {
  name: string
  version: string
}

export interface BenchmarkBrowser {
  name: string
  version: string
}

export interface ByteSummary {
  rawBytes: number
  gzipBytes: number
  brotliBytes: number
}

export interface BenchmarkArtifact extends ByteSummary {
  path: string
  sha256: string
}

export interface BenchmarkVariant {
  id: string
  fixtureId: BenchmarkFixtureId
  adapterId: BenchmarkAdapterId
  label: string
  limits?: string[]
}

export interface BenchmarkMetric {
  id: string
  label: string
  unit: BenchmarkMetricUnit
  description?: string
}

export interface BenchmarkSample {
  metricId: string
  variantId: string
  value: number
  round: number
}

export interface BenchmarkSummary {
  metricId: string
  variantId: string
  unit: BenchmarkMetricUnit
  min: number
  median: number
  mean: number
  max: number
  sampleCount: number
}

export interface BenchmarkReport {
  schemaVersion: 1
  suite: BenchmarkSuiteId
  generatedAt: string
  environment: BenchmarkEnvironment
  browser?: BenchmarkBrowser
  packages: BenchmarkPackage[]
  fixtures: BenchmarkFixture[]
  adapters: BenchmarkAdapter[]
  variants: BenchmarkVariant[]
  metrics: BenchmarkMetric[]
  samples: BenchmarkSample[]
  summary: BenchmarkSummary[]
  limits: string[]
  artifacts: BenchmarkArtifact[]
}
