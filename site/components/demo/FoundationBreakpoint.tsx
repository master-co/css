import Demo from './Demo'
import DemoViewport from './DemoViewport'
import { demoDocument } from './reference/document'

export default function FoundationBreakpoint() {
  const html = `<h1 data-target class="m:0 font:2xl font:3xl@md">Build for the current viewport</h1>
<p class="mt:sm text:muted">The heading changes at the md viewport threshold.</p>`
  const document = demoDocument({ page: 'guide/breakpoints', id: 'viewport', title: 'Viewport typography', html: [html], css: '', classes: [], classLists: [], highlighted: [] }, { html, caption: '' })
  return <Demo title="Viewport typography" padding="none" data-foundation="breakpoint" caption="Resize the actual iframe across md. The surrounding document keeps its own viewport.">
    <DemoViewport title="Viewport typography" document={document} responsive height={200} inspect={['font-size']} />
  </Demo>
}
