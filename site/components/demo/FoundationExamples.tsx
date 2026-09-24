import { IconArrowUp } from '@tabler/icons-react'
import Demo from './Demo'
import DemoContainer from './DemoContainer'
import { DemoComparison, DemoItem, DemoLabel, DemoMedia, DemoSurface } from './primitives'

/** The query boundary is an ancestor; it never queries its own width. */
export function FoundationMedia() {
  return <Demo title="A component follows its container" padding="none" data-foundation="media" caption="Below md the media stacks. At md it keeps a 36x width beside flexible text.">
    <DemoContainer title="Media object">
      <div className="container">
        <article className="flex flex-col items-start gap-md p-md flex-row@container(md) demo-surface">
          <DemoMedia className="w:100% aspect-ratio:4/3 r-sm fg-demo-blue flex-shrink:0@container(md) w:9rem@container(md)" aria-label="Blue mountain illustration" />
          <div className="flex:1 min-w:0">
            <DemoLabel>Collection / 024</DemoLabel>
            <h3 className="mx:0 mb:0 mt-xs text-md font-semibold">Field notes</h3>
            <p className="mx:0 mb:0 mt-xs text-sm text-muted">A small archive of places, textures and quiet details from the trail.</p>
            <div className="flex flex-wrap gap-sm mt-md"><DemoLabel>12 images</DemoLabel><DemoLabel>Updated today</DemoLabel></div>
          </div>
        </article>
      </div>
    </DemoContainer>
  </Demo>
}

export function FoundationContainerGrid() {
  return <Demo title="One card, two available widths" padding="none" data-foundation="container-grid" caption="The nearest inline-size container controls the descendant grid. Its md token is separate from the viewport md token.">
    <DemoContainer title="Container grid">
      <section className="container">
        <article className="grid-cols:1 gap-lg p-md grid-cols:2@container(md) demo-surface">
          <DemoMedia className="w:100% aspect-ratio:3/2 r-sm fg-demo-blue" aria-label="Blue mountain illustration" />
          <div className="min-w:0">
            <DemoLabel>Asset library</DemoLabel>
            <h3 className="mx:0 mb:0 mt-xs text-md font-semibold">Space to compose</h3>
            <p className="mx:0 mb:0 mt-xs text-sm text-muted">A single column stays readable in a sidebar. A wider container gives the image its own track.</p>
          </div>
        </article>
      </section>
    </DemoContainer>
  </Demo>
}

export function FoundationSizing() {
  return <Demo title="Fluid space, measured object" data-foundation="sizing">
    <DemoSurface className="w:100% max-w-sm mx:auto p-md">
      <DemoLabel>w:100% · max-w-sm</DemoLabel>
      <div className="flex items-center gap-md mt-md">
        <DemoItem className="grid flex-shrink:0 place-content:center size:3rem round text-sm font-mono">FN</DemoItem>
        <div className="flex:1 min-w:0">
          <div className="text-sm font-semibold">Field notes</div>
          <p className="mx:0 mb:0 mt-2xs text-sm text-muted">Measured avatar. Flexible content.</p>
        </div>
      </div>
    </DemoSurface>
  </Demo>
}

export function FoundationAxes() {
  return <Demo title="Choose one axis or both" data-foundation="axes">
    <div className="flex items-end gap-md">
      <div className="flex-shrink:0"><DemoLabel>size:3.5rem</DemoLabel><DemoItem className="grid place-content:center size:3.5rem mt-sm font-mono">FN</DemoItem></div>
      <div className="flex:1 min-w:0"><DemoLabel>w:100% h:3.5rem</DemoLabel><DemoItem tone="violet" className="grid place-content:center h:3.5rem w:100% mt-sm text-sm">Collection</DemoItem></div>
    </div>
  </Demo>
}

export function FoundationShrink() {
  return <Demo title="Keep long content within its cap" padding="none" data-foundation="shrink" caption="The row stops at sm. The flexible text region can shrink below its content width.">
    <DemoContainer title="Shrinkable row">
      <article className="flex gap-md w:100% max-w-sm mx:auto p-md demo-surface">
        <DemoItem className="grid flex-shrink:0 place-content:center size:2.5rem text-sm font-mono">FN</DemoItem>
        <div className="flex:1 min-w:0">
          <div className="text-sm font-semibold">Project archive</div>
          <p className="overflow:hidden mx:0 mb:0 mt-2xs text-sm text-ellipsis white-space:nowrap text-muted">field-notes-autumn-collection-final-v03.fig</p>
        </div>
      </article>
    </DemoContainer>
  </Demo>
}

export function FoundationRadius() {
  return <Demo title="One scale, related surfaces" data-foundation="radius">
    <DemoComparison className="grid-cols:3 gap-sm">
      <div><DemoLabel>r-sm</DemoLabel><DemoItem className="grid place-content:center h:5rem mt-sm r-sm text-sm">Control</DemoItem></div>
      <div><DemoLabel>r-lg</DemoLabel><DemoItem className="grid place-content:center h:5rem mt-sm r-lg text-sm">Panel</DemoItem></div>
      <div><DemoLabel>r-2xl</DemoLabel><DemoItem className="grid place-content:center h:5rem mt-sm r-2xl text-sm">Feature</DemoItem></div>
    </DemoComparison>
  </Demo>
}

export function FoundationShapes() {
  return <Demo title="Content-sized pill and width-led circle" data-foundation="shapes" caption="These links share a destination. Their shape is independent of their native navigation behavior.">
    <div className="flex flex-wrap items-end gap-lg">
      <div><DemoLabel>rounded</DemoLabel><div className="mt-sm"><a href="#use-shape-shortcuts" className="inline-flex items-center justify-center min-h:44px px-md py-sm rounded b:1px|solid|var(--color-line-base) text-sm text-decoration:none bg-demo-surface text-body">Shape shortcuts</a></div></div>
      <div><DemoLabel>w:48px round</DemoLabel><div className="mt-sm"><a href="#use-shape-shortcuts" aria-label="Shape shortcuts" className="inline-flex items-center justify-center w:48px round b:1px|solid|var(--color-line-base) bg-demo-surface text-blue"><IconArrowUp size={20} aria-hidden="true" /></a></div></div>
    </div>
  </Demo>
}
