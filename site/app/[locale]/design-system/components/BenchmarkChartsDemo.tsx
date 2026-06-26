import {
    BenchmarkBars,
    BenchmarkDelta,
    BenchmarkFigure,
    BenchmarkMetricTable,
    BenchmarkSampleSummary,
    BenchmarkStackedBars,
    type BenchmarkBarItem,
    type BenchmarkMetric,
    type BenchmarkStackedBarItem
} from '~/site/components/benchmarks'

const outputItems: BenchmarkBarItem[] = [
    {
        id: 'master-static',
        label: 'Master CSS static',
        value: 18.4,
        detail: 'baseline',
        color: 'yellow'
    },
    {
        id: 'master-progressive',
        label: 'Master CSS progressive',
        value: 21.8,
        detail: '+18%',
        color: 'green'
    },
    {
        id: 'tailwind-vite',
        label: 'Tailwind CSS Vite',
        value: 34.2,
        detail: '1.9x',
        color: 'cyan'
    },
    {
        id: 'tailwind-cli',
        label: 'Tailwind CSS CLI',
        value: 38.6,
        detail: '2.1x',
        color: 'blue'
    }
]

const payloadItems: BenchmarkStackedBarItem[] = [
    {
        id: 'runtime',
        label: 'Runtime',
        segments: [
            { id: 'css', label: 'CSS', value: 8.6, color: 'yellow' },
            { id: 'runtime-js', label: 'Runtime JS', value: 14.2, color: 'blue' },
            { id: 'manifest', label: 'Manifest', value: 5.4, color: 'cyan' }
        ],
        detail: 'first visit'
    },
    {
        id: 'static',
        label: 'Static',
        segments: [
            { id: 'css', label: 'CSS', value: 18.4, color: 'yellow' },
            { id: 'runtime-js', label: 'Runtime JS', value: 0, color: 'blue' },
            { id: 'manifest', label: 'Manifest', value: 0, color: 'cyan' }
        ],
        detail: 'cached CSS'
    },
    {
        id: 'progressive',
        label: 'Progressive',
        segments: [
            { id: 'css', label: 'CSS', value: 6.1, color: 'yellow' },
            { id: 'runtime-js', label: 'Runtime JS', value: 14.2, color: 'blue' },
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
        <div className="grid gap:xl">
            <BenchmarkFigure
                title="Ranking bars"
                description="Sample data for comparing one metric across adapters."
                caption="Fake design-system sample data. Not a benchmark result.">
                <BenchmarkBars items={outputItems} unit="kB" />
            </BenchmarkFigure>

            <BenchmarkFigure
                title="Stacked payload bars"
                description="Sample data for CSS, runtime, and manifest payload breakdowns."
                caption="Fake design-system sample data. Totals are intentionally illustrative.">
                <BenchmarkStackedBars items={payloadItems} unit="kB" />
            </BenchmarkFigure>

            <BenchmarkFigure
                title="Metric table"
                description="Sample data for dense benchmark summaries.">
                <BenchmarkMetricTable metrics={metrics} />
            </BenchmarkFigure>

            <BenchmarkFigure
                title="Delta labels"
                description="Sample data for compact comparison badges.">
                <div className="flex flex-wrap gap:xs">
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
