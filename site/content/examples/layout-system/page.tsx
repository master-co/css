// Bare examples import the system parts they render: sheets and specimens.
import '~/site/styles/system/surfaces.css'
import '~/site/styles/system/specimens.css'
import { DemoItem, DemoLabel, DemoSurface } from '~/site/components/demo/primitives'

const bars = [
  ['Mon', 80, '(height:35%)'], ['Tue', 130, '(height:56%)'], ['Wed', 100, '(height:43%)'],
  ['Thu', 160, '(height:69%)'], ['Fri', 120, '(height:52%)'], ['Sat', 190, '(height:82%)'],
] as const
const tasks = [['Audit onboarding', 'Today'], ['Review campaign', 'Thu'], ['Ship billing panel', 'Fri']]
const metrics = [['Revenue', '$128.4k', '+12.8% from last month'], ['Activation', '64.2%', '+4.1 percentage points']]

export default function Page() {
  return <main className="(min-height:100dvh) p-md bg-surface-base fg-text-body">
    <section data-workspace className="grid-cols(4) gap-sm w-full max-w-3xl mx-auto grid-cols(8)@2xs gap-md@2xs">
      <header id="overview" className="flex flex-wrap grid-col-span(4) items-end justify-between gap-sm grid-col-span(8)@2xs">
        <div><DemoLabel>Sample workspace / 024</DemoLabel><h1 className="mb(0) mx(0) mt-2xs text-xl font-regular fg-text-strong">Project overview</h1></div>
        <DemoLabel>September 2026</DemoLabel>
      </header>
      <nav aria-label="Workspace sections" className="flex grid-col-span(4) gap-lg bb-solid bb(1) bb-line-divider grid-col-span(8)@2xs">
        <a href="#metrics" className="py-xs text-sm (text-decoration:none) fg-text-muted fg-text-strong:hover">Metrics</a>
        <a href="#demand" className="py-xs text-sm (text-decoration:none) fg-text-muted fg-text-strong:hover">Demand</a>
        <a href="#launch-tasks" className="py-xs text-sm (text-decoration:none) fg-text-muted fg-text-strong:hover">Tasks</a>
      </nav>
      {metrics.map(([name, value, change], index) => <DemoSurface key={name} elevation="raised" id={index ? undefined : 'metrics'} className="grid-col-span(4) p-md grid-col-span(4)@2xs">
        <DemoLabel>{name}</DemoLabel>
        <div className="mt-xs text-2xl font-regular (font-variant-numeric:tabular-nums) fg-text-strong">{value}</div>
        <div className="mt-2xs text-xs fg-text-muted">{change}</div>
      </DemoSurface>)}
      <DemoSurface elevation="raised" id="demand" className="flex flex-col grid-col-span(4) min-w(0) p-md grid-col-span(5)@2xs">
        <figure className="flex flex-col grow(1) m(0)">
          <figcaption className="text-sm font-regular fg-text-strong">Weekly demand</figcaption>
          <p className="mb(0) mx(0) mt-3xs text-xs fg-text-muted">Sample requests per day</p>
          <div className="grid-cols(6) grow(1) gap-xs min-h(160) mt-md">
            {bars.map(([day, value, height]) => <div key={day} className="flex flex-col gap-2xs min-w(0) text-center">
              <div className="flex flex-col grow(1) items-center justify-end gap-2xs bb-solid bb(1) bb-line-divider">
                <span className="text-xs (font-variant-numeric:tabular-nums) fg-text-muted">{value}</span>
                <DemoItem variant="solid" className={`${height} (width:56%) min-h(0) p(0) rtl-xs rtr-xs rbr(0) rbl(0)`} aria-hidden="true" />
              </div>
              <span className="text-xs fg-text-muted">{day}</span>
            </div>)}
          </div>
        </figure>
      </DemoSurface>
      <DemoSurface elevation="raised" id="launch-tasks" className="grid-col-span(4) min-w(0) p-md grid-col-span(3)@2xs">
        <h2 className="m(0) text-sm font-regular fg-text-strong">Launch tasks</h2>
        <p className="mb(0) mx(0) mt-3xs text-xs fg-text-muted">Check off a task to try the controls.</p>
        <div className="mt-sm">
          {tasks.map(([task, date]) => <label key={task} className="flex items-start gap-xs py-sm bt-solid:not(:first-child) bt(1):not(:first-child) bt-line-divider:not(:first-child)">
            <input type="checkbox" className="shrink(0) mt(4) accent-text-strong" />
            <span className="(flex:1) min-w(0) text-sm font-regular">{task}<span className="block mt-3xs text-xs fg-text-muted">{date}</span></span>
          </label>)}
        </div>
      </DemoSurface>
    </section>
  </main>
}
