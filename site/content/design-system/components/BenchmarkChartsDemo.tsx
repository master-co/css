import {
  BenchmarkBars,
  BenchmarkChartGroup,
  BenchmarkDataTable,
  BenchmarkSource,
  BenchmarkDelta,
  BenchmarkFigure,
  BenchmarkMetrics,
  BenchmarkSampleSummary,
  BenchmarkStackedBars
} from '~/site/components/benchmarks'
import { outputItems, payloadItems, metrics, traceItems, deltaItems, sampleSummary } from './benchmark-examples'

export default function BenchmarkChartsDemo() {
  return (
    <div className="benchmark-gallery" data-benchmark-gallery="true">
      <BenchmarkFigure
        title="Ranking bars"
        description="Sample data for comparing one metric across fixtures. Bar lengths share a common zero and maximum."
        caption="Illustrative values for the component.">
        <BenchmarkBars items={outputItems} unit="kB" />
      </BenchmarkFigure>

      <BenchmarkFigure
        title="Stacked payload bars"
        description="Each row fills its own width to show composition. Compare the printed totals to compare payload size."
        caption="Illustrative values and totals for the component.">
        <BenchmarkStackedBars items={payloadItems} unit="kB" />
      </BenchmarkFigure>

      <BenchmarkFigure
        title="Metric summary"
        description="Sample data for dense benchmark summaries.">
        <BenchmarkMetrics metrics={metrics} />
      </BenchmarkFigure>

      <BenchmarkFigure title="Readable labels and zero values" description="Labels wrap in the available column. A zero value has no colored fill.">
        <BenchmarkChartGroup title="Local trace" detail="Illustrative values" items={traceItems} />
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
        <div className="display:flex flex-wrap:wrap gap-xs">
          {deltaItems.map(delta => <BenchmarkDelta key={delta.label} {...delta} />)}
        </div>
      </BenchmarkFigure>

      <BenchmarkFigure
        title="Sample summary"
        description="Sample data for raw benchmark rounds.">
        <BenchmarkSampleSummary {...sampleSummary} />
      </BenchmarkFigure>
    </div>
  )
}
