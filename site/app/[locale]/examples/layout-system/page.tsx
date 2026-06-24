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
        <main className="min-h:100dvh bg:white p:md">
            <section className="w:full max-w:3xl mx:auto grid-cols:4 grid-cols:8@2xs gap:sm">
                <header className="grid-col-span:4 grid-col-span:8@2xs flex flex-col flex-row@4xs items-start items-center@4xs justify-between gap:sm bg:white b:1px|solid|gray-20 shadow:xs r:lg p:sm">
                    <div className="min-w:0">
                        <div className="font:semibold text:neutral">Workspace layout</div>
                        <div className="text:sm text:gray mt:2xs">Responsive product surface</div>
                    </div>
                    <div className="flex items-center gap:xs">
                        <button className="grid place-content:center size:8x r:md bg:white b:1px|solid|gray-20 text:gray" aria-label="Search">
                            <IconSearch className="size:4x stroke:1.75" />
                        </button>
                        <button className="grid place-content:center size:8x r:md bg:white b:1px|solid|gray-20 text:gray" aria-label="Notifications">
                            <IconBell className="size:4x stroke:1.75" />
                        </button>
                    </div>
                </header>

                <nav className="grid-col-span:4 grid-col-span:8@2xs flex gap:xs overflow:auto bg:white b:1px|solid|gray-20 shadow:xs r:lg p:xs">
                    {tabs.map((tab, index) => (
                        <a
                            key={tab}
                            className={
                                index === 0
                                    ? 'px:sm py:xs r:md bg:blue-60/.12 fg:blue-60 text-decoration:none font:sm font:medium white-space:nowrap'
                                    : 'px:sm py:xs r:md text:gray text-decoration:none font:sm font:medium white-space:nowrap'
                            }
                            href={`#${tab.toLowerCase()}`}
                        >
                            {tab}
                        </a>
                    ))}
                </nav>

                <article className="grid-col-span:4 grid-col-span:2@4xs grid-col-span:4@2xs bg:white b:1px|solid|gray-20 shadow:xs r:lg p:sm">
                    <div className="flex items-center justify-between gap:sm">
                        <span className="size:2x round bg:green-60"></span>
                        <span className="text:xs text:gray">+12.8%</span>
                    </div>
                    <div className="mt:md font:2xl font:semibold text:neutral">$128.4k</div>
                    <div className="mt:2xs text:sm text:gray">Revenue</div>
                </article>

                <article className="grid-col-span:4 grid-col-span:2@4xs grid-col-span:4@2xs bg:white b:1px|solid|gray-20 shadow:xs r:lg p:sm">
                    <div className="flex items-center justify-between gap:sm">
                        <span className="size:2x round bg:amber-50"></span>
                        <span className="text:xs text:gray">+4.1%</span>
                    </div>
                    <div className="mt:md font:2xl font:semibold text:neutral">64.2%</div>
                    <div className="mt:2xs text:sm text:gray">Activation</div>
                </article>

                <article className="grid-col-span:4 grid-col-span:5@2xs bg:white b:1px|solid|gray-20 shadow:xs r:lg p:sm">
                    <div className="flex items-center justify-between gap:md">
                        <div>
                            <div className="font:semibold text:neutral">Weekly demand</div>
                            <div className="text:sm text:gray mt:2xs">Traffic and conversion trend</div>
                        </div>
                        <IconChartBar className="size:5x fg:blue-60 stroke:1.75 flex:0" />
                    </div>
                    <div className="flex items-end gap:xs h:22x mt:sm pt:sm bb:1px|solid|gray-20">
                        {bars.map((height, index) => (
                            <div key={index} className="flex:1 flex items-end">
                                <div className={`${height} w:full r:sm|sm|0|0 bg:blue-60/.18`}></div>
                            </div>
                        ))}
                    </div>
                </article>

                <article className="grid-col-span:4 grid-col-span:3@2xs bg:white b:1px|solid|gray-20 shadow:xs r:lg p:sm">
                    <div className="flex items-center justify-between gap:md">
                        <div>
                            <div className="font:semibold text:neutral">Launch tasks</div>
                            <div className="text:sm text:gray mt:2xs">3 open items</div>
                        </div>
                        <a className="grid place-content:center size:8x r:md bg:blue-60 fg:white" href="#launch-tasks" aria-label="Open launch tasks">
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
