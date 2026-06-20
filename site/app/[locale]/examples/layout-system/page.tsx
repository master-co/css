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
        <main className="min-h:100dvh bg:surface p:md">
            <section className="w:full max-w:3xl mi:auto grid-cols:4 grid-cols:8@2xs gap:sm">
                <header className="grid-col-span:4 grid-col-span:8@2xs flex flex-col flex-row@4xs items-start items-center@4xs justify-between gap:sm bg:surface b:1px|solid|subtle shadow:xs r:lg p:sm">
                    <div className="min-w:0">
                        <div className="font:semibold text:strong">Workspace layout</div>
                        <div className="text:sm text:text mt:2xs">Responsive product surface</div>
                    </div>
                    <div className="flex items-center gap:xs">
                        <button className="grid place-content:center size:8x r:md bg:surface b:1px|solid|subtle text:text" aria-label="Search">
                            <IconSearch className="size:4x stroke:1.75" />
                        </button>
                        <button className="grid place-content:center size:8x r:md bg:surface b:1px|solid|subtle text:text" aria-label="Notifications">
                            <IconBell className="size:4x stroke:1.75" />
                        </button>
                    </div>
                </header>

                <nav className="grid-col-span:4 grid-col-span:8@2xs flex gap:xs overflow:auto bg:surface b:1px|solid|subtle shadow:xs r:lg p:xs">
                    {tabs.map((tab, index) => (
                        <a
                            key={tab}
                            className={
                                index === 0
                                    ? 'px:sm py:xs r:md bg:primary/.12 text:primary text-decoration:none font:sm font:medium white-space:nowrap'
                                    : 'px:sm py:xs r:md text:text text-decoration:none font:sm font:medium white-space:nowrap'
                            }
                            href={`#${tab.toLowerCase()}`}
                        >
                            {tab}
                        </a>
                    ))}
                </nav>

                <article className="grid-col-span:4 grid-col-span:2@4xs grid-col-span:4@2xs bg:surface b:1px|solid|subtle shadow:xs r:lg p:sm">
                    <div className="flex items-center justify-between gap:sm">
                        <span className="size:2x round bg:success"></span>
                        <span className="text:xs text:text">+12.8%</span>
                    </div>
                    <div className="mt:md font:2xl font:semibold text:strong">$128.4k</div>
                    <div className="mt:2xs text:sm text:text">Revenue</div>
                </article>

                <article className="grid-col-span:4 grid-col-span:2@4xs grid-col-span:4@2xs bg:surface b:1px|solid|subtle shadow:xs r:lg p:sm">
                    <div className="flex items-center justify-between gap:sm">
                        <span className="size:2x round bg:accent"></span>
                        <span className="text:xs text:text">+4.1%</span>
                    </div>
                    <div className="mt:md font:2xl font:semibold text:strong">64.2%</div>
                    <div className="mt:2xs text:sm text:text">Activation</div>
                </article>

                <article className="grid-col-span:4 grid-col-span:5@2xs bg:surface b:1px|solid|subtle shadow:xs r:lg p:sm">
                    <div className="flex items-center justify-between gap:md">
                        <div>
                            <div className="font:semibold text:strong">Weekly demand</div>
                            <div className="text:sm text:text mt:2xs">Traffic and conversion trend</div>
                        </div>
                        <IconChartBar className="size:5x text:primary stroke:1.75 flex:0" />
                    </div>
                    <div className="flex items-end gap:xs h:22x mt:sm pt:sm bb:1px|solid|subtle">
                        {bars.map((height, index) => (
                            <div key={index} className="flex:1 flex items-end">
                                <div className={`${height} w:full r:sm|sm|0|0 bg:primary/.18`}></div>
                            </div>
                        ))}
                    </div>
                </article>

                <article className="grid-col-span:4 grid-col-span:3@2xs bg:surface b:1px|solid|subtle shadow:xs r:lg p:sm">
                    <div className="flex items-center justify-between gap:md">
                        <div>
                            <div className="font:semibold text:strong">Launch tasks</div>
                            <div className="text:sm text:text mt:2xs">3 open items</div>
                        </div>
                        <a className="grid place-content:center size:8x r:md bg:primary text:white" href="#launch-tasks" aria-label="Open launch tasks">
                            <IconArrowUpRight className="size:4x stroke:1.75" />
                        </a>
                    </div>
                    <div className="mt:sm">
                        {tasks.map(([task, date]) => (
                            <div key={task} className="flex items-center justify-between gap:sm py:xs bt:1px|solid|subtle:not(:first-child)">
                                <span className="text:sm text:strong">{task}</span>
                                <span className="text:xs text:text">{date}</span>
                            </div>
                        ))}
                    </div>
                </article>
            </section>
        </main>
    )
}
