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
    rows: WaterfallRow[]
}

const toneClasses = {
    document: 'bg:neutral text:white',
    stylesheet: 'bg:blue text:white',
    runtime: 'bg:orange text:black',
    manifest: 'bg:green text:black',
    reuse: 'b:1px|dashed|green-50 bg:green-10 text:green-70 bg:green-90@dark text:green-20@dark'
} as const

const ticks = [0, 25, 50, 75, 100]

const scenarios: WaterfallScenario[] = [
    {
        title: 'Without preload',
        summary: 'The runtime waits until it starts before fetching the manifest.',
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
        summary: 'The manifest starts early and is ready when the runtime asks for it.',
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
                bars: [
                    { label: 'Preload early', start: 12, end: 50, tone: 'manifest' },
                    { label: 'Reuse', start: 82, end: 94, tone: 'reuse' }
                ]
            }
        ]
    }
]

export default function ResourceWaterfall() {
    return (
        <figure className="my:lg">
            <Demo $px={0} $py={0} className="overflow:hidden">
                <div
                    className="overflow-x:auto w:full"
                    role="img"
                    aria-label="Conceptual waterfall showing default manifest preload compared with late runtime discovery"
                >
                    <div className="p:md" style={{ boxSizing: 'border-box', minWidth: '32rem' }}>
                        <div className="gap:md grid-cols:1">
                            {scenarios.map((scenario) => (
                                <section key={scenario.title} className="b:1px|solid|gray-20 p:md r:lg bg:surface b:1px|solid|gray-70@dark">
                                    <header className="mb:sm">
                                        <h3 className="m:0 font:semibold font:sm text:neutral">{scenario.title}</h3>
                                        <p className="m:0 font:2xs mt:3xs text:gray">{scenario.summary}</p>
                                    </header>
                                    <div className="grid gap:xs" style={{ gridTemplateColumns: '8rem minmax(0, 1fr)' }}>
                                        <div />
                                        <div className="rel font:2xs text:gray" style={{ height: '1.5rem' }} aria-hidden="true">
                                            <span className="abs left:0 top:0">Earlier</span>
                                            <span className="abs right:0 top:0">Later</span>
                                            <span className="abs bg:gray-20 bottom:0 h:1px left:0 right:0 bg:gray-60@dark" />
                                        </div>
                                        {scenario.rows.map((row) => (
                                            <WaterfallRow key={row.resource} row={row} />
                                        ))}
                                    </div>
                                </section>
                            ))}
                        </div>
                    </div>
                </div>
            </Demo>
            <figcaption>
                Conceptual request waterfall for the CDN runtime default manifest. Bar positions show relative discovery and reuse timing, not measured network data.
            </figcaption>
        </figure>
    )
}

function WaterfallRow({ row }: { row: WaterfallRow }) {
    return (
        <>
            <div className="flex align-items:center font:2xs font:medium min-w:0 text:neutral">{row.resource}</div>
            <div className="rel overflow:hidden r:md bg:gray-5 bg:gray-80@dark" style={{ height: '2.5rem' }}>
                <TimelineTicks />
                {row.bars.map((bar) => (
                    <div
                        key={bar.label}
                        className={`abs top:50% r:sm px:xs flex align-items:center font:2xs font:medium line-height:1 white-space:nowrap overflow:hidden ${toneClasses[bar.tone]}`}
                        style={{
                            height: '1.5rem',
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

function TimelineTicks() {
    return (
        <>
            {ticks.map((tick) => (
                <span
                    key={tick}
                    aria-hidden="true"
                    className="abs bg:gray-20 bottom:0 top:0 w:1px bg:gray-60@dark"
                    style={{ left: `${tick}%` }}
                />
            ))}
        </>
    )
}
