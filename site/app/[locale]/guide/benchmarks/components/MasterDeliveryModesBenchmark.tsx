import snapshot from '~/site/../benchmarks/master-delivery-modes/snapshot.json'
import {
    BenchmarkBars,
    BenchmarkMetricTable,
    BenchmarkStackedBars,
    type BenchmarkBarItem,
    type BenchmarkColor,
    type BenchmarkMetric,
    type BenchmarkSegment,
    type BenchmarkStackedBarItem
} from '~/site/components/benchmarks'
import ExpandContent from 'internal/components/ExpandContent'

type ModeId = 'master-static' | 'master-runtime' | 'master-progressive' | 'tailwind-static'
type TimingMetricId =
    | 'navigationReadyMs'
    | 'styleRecalculationMs'
    | 'layoutMs'
    | 'paintMs'
    | 'runtimeBootstrapMs'
    | 'runtimeObserveMs'

type ByteSummary = {
    rawBytes: number
    gzipBytes: number
    brotliBytes: number
}

type SummaryStats = {
    min: number
    median: number
    mean: number
    max: number
    sampleCount: number
    unit: string
}

type DeliveryModeResult = {
    variantId: string
    payload: {
        html: ByteSummary
        externalCSS: ByteSummary
        inlineCSS: ByteSummary
        runtimeJS: ByteSummary
        manifestJSON: ByteSummary
        hydrationManifest: ByteSummary
    }
    structure: {
        styleRules: number
        selectors: number
        declarations: number
    }
    timing: {
        navigationReadyMs: SummaryStats
        stylesheetParseMs: SummaryStats
        styleRecalculationMs: SummaryStats
        layoutMs: SummaryStats
        paintMs: SummaryStats
        longTaskCount: SummaryStats
        requestCount: SummaryStats
        runtimeReadyMs: SummaryStats
        runtimeBootstrapMs: SummaryStats
        manifestLoadMs: SummaryStats
        runtimeObserveMs: SummaryStats
        progressiveAdopted: SummaryStats
        runtimeGeneratedRuleCount: SummaryStats
        runtimeStyleRawBytes: SummaryStats
    }
}

type DeliveryModeFixtureResult = {
    fixtureId: string
    modes: Record<ModeId, DeliveryModeResult>
}

type DeliveryModeDescriptor = {
    id: ModeId
    label: string
    family: string
}

type FixtureDescriptor = {
    id: string
    name: string
    purpose: string
}

const primaryFixtureId = 'docs'
const browser = (snapshot as { browser?: { name: string; version: string } }).browser
const fixtures = snapshot.fixtures as FixtureDescriptor[]
const modes = snapshot.modes as DeliveryModeDescriptor[]
const results = snapshot.results as DeliveryModeFixtureResult[]
const modeColors: Record<ModeId, BenchmarkColor> = {
    'master-static': 'yellow',
    'master-runtime': 'blue',
    'master-progressive': 'green',
    'tailwind-static': 'cyan'
}
const payloadSegments = [
    {
        id: 'html',
        label: 'HTML',
        color: 'blue'
    },
    {
        id: 'externalCSS',
        label: 'External CSS',
        color: 'cyan'
    },
    {
        id: 'inlineCSS',
        label: 'Inline CSS',
        color: 'yellow'
    },
    {
        id: 'runtimeJS',
        label: 'Runtime JS',
        color: 'green'
    },
    {
        id: 'manifestJSON',
        label: 'Manifest JSON',
        color: 'red'
    },
    {
        id: 'hydrationManifest',
        label: 'Hydration manifest',
        color: 'yellow'
    }
] satisfies { id: keyof DeliveryModeResult['payload']; label: string; color: BenchmarkColor }[]
const loadMetricLabels: Record<TimingMetricId, string> = {
    navigationReadyMs: 'Navigation to ready',
    styleRecalculationMs: 'Style recalculation',
    layoutMs: 'Layout',
    paintMs: 'Paint',
    runtimeBootstrapMs: 'Runtime bootstrap',
    runtimeObserveMs: 'Runtime observe'
}

function getPrimaryResult() {
    const result = results.find((candidate) => candidate.fixtureId === primaryFixtureId)
    if (!result) throw new Error(`Missing delivery mode benchmark fixture result: ${primaryFixtureId}`)
    return result
}

function getFixtureName(fixtureId: string) {
    return fixtures.find((fixture) => fixture.id === fixtureId)?.name ?? fixtureId
}

function getModeLabel(modeId: ModeId) {
    return modes.find((mode) => mode.id === modeId)?.label ?? modeId
}

function formatBytes(bytes: number) {
    return `${formatNumber(bytes / 1000, 1)} kB`
}

function formatMilliseconds(value: number) {
    return `${formatNumber(value, value >= 10 ? 1 : 2)} ms`
}

function formatCount(value: number) {
    return Math.round(value).toLocaleString('en-US')
}

function formatNumber(value: number, maximumFractionDigits: number) {
    return new Intl.NumberFormat('en-US', {
        maximumFractionDigits
    }).format(value)
}

function getPayloadTotal(payload: DeliveryModeResult['payload'], kind: keyof ByteSummary = 'brotliBytes') {
    return Object.values(payload).reduce((total, summary) => total + summary[kind], 0)
}

function createSummaryMetrics(): BenchmarkMetric[] {
    const primaryResult = getPrimaryResult()
    const sampleCount = primaryResult.modes['master-static'].timing.navigationReadyMs.sampleCount
    const progressiveAdoptedCount = results.filter((result) => result.modes['master-progressive'].timing.progressiveAdopted.median === 1).length

    return [
        {
            label: 'Fixtures',
            value: results.length,
            detail: 'static fixture set measured across every delivery mode',
            tone: 'neutral'
        },
        {
            label: 'Modes',
            value: modes.length,
            detail: 'Master static, runtime, progressive, and Tailwind static',
            tone: 'neutral'
        },
        {
            label: 'Browser',
            value: browser ? `${browser.name} ${browser.version}` : 'Chromium',
            detail: 'headless browser used for local trace measurements',
            tone: 'neutral'
        },
        {
            label: 'Trace samples',
            value: sampleCount,
            detail: 'measured browser rounds per variant',
            tone: 'neutral'
        },
        {
            label: 'Progressive adoption',
            value: `${progressiveAdoptedCount}/${results.length}`,
            detail: 'fixtures where progressive runtime adopted server-rendered CSS',
            tone: progressiveAdoptedCount === results.length ? 'good' : 'warn'
        }
    ]
}

function createPayloadItems(result = getPrimaryResult()): BenchmarkStackedBarItem[] {
    return modes.map((mode) => {
        const modeResult = result.modes[mode.id]
        const segments = payloadSegments
            .map((segment): BenchmarkSegment => {
                const value = modeResult.payload[segment.id].brotliBytes
                return {
                    id: `${mode.id}-${segment.id}`,
                    label: segment.label,
                    value,
                    valueLabel: formatBytes(value),
                    color: segment.color
                }
            })
            .filter((segment) => segment.value > 0)

        return {
            id: `${result.fixtureId}-${mode.id}-payload`,
            label: mode.label,
            segments,
            total: getPayloadTotal(modeResult.payload),
            detail: `${formatCount(modeResult.timing.requestCount.median)} requests`
        }
    })
}

function createTimingItems(metricId: TimingMetricId, modeIds: ModeId[] = modes.map((mode) => mode.id)): BenchmarkBarItem[] {
    const result = getPrimaryResult()

    return modeIds.map((modeId) => {
        const modeResult = result.modes[modeId]
        const metric = modeResult.timing[metricId]

        return {
            id: `${result.fixtureId}-${modeId}-${metricId}`,
            label: getModeLabel(modeId),
            value: metric.median,
            valueLabel: formatMilliseconds(metric.median),
            detail: metric.sampleCount ? `${metric.sampleCount} samples` : undefined,
            color: modeColors[modeId]
        }
    })
}

function TimingMetricGroup(props: {
    title: string
    items: BenchmarkBarItem[]
}) {
    return (
        <div className="grid gap:sm">
            <div className="flex items-baseline justify-between gap:md">
                <h4 className="m:0 font-weight:460 font:sm text:strong">{props.title}</h4>
                <span className="font:xs text:muted">Median</span>
            </div>
            <BenchmarkBars items={props.items} unit="ms" />
        </div>
    )
}

export function MasterDeliveryModesSummary() {
    return <BenchmarkMetricTable metrics={createSummaryMetrics()} />
}

export function MasterDeliveryPayloadChart() {
    return <BenchmarkStackedBars items={createPayloadItems()} valueFormatter={formatBytes} />
}

export function MasterDeliveryLoadChart() {
    return (
        <div className="grid gap:lg">
            {(['navigationReadyMs', 'styleRecalculationMs', 'layoutMs', 'paintMs'] satisfies TimingMetricId[]).map((metricId) => (
                <TimingMetricGroup
                    key={metricId}
                    title={loadMetricLabels[metricId]}
                    items={createTimingItems(metricId)} />
            ))}
        </div>
    )
}

export function MasterDeliveryRuntimeChart() {
    const runtimeModeIds = ['master-runtime', 'master-progressive'] satisfies ModeId[]

    return (
        <div className="grid gap:lg">
            {(['runtimeBootstrapMs', 'runtimeObserveMs'] satisfies TimingMetricId[]).map((metricId) => (
                <TimingMetricGroup
                    key={metricId}
                    title={loadMetricLabels[metricId]}
                    items={createTimingItems(metricId, runtimeModeIds)} />
            ))}
        </div>
    )
}

export function MasterDeliveryModesTables() {
    return (
        <ExpandContent>
            <div className="doc-table">
                <table>
                    <thead>
                        <tr>
                            <th>Fixture</th>
                            <th>Mode</th>
                            <th>Payload</th>
                            <th>HTML</th>
                            <th>External CSS</th>
                            <th>Inline CSS</th>
                            <th>Runtime JS</th>
                            <th>Manifest JSON</th>
                            <th>Hydration manifest</th>
                            <th>Rules</th>
                            <th>Declarations</th>
                            <th>Navigation ready</th>
                            <th>Style recalc</th>
                            <th>Layout</th>
                            <th>Paint</th>
                            <th>Runtime bootstrap</th>
                            <th>Runtime observe</th>
                            <th>Progressive adopted</th>
                        </tr>
                    </thead>
                    <tbody>
                        {results.flatMap((result) => modes.map((mode) => {
                            const modeResult = result.modes[mode.id]

                            return (
                                <tr key={`${result.fixtureId}-${mode.id}`}>
                                    <th>{getFixtureName(result.fixtureId)}</th>
                                    <td>{mode.label}</td>
                                    <td>{formatBytes(getPayloadTotal(modeResult.payload))}</td>
                                    <td>{formatBytes(modeResult.payload.html.brotliBytes)}</td>
                                    <td>{formatBytes(modeResult.payload.externalCSS.brotliBytes)}</td>
                                    <td>{formatBytes(modeResult.payload.inlineCSS.brotliBytes)}</td>
                                    <td>{formatBytes(modeResult.payload.runtimeJS.brotliBytes)}</td>
                                    <td>{formatBytes(modeResult.payload.manifestJSON.brotliBytes)}</td>
                                    <td>{formatBytes(modeResult.payload.hydrationManifest.brotliBytes)}</td>
                                    <td>{formatCount(modeResult.structure.styleRules)}</td>
                                    <td>{formatCount(modeResult.structure.declarations)}</td>
                                    <td>{formatMilliseconds(modeResult.timing.navigationReadyMs.median)}</td>
                                    <td>{formatMilliseconds(modeResult.timing.styleRecalculationMs.median)}</td>
                                    <td>{formatMilliseconds(modeResult.timing.layoutMs.median)}</td>
                                    <td>{formatMilliseconds(modeResult.timing.paintMs.median)}</td>
                                    <td>{formatMilliseconds(modeResult.timing.runtimeBootstrapMs.median)}</td>
                                    <td>{formatMilliseconds(modeResult.timing.runtimeObserveMs.median)}</td>
                                    <td>{formatCount(modeResult.timing.progressiveAdopted.median)}</td>
                                </tr>
                            )
                        }))}
                    </tbody>
                </table>
            </div>
        </ExpandContent>
    )
}
