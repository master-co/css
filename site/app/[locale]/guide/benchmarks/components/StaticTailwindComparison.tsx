import snapshot from '~/site/../benchmarks/tailwind-static-comparison/snapshot.json'
import { BenchmarkBars, BenchmarkMetricTable, type BenchmarkBarItem, type BenchmarkColor, type BenchmarkMetric } from '~/site/components/benchmarks'
import ExpandContent from 'internal/components/ExpandContent'

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
        color: 'blue'
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

function createCssBarItems(result: FixtureResult): BenchmarkBarItem[] {
    return primaryVariants.map((variant) => {
        const value = result.variants[variant.id].css.brotliBytes
        return {
            id: `${result.fixtureId}-${variant.id}-css`,
            label: variant.label,
            value: value / 1000,
            valueLabel: formatKilobytes(value),
            color: variant.color
        }
    })
}

function createBuildBarItems(result: FixtureResult): BenchmarkBarItem[] {
    return primaryVariants.map((variant) => {
        const value = result.variants[variant.id].build.coldMedianMs
        return {
            id: `${result.fixtureId}-${variant.id}-build`,
            label: variant.label,
            value,
            valueLabel: formatMilliseconds(value),
            color: variant.color
        }
    })
}

function createDeclarationBarItems(result: FixtureResult): BenchmarkBarItem[] {
    return primaryVariants.map((variant) => {
        const value = result.variants[variant.id].structure.declarations
        return {
            id: `${result.fixtureId}-${variant.id}-declarations`,
            label: variant.label,
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

export function StaticComparisonSummary() {
    return <BenchmarkMetricTable metrics={createSummaryMetrics()} />
}

export function StaticCSSOutputChart() {
    return <BenchmarkBars items={createCssBarItems(getPrimaryResult())} unit="kB" />
}

export function StaticBuildChart() {
    return <BenchmarkBars items={createBuildBarItems(getPrimaryResult())} unit="ms" />
}

export function StaticStructureChart() {
    return <BenchmarkBars items={createDeclarationBarItems(getPrimaryResult())} unit="count" />
}

export function StaticCSSBytesTable() {
    return (
        <ExpandContent>
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
        </ExpandContent>
    )
}

export function StaticBuildTable() {
    return (
        <ExpandContent>
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
        </ExpandContent>
    )
}

export function StaticStructureTable() {
    return (
        <ExpandContent>
            <div className="doc-table">
                <table>
                    <thead>
                        <tr>
                            <th>Fixture</th>
                            <th>Variant</th>
                            <th>Rules</th>
                            <th>Selectors</th>
                            <th>Declarations</th>
                            <th>Custom properties</th>
                            <th>At-rules</th>
                            <th>Layer blocks</th>
                            <th>Unlayered rules</th>
                            <th>Combinators</th>
                            <th>Max specificity</th>
                            <th>Max complexity</th>
                        </tr>
                    </thead>
                    <tbody>
                        {results.flatMap((result) => variants.map((variant) => {
                            const value = result.variants[variant.id].structure
                            return (
                                <tr key={`${result.fixtureId}-${variant.id}-structure-row`}>
                                    <th>{getFixtureName(result.fixtureId)}</th>
                                    <td>{variant.label}</td>
                                    <td>{formatCount(value.styleRules)}</td>
                                    <td>{formatCount(value.selectors)}</td>
                                    <td>{formatCount(value.declarations)}</td>
                                    <td>{formatCount(value.customProperties)}</td>
                                    <td>{formatCount(value.atRules)}</td>
                                    <td>{formatCount(value.layerBlocks)}</td>
                                    <td>{formatCount(value.unlayeredStyleRules)}</td>
                                    <td>{formatCount(value.selectorCombinators)}</td>
                                    <td>{formatCount(value.maxSelectorSpecificityScore)}</td>
                                    <td>{formatCount(value.maxSelectorComplexityScore)}</td>
                                </tr>
                            )
                        }))}
                    </tbody>
                </table>
            </div>
        </ExpandContent>
    )
}
