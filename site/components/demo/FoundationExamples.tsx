import '~/site/styles/demo.css'
import { IconArrowUp } from '@tabler/icons-react'
import Demo from './Demo'
import DemoContainer from './DemoContainer'
import { DemoComparison, DemoItem, DemoLabel, DemoMedia, DemoSurface } from './primitives'

/** The query boundary is an ancestor; it never queries its own width. */
export function FoundationMedia() {
  return <Demo title="A component follows its container" padding="none" data-foundation="media" caption="Below md the media stacks. At md it keeps a 36x width beside flexible text.">
    <DemoContainer title="Media object">
      <div className="container-type:inline-size">
        <article className="display:flex flex-direction:column align-items:start gap-md p-md flex-direction:row@container((width>=28rem)) demo-surface">
          <DemoMedia className="width:100% aspect-ratio:4/3 r-sm fg-demo-blue flex-shrink:0@container((width>=28rem)) width:9rem@container((width>=28rem))" aria-label="Blue mountain illustration" />
          <div className="flex:1 min-width:0">
            <DemoLabel>Collection / 024</DemoLabel>
            <h3 className="margin-inline:0 mt-xs margin-bottom:0 text-md font-weight-semibold">Field notes</h3>
            <p className="margin-inline:0 mt-xs margin-bottom:0 text-sm fg-text-muted">A small archive of places, textures and quiet details from the trail.</p>
            <div className="display:flex flex-wrap:wrap gap-sm mt-md"><DemoLabel>12 images</DemoLabel><DemoLabel>Updated today</DemoLabel></div>
          </div>
        </article>
      </div>
    </DemoContainer>
  </Demo>
}

export function FoundationContainerGrid() {
  return <Demo title="One card, two available widths" padding="none" data-foundation="container-grid" caption="The nearest inline-size container controls the descendant grid. The literal 28rem threshold is independent of container tokens and viewport custom media.">
    <DemoContainer title="Container grid">
      <section className="container-type:inline-size">
        <article className="grid-cols(1) gap-lg p-md grid-cols(2)@container((width>=28rem)) demo-surface">
          <DemoMedia className="width:100% aspect-ratio:3/2 r-sm fg-demo-blue" aria-label="Blue mountain illustration" />
          <div className="min-width:0">
            <DemoLabel>Asset library</DemoLabel>
            <h3 className="margin-inline:0 mt-xs margin-bottom:0 text-md font-weight-semibold">Space to compose</h3>
            <p className="margin-inline:0 mt-xs margin-bottom:0 text-sm fg-text-muted">A single column stays readable in a sidebar. A wider container gives the image its own track.</p>
          </div>
        </article>
      </section>
    </DemoContainer>
  </Demo>
}

export function FoundationSizing() {
  return <Demo title="Fluid space, measured object" data-foundation="sizing">
    <DemoSurface className="width:100% max-w-sm margin-inline:auto p-md">
      <DemoLabel>w:100% · max-w-sm</DemoLabel>
      <div className="display:flex align-items:center gap-md mt-md">
        <DemoItem className="display:grid flex-shrink:0 place-content:center height:3rem width:3rem aspect-ratio:1/1 border-radius:50% text-sm font-family-mono">FN</DemoItem>
        <div className="flex:1 min-width:0">
          <div className="text-sm font-weight-semibold">Field notes</div>
          <p className="margin-inline:0 mt-2xs margin-bottom:0 text-sm fg-text-muted">Measured avatar. Flexible content.</p>
        </div>
      </div>
    </DemoSurface>
  </Demo>
}

export function FoundationAxes() {
  return <Demo title="Choose one axis or both" data-foundation="axes">
    <div className="display:flex align-items:end gap-md">
      <div className="flex-shrink:0"><DemoLabel>width:3.5rem height:3.5rem</DemoLabel><DemoItem className="display:grid place-content:center height:3.5rem width:3.5rem mt-sm font-family-mono">FN</DemoItem></div>
      <div className="flex:1 min-width:0"><DemoLabel>width:100% height:3.5rem</DemoLabel><DemoItem tone="violet" className="display:grid place-content:center height:3.5rem width:100% mt-sm text-sm">Collection</DemoItem></div>
    </div>
  </Demo>
}

export function FoundationShrink() {
  return <Demo title="Keep long content within its cap" padding="none" data-foundation="shrink" caption="The row stops at sm. The flexible text region can shrink below its content width.">
    <DemoContainer title="Shrinkable row">
      <article className="display:flex gap-md width:100% max-w-sm margin-inline:auto p-md demo-surface">
        <DemoItem className="display:grid flex-shrink:0 place-content:center height:2.5rem width:2.5rem text-sm font-family-mono">FN</DemoItem>
        <div className="flex:1 min-width:0">
          <div className="text-sm font-weight-semibold">Project archive</div>
          <p className="overflow:hidden margin-inline:0 mt-2xs margin-bottom:0 text-sm text-overflow:ellipsis white-space:nowrap fg-text-muted">field-notes-autumn-collection-final-v03.fig</p>
        </div>
      </article>
    </DemoContainer>
  </Demo>
}

export function FoundationRadius() {
  return <Demo title="One scale, related surfaces" data-foundation="radius">
    <DemoComparison className="grid-cols(3) gap-sm">
      <div><DemoLabel>r-sm</DemoLabel><DemoItem className="display:grid place-content:center height:5rem mt-sm r-sm text-sm">Control</DemoItem></div>
      <div><DemoLabel>r-lg</DemoLabel><DemoItem className="display:grid place-content:center height:5rem mt-sm r-lg text-sm">Panel</DemoItem></div>
      <div><DemoLabel>r-2xl</DemoLabel><DemoItem className="display:grid place-content:center height:5rem mt-sm r-2xl text-sm">Feature</DemoItem></div>
    </DemoComparison>
  </Demo>
}

export function FoundationShapes() {
  return <Demo title="Content-sized pill and width-led circle" data-foundation="shapes" caption="These links share a destination. Their shape is independent of their native navigation behavior.">
    <div className="display:flex flex-wrap:wrap align-items:end gap-lg">
      <div><DemoLabel>r-pill</DemoLabel><div className="mt-sm"><a href="#use-shape-shortcuts" className="display:inline-flex align-items:center justify-content:center min-height:44px py-sm px-md r-pill border-width:1px border-style:solid b-line-divider text-sm text-decoration:none bg-demo-surface fg-text-body">Pills and circles</a></div></div>
      <div><DemoLabel>width:48px aspect-ratio:1/1 r-pill</DemoLabel><div className="mt-sm"><a href="#use-shape-shortcuts" aria-label="Pills and circles" className="display:inline-flex align-items:center justify-content:center width:48px aspect-ratio:1/1 r-pill border-width:1px border-style:solid b-line-divider bg-demo-surface fg-text-blue"><IconArrowUp size={20} aria-hidden="true" /></a></div></div>
    </div>
  </Demo>
}
