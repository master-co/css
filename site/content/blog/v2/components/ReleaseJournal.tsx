import Demo, { DemoGeneratedCSS } from '~/site/components/demo/Demo'
import DemoViewport from '~/site/components/demo/DemoViewport'
import Code from '~/site/docs-shell/components/Code'
import CodeTabs from '~/site/docs-shell/components/CodeTabs'
import { demoDocument } from '~/site/components/demo/reference/document'
import { configuredExampleCSS, configuredMarkupClasses } from '~/site/reference/configured-example'
import { journalAssets, journalCaption, journalMarkup, journalSetup, journalSource, journalTitle } from '../journal'

/** The same authored HTML and CSS are rendered here and exported to Markdown. */
export default function ReleaseJournal() {
  const section = { page: 'release', id: 'fieldwork-journal', title: 'Fieldwork — a working journal', html: [journalMarkup], css: journalSource, classes: [], classLists: [], highlighted: [] }
  const document = demoDocument(section, { html: journalMarkup, caption: journalCaption, bodyClass: 'p-md' })
  const generated = configuredExampleCSS(journalSource, configuredMarkupClasses(journalMarkup))
  return <Demo title={journalTitle} caption={journalCaption} frame="none" data-release-journal source={
    <details className="ui-disclosure">
      <summary>View the HTML and CSS</summary>
      <p className="ui-tray-caption">{journalSetup}</p>
      <p className="ui-tray-caption">Download: {journalAssets.map((asset, index) => <span key={asset.href}>{index > 0 && ' · '}<a href={asset.href} download>{asset.label}</a></span>)}</p>
      <CodeTabs>{[{ name: 'CSS', lang: 'css', code: journalSource }, { name: 'HTML', lang: 'html', code: journalMarkup }]}</CodeTabs>
      <DemoGeneratedCSS><Code lang="css" beautify>{generated}</Code></DemoGeneratedCSS>
    </details>
  }>
    <DemoViewport title={section.title} document={document} responsive chrome={false} theme sizing="content" maxWidth={960} />
  </Demo>
}
