import { IconArrowUp } from '@tabler/icons-react'
import Demo from './Demo'
import DemoContainer from './DemoContainer'
import { DemoItem, DemoLabel, DemoMedia, DemoSurface } from './primitives'

/** The query boundary is an ancestor; it never queries its own width. */
export function FoundationMedia() {
  return <DemoContainer title="A component follows its container" data-foundation="media" caption="Below 28rem of container width, the media stacks. At 28rem it keeps a 9rem width beside flexible text.">
      <div className="container-inline">
        <article className="flex flex-col items-start gap-md p-md flex-row@container(width>=28rem) ui-sheet" data-elevation="1">
          <DemoMedia tone="blue" className="h-auto w-full (aspect-ratio:4/3) r-sm shrink(0)@container(width>=28rem) (width:9rem)@container(width>=28rem)" aria-label="Blue mountain illustration" />
          <div className="(flex:1) min-w(0)">
            <DemoLabel>Collection / 024</DemoLabel>
            <h3 className="mb(0) mx(0) mt-xs text-md font-semibold">Field notes</h3>
            <p className="mb(0) mx(0) mt-xs text-sm fg-text-muted">A small archive of places, textures and quiet details from the trail.</p>
            <div className="flex flex-wrap gap-sm mt-md"><DemoLabel>12 images</DemoLabel><DemoLabel>Updated today</DemoLabel></div>
          </div>
        </article>
      </div>
  </DemoContainer>
}

export function FoundationContainerGrid() {
  return <DemoContainer title="One card, two available widths" data-foundation="container-grid" caption="The nearest inline-size container controls the descendant grid. The literal 28rem threshold is independent of container tokens and viewport custom media.">
      <section className="container-inline">
        <article className="grid-cols(1) gap-lg p-md grid-cols(2)@container(width>=28rem) ui-sheet" data-elevation="1">
          <DemoMedia tone="blue" className="h-auto w-full (aspect-ratio:3/2) r-sm" aria-label="Blue mountain illustration" />
          <div className="min-w(0)">
            <DemoLabel>Asset library</DemoLabel>
            <h3 className="mb(0) mx(0) mt-xs text-md font-semibold">Space to compose</h3>
            <p className="mb(0) mx(0) mt-xs text-sm fg-text-muted">A single column stays readable in a sidebar. A wider container gives the image its own track.</p>
          </div>
        </article>
      </section>
  </DemoContainer>
}

export function FoundationSizing() {
  return <Demo title="Fluid space, measured object" data-foundation="sizing">
    <DemoSurface className="w-full max-w-sm mx-auto p-md">
      <DemoLabel>w-full · max-w-sm</DemoLabel>
      <div className="flex items-center gap-md mt-md">
        <DemoItem className="grid shrink(0) (place-content:center) (height:3rem) (width:3rem) (aspect-ratio:1/1) (border-radius:50%) text-sm font-mono">FN</DemoItem>
        <div className="wrap-anywhere (flex:1) min-w(0)">
          <div className="text-sm font-semibold">Field notes</div>
          <p className="mb(0) mx(0) mt-2xs text-sm fg-text-muted">Measured avatar. Flexible content.</p>
        </div>
      </div>
    </DemoSurface>
  </Demo>
}

export function FoundationAxes() {
  return <Demo title="Choose one axis or both" data-foundation="axes">
    <div className="flex items-end gap-md w-full">
      <div className="shrink(0) (width:3.5rem)"><DemoLabel>(width:3.5rem) (height:3.5rem)</DemoLabel><DemoItem className="grid (place-content:center) (height:3.5rem) (width:3.5rem) mt-sm font-mono">FN</DemoItem></div>
      <div className="(flex:1) min-w(0)"><DemoLabel>w-full (height:3.5rem)</DemoLabel><DemoItem tone="violet" className="grid (place-content:center) (height:3.5rem) w-full mt-sm text-sm">Fluid</DemoItem></div>
    </div>
  </Demo>
}

export function FoundationShrink() {
  return <DemoContainer title="Keep long content within its cap" data-foundation="shrink" caption="The row stops at sm. The flexible text region can shrink below its content width.">
      <article className="flex gap-md w-full max-w-sm mx-auto p-md ui-sheet" data-elevation="1">
        <DemoItem className="grid shrink(0) (place-content:center) (height:2.5rem) (width:2.5rem) text-sm font-mono">FN</DemoItem>
        <div className="(flex:1) min-w(0)">
          <div className="text-sm font-semibold">Project archive</div>
          <p className="truncate mb(0) mx(0) mt-2xs text-sm fg-text-muted">field-notes-autumn-collection-final-v03.fig</p>
        </div>
      </article>
  </DemoContainer>
}

export function FoundationRadius() {
  return <Demo title="One scale, related surfaces" data-foundation="radius">
    <div className="grid-cols(3) gap-sm w-full">
      <div><DemoLabel>r-sm</DemoLabel><DemoItem className="grid (place-content:center) (height:5rem) mt-sm r-sm text-sm">Control</DemoItem></div>
      <div><DemoLabel>r-lg</DemoLabel><DemoItem className="grid (place-content:center) (height:5rem) mt-sm r-lg text-sm">Panel</DemoItem></div>
      <div><DemoLabel>r-2xl</DemoLabel><DemoItem className="grid (place-content:center) (height:5rem) mt-sm r-2xl text-sm">Feature</DemoItem></div>
    </div>
  </Demo>
}

export function FoundationShapes() {
  return <Demo title="Content-sized pill and width-led circle" data-foundation="shapes" caption="These links share a destination. Their shape is independent of their native navigation behavior.">
    <div className="flex flex-wrap items-end gap-lg">
      <div><DemoLabel>pill</DemoLabel><div className="mt-sm"><a href="#use-shape-shortcuts" className="inline-flex items-center justify-center min-h(44) py-sm px-md pill b-solid b(1) b-line-divider text-sm (text-decoration:none) bg-surface-raised fg-text-body">Pills and circles</a></div></div>
      <div><DemoLabel>w(48) (aspect-ratio:1/1) pill</DemoLabel><div className="mt-sm"><a href="#use-shape-shortcuts" aria-label="Pills and circles" className="inline-flex items-center justify-center w(48) (aspect-ratio:1/1) pill b-solid b(1) b-line-divider bg-surface-raised fg-text-blue"><IconArrowUp size={20} aria-hidden="true" /></a></div></div>
    </div>
  </Demo>
}
