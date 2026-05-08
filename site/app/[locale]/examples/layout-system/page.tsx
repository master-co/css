import {
    IconArrowUpRight,
    IconBell,
    IconChartBar,
    IconDots,
    IconLayoutSidebar,
    IconListCheck,
    IconSearch,
} from '@tabler/icons-react'

const metrics = [
    { label: 'Revenue', value: '$128.4k', delta: '+12.8%', color: 'bg:green' },
    { label: 'Activation', value: '64.2%', delta: '+4.1%', color: 'bg:blue' },
    { label: 'Pipeline', value: '38', delta: '+7', color: 'bg:amber' },
]

const navItems = ['Overview', 'Roadmap', 'Messages', 'Reports']
const bars = ['h:10x', 'h:16x', 'h:13x', 'h:20x', 'h:15x', 'h:24x', 'h:18x']
const tasks = [
    ['Audit onboarding', 'Today'],
    ['Review campaign grid', 'Thu'],
    ['Ship billing panel', 'Fri'],
]

export const dynamic = 'force-static'
export const revalidate = false

export default async function Page() {
    return (
        <main className="min-h:100dvh bg:base p:md p:lg@2xs">
            <section className="w:full max-w:screen-lg mx:auto grid-cols:4 grid-cols:8@2xs grid-cols:12@md gap:sm gap:md@2xs">
                <header className="grid-col-span:4 grid-col-span:8@2xs grid-col-span:12@md flex flex-col flex-row@2xs items-start items-center@2xs justify-between gap:sm bg:surface b:1|lightest shadow:xs r:lg p:md">
                    <div className="flex items-center gap:sm min-w:0">
                        <div className="grid place-content:center size:10x r:md bg:primary/.12 fg:primary">
                            <IconLayoutSidebar className="size:5x stroke:1.75" />
                        </div>
                        <div className="min-w:0">
                            <div className="font:semibold fg:strong">Workspace layout</div>
                            <div className="text:sm fg:neutral white-space:nowrap overflow:hidden text-overflow:ellipsis">Responsive product shell</div>
                        </div>
                    </div>
                    <div className="flex items-center gap:xs">
                        <button className="grid place-content:center size:9x r:md bg:base b:1|lightest fg:neutral" aria-label="Search">
                            <IconSearch className="size:4x stroke:1.75" />
                        </button>
                        <button className="grid place-content:center size:9x r:md bg:base b:1|lightest fg:neutral" aria-label="Notifications">
                            <IconBell className="size:4x stroke:1.75" />
                        </button>
                    </div>
                </header>

                <aside className="grid-col-span:4 grid-col-span:2@2xs grid-col-span:3@md bg:surface b:1|lightest shadow:xs r:lg p:sm">
                    <div className="flex flex-row flex-col@2xs gap:xs">
                        {navItems.map((item, index) => (
                            <a
                                key={item}
                                className={
                                    index === 0
                                        ? 'flex items-center justify-between gap:sm p:sm r:md bg:primary/.12 fg:primary text-decoration:none'
                                        : 'flex items-center justify-between gap:sm p:sm r:md fg:neutral text-decoration:none'
                                }
                                href="#"
                            >
                                <span className="font:sm font:medium">{item}</span>
                                {index === 0 && <span className="size:2x round bg:primary"></span>}
                            </a>
                        ))}
                    </div>
                </aside>

                <section className="grid-col-span:4 grid-col-span:6@2xs grid-col-span:9@md grid-cols:4 grid-cols:6@2xs grid-cols:9@md gap:sm gap:md@2xs">
                    {metrics.map((metric) => (
                        <article key={metric.label} className="grid-col-span:4 grid-col-span:2@2xs grid-col-span:3@md bg:surface b:1|lightest shadow:xs r:lg p:md">
                            <div className="flex items-center justify-between gap:sm">
                                <div className={`size:2x round ${metric.color}`}></div>
                                <span className="text:xs fg:neutral">{metric.delta}</span>
                            </div>
                            <div className="mt:lg font:2xl font:semibold fg:strong">{metric.value}</div>
                            <div className="mt:2xs text:sm fg:neutral">{metric.label}</div>
                        </article>
                    ))}

                    <article className="grid-col-span:4 grid-col-span:4@2xs grid-col-span:6@md bg:surface b:1|lightest shadow:xs r:lg p:md">
                        <div className="flex items-center justify-between gap:md">
                            <div>
                                <div className="font:semibold fg:strong">Weekly demand</div>
                                <div className="text:sm fg:neutral mt:2xs">Traffic and conversion trend</div>
                            </div>
                            <IconChartBar className="size:5x fg:primary stroke:1.75" />
                        </div>
                        <div className="flex items-end gap:xs h:32x mt:lg pt:lg bb:1|lightest">
                            {bars.map((height, index) => (
                                <div key={index} className="flex:1 flex items-end">
                                    <div className={`${height} w:full r:sm|sm|0|0 bg:primary/.18`}></div>
                                </div>
                            ))}
                        </div>
                    </article>

                    <article className="grid-col-span:4 grid-col-span:2@2xs grid-col-span:3@md bg:surface b:1|lightest shadow:xs r:lg p:md">
                        <div className="flex items-center justify-between gap:md">
                            <div>
                                <div className="font:semibold fg:strong">Launch tasks</div>
                                <div className="text:sm fg:neutral mt:2xs">3 open items</div>
                            </div>
                            <IconListCheck className="size:5x fg:primary stroke:1.75" />
                        </div>
                        <div className="mt:md">
                            {tasks.map(([task, date]) => (
                                <div key={task} className="flex items-center justify-between gap:sm py:sm bt:1|lightest:not(:first-child)">
                                    <span className="text:sm fg:strong">{task}</span>
                                    <span className="text:xs fg:neutral">{date}</span>
                                </div>
                            ))}
                        </div>
                    </article>

                    <article className="grid-col-span:4 grid-col-span:6@2xs grid-col-span:9@md bg:surface b:1|lightest shadow:xs r:lg p:md">
                        <div className="flex flex-col flex-row@2xs items-start items-center@2xs justify-between gap:md">
                            <div>
                                <div className="font:semibold fg:strong">Priority accounts</div>
                                <div className="text:sm fg:neutral mt:2xs">The content region spans full width below the analytical panels.</div>
                            </div>
                            <button className="inline-flex items-center gap:xs h:9x px:sm r:md bg:primary fg:white font:sm font:medium">
                                Open
                                <IconArrowUpRight className="size:4x stroke:1.75" />
                            </button>
                        </div>
                        <div className="grid-cols:1 grid-cols:3@2xs gap:sm mt:md">
                            {['Northwind', 'Acme Labs', 'Vertex'].map((account, index) => (
                                <div key={account} className="flex items-center justify-between gap:sm p:sm bg:base b:1|lightest r:md">
                                    <div className="min-w:0">
                                        <div className="font:sm font:medium fg:strong">{account}</div>
                                        <div className="text:xs fg:neutral mt:2xs">{index === 0 ? 'Renewal' : index === 1 ? 'Expansion' : 'Onboarding'}</div>
                                    </div>
                                    <IconDots className="size:4x fg:neutral stroke:1.75 flex:0" />
                                </div>
                            ))}
                        </div>
                    </article>
                </section>
            </section>
        </main>
    )
}
