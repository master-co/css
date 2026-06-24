import {
    IconArrowUpRight,
    IconBell,
    IconChartBar,
    IconSearch,
} from '@tabler/icons-react'

const tabs = ['Overview', 'Pipeline', 'Messages']
const bars = ['h:8x', 'h:13x', 'h:10x', 'h:16x', 'h:12x', 'h:19x']
const tasks = [
    ['Audit onboarding', 'Today'],
    ['Review campaign', 'Thu'],
    ['Ship billing panel', 'Fri'],
]

export const dynamic = 'force-static'
export const revalidate = false

export default async function Page() {
    return (
        <main className="p:md bg:white min-h:100dvh">
            <section className="gap:sm mx:auto grid-cols:4 max-w:3xl w:full grid-cols:8@2xs">
                <header className="flex flex-col items-start justify-between b:1px|solid|gray-20 gap:sm grid-col-span:4 p:sm r:lg bg:white shadow:xs flex-row@4xs items-center@4xs grid-col-span:8@2xs">
                    <div className="min-w:0">
                        <div className="font:semibold text:neutral">Workspace layout</div>
                        <div className="text:sm mt:2xs text:gray">Responsive product surface</div>
                    </div>
                    <div className="flex items-center gap:xs">
                        <button className="grid b:1px|solid|gray-20 place-content:center r:md size:8x bg:white text:gray" aria-label="Search">
                            <IconSearch className="size:4x stroke:1.75" />
                        </button>
                        <button className="grid b:1px|solid|gray-20 place-content:center r:md size:8x bg:white text:gray" aria-label="Notifications">
                            <IconBell className="size:4x stroke:1.75" />
                        </button>
                    </div>
                </header>

                <nav className="flex b:1px|solid|gray-20 gap:xs grid-col-span:4 overflow:auto p:xs r:lg bg:white shadow:xs grid-col-span:8@2xs">
                    {tabs.map((tab, index) => (
                        <a
                            key={tab}
                            className={
                                index === 0
                                    ? 'px:sm py:xs r:md text-decoration:none white-space:nowrap bg:blue-60/.12 fg:blue-60 font:medium font:sm'
                                    : 'px:sm py:xs r:md text-decoration:none white-space:nowrap font:medium font:sm text:gray'
                            }
                            href={`#${tab.toLowerCase()}`}
                        >
                            {tab}
                        </a>
                    ))}
                </nav>

                <article className="b:1px|solid|gray-20 grid-col-span:4 p:sm r:lg bg:white shadow:xs grid-col-span:2@4xs grid-col-span:4@2xs">
                    <div className="flex items-center justify-between gap:sm">
                        <span className="round size:2x bg:green-60"></span>
                        <span className="text:xs text:gray">+12.8%</span>
                    </div>
                    <div className="font:2xl font:semibold mt:md text:neutral">$128.4k</div>
                    <div className="text:sm mt:2xs text:gray">Revenue</div>
                </article>

                <article className="b:1px|solid|gray-20 grid-col-span:4 p:sm r:lg bg:white shadow:xs grid-col-span:2@4xs grid-col-span:4@2xs">
                    <div className="flex items-center justify-between gap:sm">
                        <span className="round size:2x bg:amber-50"></span>
                        <span className="text:xs text:gray">+4.1%</span>
                    </div>
                    <div className="font:2xl font:semibold mt:md text:neutral">64.2%</div>
                    <div className="text:sm mt:2xs text:gray">Activation</div>
                </article>

                <article className="b:1px|solid|gray-20 grid-col-span:4 p:sm r:lg bg:white shadow:xs grid-col-span:5@2xs">
                    <div className="flex items-center justify-between gap:md">
                        <div>
                            <div className="font:semibold text:neutral">Weekly demand</div>
                            <div className="text:sm mt:2xs text:gray">Traffic and conversion trend</div>
                        </div>
                        <IconChartBar className="flex:0 size:5x fg:blue-60 stroke:1.75" />
                    </div>
                    <div className="flex items-end bb:1px|solid|gray-20 gap:xs h:22x mt:sm pt:sm">
                        {bars.map((height, index) => (
                            <div key={index} className="flex items-end flex:1">
                                <div className={`${height} w:full r:sm|sm|0|0 bg:blue-60/.18`}></div>
                            </div>
                        ))}
                    </div>
                </article>

                <article className="b:1px|solid|gray-20 grid-col-span:4 p:sm r:lg bg:white shadow:xs grid-col-span:3@2xs">
                    <div className="flex items-center justify-between gap:md">
                        <div>
                            <div className="font:semibold text:neutral">Launch tasks</div>
                            <div className="text:sm mt:2xs text:gray">3 open items</div>
                        </div>
                        <a className="grid place-content:center r:md size:8x bg:blue-60 fg:white" href="#launch-tasks" aria-label="Open launch tasks">
                            <IconArrowUpRight className="size:4x stroke:1.75" />
                        </a>
                    </div>
                    <div className="mt:sm">
                        {tasks.map(([task, date]) => (
                            <div key={task} className="flex items-center justify-between gap:sm py:xs bt:1px|solid|gray-20:not(:first-child)">
                                <span className="text:sm text:neutral">{task}</span>
                                <span className="text:xs text:gray">{date}</span>
                            </div>
                        ))}
                    </div>
                </article>
            </section>
        </main>
    )
}
