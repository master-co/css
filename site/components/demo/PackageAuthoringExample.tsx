import Code from '~/site/docs-shell/components/Code'
import Demo, { DemoGeneratedCSS } from './Demo'
import DemoViewport from './DemoViewport'
import { demoDocument } from './reference/document'
import { authoringSource, authoringHTML, authoringCSS } from '../../utils/authoring-examples'

const title = 'Shared package vocabulary'
const caption = 'Hover or focus the button. The package defines its color, spacing, radius and focus outline. The transition follows your reduced-motion preference.'

export default function PackageAuthoringExample({ part = 'preview', code = true }: { part?: 'source' | 'preview'; code?: boolean }) {
  if (part === 'source') return <Code lang="css" name="master.css">{authoringSource}</Code>
  const section = { page: 'project-styles', id: 'authoring-package', title, html: [authoringHTML], css: authoringSource, classes: [], classLists: [], highlighted: [] }
  return <Demo title={title} caption={caption} frame="none" data-project-style="authoring-package" source={code && <>
    <Code lang="html" name="HTML">{authoringHTML}</Code>
    <DemoGeneratedCSS><Code lang="css" beautify>{authoringCSS()}</Code></DemoGeneratedCSS>
  </>}>
    <DemoViewport title={title} document={demoDocument(section, { html: authoringHTML, caption, bodyClass: 'p-md p(8)@media((width<240px))' })} sizing="content" />
  </Demo>
}
