import { DemoItem, DemoLabel, DemoSurface } from '~/site/components/demo/primitives'

const bars = [
  ['Mon', 80, 'h:8x'], ['Tue', 130, 'h:13x'], ['Wed', 100, 'h:10x'],
  ['Thu', 160, 'h:16x'], ['Fri', 120, 'h:12x'], ['Sat', 190, 'h:19x'],
] as const
const tasks = [['Audit onboarding', 'Today'], ['Review campaign', 'Thu'], ['Ship billing panel', 'Fri']]

export const dynamic = 'force-static'
export const revalidate = false

export default function Page() {
  return <main className="min-h:100dvh p:md bg:surface-base text:body">
    <section data-workspace className="grid-cols:4 gap:sm w:full max-w:3xl mx:auto grid-cols:8@2xs gap:md@2xs">
      <header id="overview" className="flex flex-wrap grid-col-span:4 items-center justify-between gap:sm grid-col-span:8@2xs">
        <div><DemoLabel>Sample workspace / 024</DemoLabel><h1 className="mx:0 mb:0 mt:2xs text:lg font:semibold">Project overview</h1></div>
        <DemoLabel>September 2026</DemoLabel>
      </header>
      <nav aria-label="Workspace sections" className="flex flex-wrap grid-col-span:4 gap:xs grid-col-span:8@2xs">
        <a className="px:sm py:xs b:1px|solid|base r:sm text:xs text-decoration:none bg:surface-raised text:body outline:2px|solid|blue:focus-visible outline-offset:4xs:focus-visible" href="#metrics">Metrics</a>
        <a className="px:sm py:xs b:1px|solid|base r:sm text:xs text-decoration:none bg:surface-raised text:body outline:2px|solid|blue:focus-visible outline-offset:4xs:focus-visible" href="#demand">Demand</a>
        <a className="px:sm py:xs b:1px|solid|base r:sm text:xs text-decoration:none bg:surface-raised text:body outline:2px|solid|blue:focus-visible outline-offset:4xs:focus-visible" href="#launch-tasks">Tasks</a>
      </nav>
      <DemoSurface id="metrics" className="grid-col-span:4 p:md grid-col-span:2@4xs grid-col-span:4@2xs">
        <DemoLabel>Revenue</DemoLabel>
        <div className="mt:sm text:2xl font:semibold">$128.4k</div>
        <div className="mt:xs text:xs text:muted">+12.8% from last month</div>
      </DemoSurface>
      <DemoSurface className="grid-col-span:4 p:md grid-col-span:2@4xs grid-col-span:4@2xs">
        <DemoLabel>Activation</DemoLabel>
        <div className="mt:sm text:2xl font:semibold">64.2%</div>
        <div className="mt:xs text:xs text:muted">+4.1 percentage points</div>
      </DemoSurface>
      <DemoSurface id="demand" className="grid-col-span:4 min-w:0 p:md grid-col-span:5@2xs">
        <figure className="m:0">
          <figcaption className="text:sm font:semibold">Weekly demand</figcaption>
          <p className="mx:0 mb:0 mt:2xs text:xs text:muted">Sample requests per day</p>
          <div className="flex items-end gap:xs h:32x mt:sm">
            {bars.map(([day, value, height]) => <div key={day} className="flex flex-col flex:1 gap:xs min-w:0 text-center">
              <DemoLabel>{value}</DemoLabel>
              <DemoItem className={`${height} w:full r:sm|sm|0|0`} aria-hidden="true" />
              <DemoLabel>{day}</DemoLabel>
            </div>)}
          </div>
        </figure>
      </DemoSurface>
      <DemoSurface id="launch-tasks" className="grid-col-span:4 min-w:0 p:md grid-col-span:3@2xs">
        <h2 className="m:0 text:sm font:semibold">Launch tasks</h2>
        <p className="mx:0 mb:0 mt:2xs text:xs text:muted">Check off a task to try the controls.</p>
        <div className="mt:sm">
          {tasks.map(([task, date]) => <label key={task} className="flex items-start gap:xs py:sm bt:1px|solid|base:not(:first-child)">
            <input type="checkbox" className="flex-shrink:0 mt:3xs accent-color:blue" />
            <span className="flex:1 min-w:0 text:sm">{task}<span className="block mt:2xs text:xs text:muted">{date}</span></span>
          </label>)}
        </div>
      </DemoSurface>
    </section>
  </main>
}
