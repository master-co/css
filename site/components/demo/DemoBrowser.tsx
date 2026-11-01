import Demo from './Demo'
import DemoViewport from './DemoViewport'
import { demoDocument } from './reference/document'

/** Site-owned example pages share the same keyboard-accessible viewport controls. */
export function DemoPageViewport({ src, title, height = 420 }: { src: string, title: string, height?: number }) {
  return <Demo title={title} frame="none" caption="Adjust the iframe viewport. Scroll inside the preview to see all content.">
    <DemoViewport src={src} title={title} height={height} responsive />
  </Demo>
}

/** Keep integration examples isolated from article typography and site-only utilities. */
export function DemoInstallation({ children }: { children?: React.ReactNode }) {
  const html = '<p id="master-check" class="w-fit m(0) p-md b-solid b(1) b-line-divider r-md text-sm font-regular bg-surface-raised fg-text-strong">Hello World</p>'
  const title = 'Check the installed styles'
  const caption = 'A neutral surface, a fine border, small corners and 1rem of padding on every side.'
  const section = { page: 'installation', id: 'check', title, html: [html], css: '', classes: [], classLists: [], highlighted: [] }
  const document = demoDocument(section, { html, caption, bodyClass: 'p-md' })
  return <Demo title={title} caption={caption} frame="none" source={children}>
    <DemoViewport title={title} document={document} sizing="content" />
  </Demo>
}
