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
    <main className="min-h:100dvh p:md bg:surface-base">
      <section className="grid-cols:4 gap:sm w:full max-w:3xl mx:auto grid-cols:8@2xs">
        <header className="flex flex-col grid-col-span:4 items-start justify-between gap:sm p:sm b:1px|solid|base r:lg surface:raised shadow:xs flex-row@4xs items-center@4xs grid-col-span:8@2xs">
          <div className="min-w:0">
            <div className="font:semibold text:strong">Workspace layout</div>
            <div className="mt:2xs text:sm text:muted">Responsive product surface</div>
          </div>
          <div className="flex items-center gap:xs">
            <button className="grid place-content:center size:8x b:1px|solid|base r:md surface:raised text:muted" aria-label="Search">
              <IconSearch className="size:4x stroke:1.75" />
            </button>
            <button className="grid place-content:center size:8x b:1px|solid|base r:md surface:raised text:muted" aria-label="Notifications">
              <IconBell className="size:4x stroke:1.75" />
            </button>
          </div>
        </header>

        <nav className="flex overflow:auto grid-col-span:4 gap:xs p:xs b:1px|solid|base r:lg surface:raised shadow:xs grid-col-span:8@2xs">
          {tabs.map((tab, index) => (
            <a
              key={tab}
              className={
                index === 0
                  ? 'px:sm py:xs r:md font:medium font:sm text-decoration:none white-space:nowrap bg:blue-60/.12 fg:blue-60'
                  : 'px:sm py:xs r:md font:medium font:sm text-decoration:none white-space:nowrap text:muted'
              }
              href={`#${tab.toLowerCase()}`}
            >
              {tab}
            </a>
          ))}
        </nav>

        <article className="grid-col-span:4 p:sm b:1px|solid|base r:lg surface:raised shadow:xs grid-col-span:2@4xs grid-col-span:4@2xs">
          <div className="flex items-center justify-between gap:sm">
            <span className="size:2x round bg:green-60"></span>
            <span className="text:xs text:muted">+12.8%</span>
          </div>
          <div className="mt:md font:2xl font:semibold text:strong">$128.4k</div>
          <div className="mt:2xs text:sm text:muted">Revenue</div>
        </article>

        <article className="grid-col-span:4 p:sm b:1px|solid|base r:lg surface:raised shadow:xs grid-col-span:2@4xs grid-col-span:4@2xs">
          <div className="flex items-center justify-between gap:sm">
            <span className="size:2x round bg:amber-50"></span>
            <span className="text:xs text:muted">+4.1%</span>
          </div>
          <div className="mt:md font:2xl font:semibold text:strong">64.2%</div>
          <div className="mt:2xs text:sm text:muted">Activation</div>
        </article>

        <article className="grid-col-span:4 p:sm b:1px|solid|base r:lg surface:raised shadow:xs grid-col-span:5@2xs">
          <div className="flex items-center justify-between gap:md">
            <div>
              <div className="font:semibold text:strong">Weekly demand</div>
              <div className="mt:2xs text:sm text:muted">Traffic and conversion trend</div>
            </div>
            <IconChartBar className="flex:0 size:5x fg:blue-60 stroke:1.75" />
          </div>
          <div className="flex items-end gap:xs h:22x mt:sm pt:sm bb:1px|solid|base">
            {bars.map((height, index) => (
              <div key={index} className="flex flex:1 items-end">
                <div className={`${height} w:full r:sm|sm|0|0 bg:blue-60/.18`}></div>
              </div>
            ))}
          </div>
        </article>

        <article className="grid-col-span:4 p:sm b:1px|solid|base r:lg surface:raised shadow:xs grid-col-span:3@2xs">
          <div className="flex items-center justify-between gap:md">
            <div>
              <div className="font:semibold text:strong">Launch tasks</div>
              <div className="mt:2xs text:sm text:muted">3 open items</div>
            </div>
            <a className="grid place-content:center size:8x r:md bg:blue-60 fg:white" href="#launch-tasks" aria-label="Open launch tasks">
              <IconArrowUpRight className="size:4x stroke:1.75" />
            </a>
          </div>
          <div className="mt:sm">
            {tasks.map(([task, date]) => (
              <div key={task} className="flex items-center justify-between gap:sm py:xs bt:1px|solid|base:not(:first-child)">
                <span className="text:sm text:strong">{task}</span>
                <span className="text:xs text:muted">{date}</span>
              </div>
            ))}
          </div>
        </article>
      </section>
    </main>
  )
}
