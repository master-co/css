import Demo from 'internal/components/Demo'

type WaterfallBar = {
    label: string
    start: number
    end: number
    tone: keyof typeof toneClasses
}

type WaterfallRow = {
    resource: string
    bars: WaterfallBar[]
}

type WaterfallScenario = {
    title: string
    summary: string
    metric: {
        label: string
        position: number
    }
    rows: WaterfallRow[]
}

const toneClasses = {
    document: 'bg:neutral fg:white',
    stylesheet: 'bg:blue fg:white',
    runtime: 'bg:orange fg:black',
    manifest: 'bg:green fg:black'
} as const

const ticks = [0, 25, 50, 75, 100]

const scenarios: WaterfallScenario[] = [
    {
        title: 'Without preload',
        summary: 'The runtime script starts late, then fetches the manifest.',
        metric: { label: 'FCP', position: 98 },
        rows: [
            {
                resource: 'HTML',
                bars: [{ label: 'Parse', start: 0, end: 28, tone: 'document' }]
            },
            {
                resource: 'base.css',
                bars: [{ label: 'Download', start: 18, end: 58, tone: 'stylesheet' }]
            },
            {
                resource: 'Runtime script',
                bars: [{ label: 'Download', start: 58, end: 82, tone: 'runtime' }]
            },
            {
                resource: 'Default manifest JSON',
                bars: [{ label: 'Late', start: 82, end: 98, tone: 'manifest' }]
            }
        ]
    },
    {
        title: 'With preload',
        summary: 'The runtime script and manifest start early, so first paint can move earlier.',
        metric: { label: 'FCP', position: 60 },
        rows: [
            {
                resource: 'HTML',
                bars: [{ label: 'Parse', start: 0, end: 28, tone: 'document' }]
            },
            {
                resource: 'base.css',
                bars: [{ label: 'Download', start: 18, end: 58, tone: 'stylesheet' }]
            },
            {
                resource: 'Runtime script',
                bars: [{ label: 'Preload early', start: 12, end: 48, tone: 'runtime' }]
            },
            {
                resource: 'Default manifest JSON',
                bars: [{ label: 'Preload early', start: 16, end: 52, tone: 'manifest' }]
            }
        ]
    }
]

export default function ResourceWaterfall() {
    return (
        <figure>
            <Demo $px={0} $py={0}>
                <div
                    className="overflow-x:auto w:full"
                    role="img"
                    aria-label="Conceptual waterfall comparing late runtime discovery with preloaded runtime script and default manifest requests, with FCP markers"
                >
                    <div style={{ boxSizing: 'border-box', minWidth: '32rem' }}>
                        <div className="grid-cols:1 gap:md">
                            {scenarios.map((scenario) => (
                                <section key={scenario.title} className="p:md b:1px|solid|base r:lg surface:base">
                                    <header className="mb:sm">
                                        <h3 className="m:0 font:semibold font:sm text:neutral">{scenario.title}</h3>
                                        <p className="mx:0 mb:0 mt:3xs font:2xs text:gray">{scenario.summary}</p>
                                    </header>
                                    <div className="grid gap:2xs" style={{ gridTemplateColumns: '8rem minmax(0, 1fr)' }}>
                                        <div />
                                        <div className="rel font:2xs text:gray" style={{ height: '1.5rem' }} aria-hidden="true">
                                            <span className="abs left:0 top:0">Earlier</span>
                                            <span className="abs right:0 top:0">Later</span>
                                            <MetricLine metric={scenario.metric} />
                                            <span className="abs bottom:0 left:0 right:0 h:1px bg:line-muted" />
                                        </div>
                                        {scenario.rows.map((row) => (
                                            <WaterfallRow key={row.resource} row={row} metric={scenario.metric} />
                                        ))}
                                        <div />
                                        <div className="rel font:2xs" style={{ height: '1.25rem' }}>
                                            <MetricLabel metric={scenario.metric} />
                                        </div>
                                    </div>
                                </section>
                            ))}
                        </div>
                    </div>
                </div>
            </Demo>
            <figcaption className="sr-only">
                Conceptual request timing for critical runtime resources. The FCP marker is illustrative and shows when first paint can happen after the stylesheet, runtime script, and manifest are ready.
            </figcaption>
        </figure>
    )
}

function WaterfallRow({ row, metric }: { row: WaterfallRow, metric: WaterfallScenario['metric'] }) {
    return (
        <>
            <div className="flex items-center min-w:0 font:2xs font:medium text:neutral">{row.resource}</div>
            <div className="rel overflow:hidden surface:muted" style={{ height: '2rem' }}>
                <TimelineTicks />
                <MetricLine metric={metric} />
                {row.bars.map((bar) => (
                    <div
                        key={bar.label}
                        className={`abs top:50% px:2xs flex align-items:center font:2xs font:medium line-height:1 white-space:nowrap overflow:hidden ${toneClasses[bar.tone]}`}
                        style={{
                            height: '1.25rem',
                            left: `${bar.start}%`,
                            width: `${bar.end - bar.start}%`,
                            transform: 'translateY(-50%)'
                        }}
                    >
                        {bar.label}
                    </div>
                ))}
            </div>
        </>
    )
}

function MetricLine({ metric }: { metric: WaterfallScenario['metric'] }) {
    return (
        <span
            aria-hidden="true"
            className="abs bottom:0 top:0 z:1 text:orange"
            style={{
                borderLeft: '1px dashed currentColor',
                left: `${metric.position}%`
            }}
        />
    )
}

function MetricLabel({ metric }: { metric: WaterfallScenario['metric'] }) {
    return (
        <span
            className="abs font:2xs font:semibold text:orange"
            style={{
                left: `${metric.position}%`,
                transform: metric.position > 85 ? 'translateX(-100%)' : 'translateX(-50%)'
            }}
        >
            {metric.label}
        </span>
    )
}

function TimelineTicks() {
    return (
        <>
            {ticks.map((tick) => (
                <span
                    key={tick}
                    aria-hidden="true"
                    className="abs bottom:0 top:0 w:1px bg:line-muted"
                    style={{ left: `${tick}%` }}
                />
            ))}
        </>
    )
}
