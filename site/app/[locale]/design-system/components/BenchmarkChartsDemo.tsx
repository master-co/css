import {
  BenchmarkBars,
  BenchmarkChartGroup,
  BenchmarkDataTable,
  BenchmarkSource,
  BenchmarkDelta,
  BenchmarkFigure,
  BenchmarkMetrics,
  BenchmarkSampleSummary,
  BenchmarkStackedBars,
  type BenchmarkBarItem,
  type BenchmarkMetric,
  type BenchmarkStackedBarItem
} from '~/site/components/benchmarks'

const outputItems: BenchmarkBarItem[] = [
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

const payloadItems: BenchmarkStackedBarItem[] = [
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

const metrics: BenchmarkMetric[] = [
  { label: 'Fixture', value: 'dashboard' },
  { label: 'Median build', value: '148 ms', tone: 'good', detail: '10 measured rounds' },
  { label: 'Warm rebuild', value: '28 ms', tone: 'good', detail: 'single class edit' },
  { label: 'Generated rules', value: '1,284', detail: 'after pruning' },
  { label: 'Long tasks', value: '0', tone: 'good', detail: 'Chromium trace sample' }
]

export default function BenchmarkChartsDemo() {
  return (
    <div className="benchmark-gallery" data-benchmark-gallery="true">
      <BenchmarkFigure
        title="Ranking bars"
        description="Sample data for comparing one metric across fixtures. Bar lengths share a common zero and maximum."
        caption="Fake design-system sample data. Not a benchmark result.">
        <BenchmarkBars items={outputItems} unit="kB" />
      </BenchmarkFigure>

      <BenchmarkFigure
        title="Stacked payload bars"
        description="Each row fills its own width to show composition. Compare the printed totals to compare payload size."
        caption="Fake design-system sample data. Totals are intentionally illustrative.">
        <BenchmarkStackedBars items={payloadItems} unit="kB" />
      </BenchmarkFigure>

      <BenchmarkFigure
        title="Metric summary"
        description="Sample data for dense benchmark summaries.">
        <BenchmarkMetrics metrics={metrics} />
      </BenchmarkFigure>

      <BenchmarkFigure title="Readable labels and zero values" description="Labels wrap in the available column. A zero value has no colored fill.">
        <BenchmarkChartGroup title="Local trace" detail="Illustrative values" items={[
          { id: 'long-label', label: 'A deliberately long scenario name that remains readable on a narrow screen', value: 12.5, detail: '3 samples', color: 'blue' },
          { id: 'no-work', label: 'No recorded work', value: 0, detail: '3 samples', color: 'violet' },
        ]} />
      </BenchmarkFigure>

      <BenchmarkDataTable title="Illustrative measurements by fixture">
        <table>
          <thead><tr><th scope="col">Fixture</th><th scope="col">Raw CSS</th><th scope="col">Brotli CSS</th><th scope="col">Build median</th><th scope="col">Samples</th><th scope="col">Environment</th></tr></thead>
          <tbody>{outputItems.map(item => <tr key={item.id}><th scope="row">{item.label}</th><td>100 kB</td><td>{item.value} kB</td><td>148 ms</td><td>10</td><td>Illustrative local fixture</td></tr>)}</tbody>
        </table>
      </BenchmarkDataTable>
      <BenchmarkSource generatedAt="2026-07-01T00:00:00Z" href="/guide/benchmarks" label="See real benchmark sources (this date is illustrative)" />

      <BenchmarkFigure
        title="Delta labels"
        description="Sample data for compact comparison badges.">
        <div className="flex flex-wrap gap-xs">
          <BenchmarkDelta tone="good" value="-38%" label="CSS bytes" />
          <BenchmarkDelta tone="warn" value="+12%" label="build time" />
          <BenchmarkDelta tone="bad" value="+42 ms" label="style calc" />
          <BenchmarkDelta value="baseline" label="current" />
        </div>
      </BenchmarkFigure>

      <BenchmarkFigure
        title="Sample summary"
        description="Sample data for raw benchmark rounds.">
        <BenchmarkSampleSummary
          min={14.2}
          median={16.8}
          mean={17.1}
          max={22.4}
          sampleCount={25}
          unit="ms" />
      </BenchmarkFigure>
    </div>
  )
}
