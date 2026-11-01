import Demo from './Demo'
import DemoViewport from './DemoViewport'
import { demoDocument } from './reference/document'

/** Site-owned example pages share the same keyboard-accessible viewport controls. */
export function DemoPageViewport({ src, title, height = 420 }: { src: string, title: string, height?: number }) {
  return <Demo title={title} frame="none" caption="Adjust the iframe viewport. Scroll inside the preview to see all content.">
    <DemoViewport src={src} title={title} height={height} responsive />
  </Demo>
}

/** The result of a setup step and the source that renders it, as one tray: a plain stage over the code, no browser chrome. */
export function DemoHelloWorld({ children }: { children?: React.ReactNode }) {
  return <Demo frame="none" source={children}>
    <div className="ui-browser" data-variant="plain">
      <div className="grid (place-items:center) p-lg p-2xl@sm ui-browser-body"><h1 className="m(0) italic font-4xl font-heavy text-center fg-text-strong font-5xl@sm">Hello World</h1></div>
    </div>
  </Demo>
}

/** Keep integration examples isolated from article typography and site-only utilities. */
export function DemoInstallation({ children }: { children?: React.ReactNode }) {
  const html = '<p id="master-check" class="w-fit p-md r-md text-sm bg-surface-raised fg-text-strong">Hello World</p>'
  const title = 'Check the installed styles'
  const caption = 'A raised surface, rounded corners and 1rem of padding on every side.'
  const section = { page: 'installation', id: 'check', title, html: [html], css: '', classes: [], classLists: [], highlighted: [] }
  const document = demoDocument(section, { html, caption, bodyClass: 'p-md' })
  return <Demo title={title} caption={caption} frame="none" source={children}>
    <DemoViewport title={title} document={document} sizing="content" />
  </Demo>
}
