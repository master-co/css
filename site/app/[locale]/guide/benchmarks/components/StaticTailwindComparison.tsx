import snapshot from '~/site/../benchmarks/tailwind-static-comparison/snapshot.json'
import { BenchmarkBars, BenchmarkFigure, BenchmarkMetricTable, type BenchmarkBarItem, type BenchmarkColor, type BenchmarkMetric } from '~/site/components/benchmarks'
import Link from 'internal/components/Link'

type VariantId = 'master-static-cli' | 'master-static-vite' | 'tailwind-cli' | 'tailwind-vite'

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
}

type FixtureResult = {
    fixtureId: string
    variants: Record<VariantId, VariantResult>
}

const variants = snapshot.variants as { id: VariantId; label: string }[]
const results = snapshot.results as FixtureResult[]

const variantColors: Record<VariantId, BenchmarkColor> = {
    'master-static-cli': 'yellow',
    'master-static-vite': 'green',
    'tailwind-cli': 'blue',
    'tailwind-vite': 'cyan'
}

const variantShortLabels: Record<VariantId, string> = {
    'master-static-cli': 'Master CLI',
    'master-static-vite': 'Master Vite',
    'tailwind-cli': 'Tailwind CLI',
    'tailwind-vite': 'Tailwind Vite'
}

function getFixtureName(fixtureId: string) {
    return snapshot.fixtures.find((fixture) => fixture.id === fixtureId)?.name ?? fixtureId
}

function formatKilobytes(bytes: number) {
    return `${(bytes / 1000).toFixed(1)} kB`
}

function formatMilliseconds(value: number) {
    return `${value.toFixed(value >= 100 ? 0 : 1)} ms`
}

function formatPercent(value: number) {
    return `${Math.round(value)}%`
}

function getBestVariant(result: FixtureResult, selector: (variant: VariantResult) => number) {
    return variants.reduce((best, variant) => {
        const value = selector(result.variants[variant.id])
        const bestValue = selector(result.variants[best.id])
        return value < bestValue ? variant : best
    }, variants[0])
}

function getComparedReduction(smaller: number, larger: number) {
    if (larger <= 0) return 'n/a'
    return formatPercent((1 - smaller / larger) * 100)
}

function createCssBarItems(result: FixtureResult): BenchmarkBarItem[] {
    return variants.map((variant) => {
        const value = result.variants[variant.id].css.brotliBytes
        return {
            id: `${result.fixtureId}-${variant.id}-css`,
            label: variantShortLabels[variant.id],
            value: value / 1000,
            valueLabel: formatKilobytes(value),
            color: variantColors[variant.id]
        }
    })
}

function createBuildBarItems(result: FixtureResult): BenchmarkBarItem[] {
    return variants.map((variant) => {
        const value = result.variants[variant.id].build.coldMedianMs
        return {
            id: `${result.fixtureId}-${variant.id}-build`,
            label: variantShortLabels[variant.id],
            value,
            valueLabel: formatMilliseconds(value),
            color: variantColors[variant.id]
        }
    })
}

function createSummaryMetrics(): BenchmarkMetric[] {
    const masterCliWins = results.filter((result) => getBestVariant(result, (variant) => variant.css.brotliBytes).id.startsWith('master')).length
    const tailwindCliBuildWins = results.filter((result) => getBestVariant(result, (variant) => variant.build.coldMedianMs).id === 'tailwind-cli').length
    const sampleCount = results[0]?.variants['master-static-cli'].build.sampleCount ?? 0

    return [
        {
            label: 'Fixtures',
            value: results.length
        },
        {
            label: 'CSS output',
            value: `${masterCliWins}/${results.length}`,
            detail: 'fixtures where a Master CSS static output is smallest by brotli bytes',
            tone: 'good'
        },
        {
            label: 'Build command',
            value: `${tailwindCliBuildWins}/${results.length}`,
            detail: 'fixtures where Tailwind CLI has the lowest cold production command median',
            tone: 'warn'
        },
        {
            label: 'Build samples',
            value: sampleCount,
            detail: 'measured command rounds per variant',
            tone: 'neutral'
        }
    ]
}

export default function StaticTailwindComparison() {
    return (
        <div className="grid gap:xl">
            <BenchmarkFigure
                title="Static comparison summary"
                description="Curated snapshot for generated CSS artifacts and full production command timing."
                caption={
                    <>
                        Snapshot generated from <code>css-output-size</code> and <code>build-performance</code> on {snapshot.environment.cpu.model}, Node {snapshot.environment.node}. View the committed <Link href="https://github.com/master-co/css/tree/rc/benchmarks/tailwind-static-comparison/snapshot.json">snapshot data</Link>.
                    </>
                }>
                <BenchmarkMetricTable metrics={createSummaryMetrics()} />
            </BenchmarkFigure>

            <BenchmarkFigure
                title="Brotli CSS output"
                description="Lower is smaller compressed CSS output. This is artifact size, not browser style cost.">
                <div className="grid grid-cols:1 gap:lg grid-cols:2@md">
                    {results.map((result) => {
                        const fixtureName = getFixtureName(result.fixtureId)
                        const masterBytes = result.variants['master-static-cli'].css.brotliBytes
                        const tailwindBytes = result.variants['tailwind-cli'].css.brotliBytes
                        return (
                            <section key={result.fixtureId} className="grid gap:sm">
                                <h4 className="m:0 font-weight:460 font:md text:strong">{fixtureName}</h4>
                                <BenchmarkBars items={createCssBarItems(result)} unit="kB" />
                                <p className="m:0 font:xs text:muted">
                                    Master CLI is {getComparedReduction(masterBytes, tailwindBytes)} smaller than Tailwind CLI by brotli bytes.
                                </p>
                            </section>
                        )
                    })}
                </div>
            </BenchmarkFigure>

            <BenchmarkFigure
                title="Cold production command"
                description="Lower is faster full command elapsed time. This includes tool startup and is not watch mode.">
                <div className="grid grid-cols:1 gap:lg grid-cols:2@md">
                    {results.map((result) => {
                        const fixtureName = getFixtureName(result.fixtureId)
                        return (
                            <section key={result.fixtureId} className="grid gap:sm">
                                <h4 className="m:0 font-weight:460 font:md text:strong">{fixtureName}</h4>
                                <BenchmarkBars items={createBuildBarItems(result)} unit="ms" />
                            </section>
                        )
                    })}
                </div>
            </BenchmarkFigure>

            <BenchmarkFigure
                title="CSS bytes table"
                description="Raw, gzip, and brotli byte counts for each generated CSS artifact.">
                <div className="doc-table">
                    <table>
                        <thead>
                            <tr>
                                <th>Fixture</th>
                                <th>Variant</th>
                                <th>Raw</th>
                                <th>Gzip</th>
                                <th>Brotli</th>
                                <th>Files</th>
                            </tr>
                        </thead>
                        <tbody>
                            {results.flatMap((result) => variants.map((variant) => {
                                const value = result.variants[variant.id].css
                                return (
                                    <tr key={`${result.fixtureId}-${variant.id}-css-row`}>
                                        <th>{getFixtureName(result.fixtureId)}</th>
                                        <td>{variant.label}</td>
                                        <td>{formatKilobytes(value.rawBytes)}</td>
                                        <td>{formatKilobytes(value.gzipBytes)}</td>
                                        <td>{formatKilobytes(value.brotliBytes)}</td>
                                        <td>{value.fileCount}</td>
                                    </tr>
                                )
                            }))}
                        </tbody>
                    </table>
                </div>
            </BenchmarkFigure>

            <BenchmarkFigure
                title="Production build table"
                description="Median elapsed time for cold and repeat production commands.">
                <div className="doc-table">
                    <table>
                        <thead>
                            <tr>
                                <th>Fixture</th>
                                <th>Variant</th>
                                <th>Cold median</th>
                                <th>Repeat median</th>
                                <th>Samples</th>
                            </tr>
                        </thead>
                        <tbody>
                            {results.flatMap((result) => variants.map((variant) => {
                                const value = result.variants[variant.id].build
                                return (
                                    <tr key={`${result.fixtureId}-${variant.id}-build-row`}>
                                        <th>{getFixtureName(result.fixtureId)}</th>
                                        <td>{variant.label}</td>
                                        <td>{formatMilliseconds(value.coldMedianMs)}</td>
                                        <td>{formatMilliseconds(value.repeatMedianMs)}</td>
                                        <td>{value.sampleCount}</td>
                                    </tr>
                                )
                            }))}
                        </tbody>
                    </table>
                </div>
            </BenchmarkFigure>
        </div>
    )
}
