import Code from '~/site/docs-shell/components/Code'
import CodeTabs from '~/site/docs-shell/components/CodeTabs'
import Demo, { DemoGeneratedCSS } from './Demo'
import DemoViewport from './DemoViewport'
import { demoDocument } from './reference/document'
import { configuredExampleCSS, configuredMarkupClasses } from '../../reference/configured-example'

export interface DemoConfiguredExampleProps {
  name: string
  title: string
  source: string
  /** Trusted site-authored markup; never pass user-provided HTML. */
  html: string
  caption: string
  theme?: boolean
  code?: boolean
  /** Render generated utilities inside a real, declarative shadow root. */
  shadow?: boolean
  responsive?: boolean
  motion?: boolean
  widthPresets?: readonly { label: string; width: number }[]
}

/**
 * One tray: the preview, its CSS and markup, and the closed generated stylesheet share the same literal source.
 * The CSS is beautified: MDX strips up to two spaces from each line of a multi-line attribute literal.
 */
export default function DemoConfiguredExample({ name, title, source, html, caption, theme, code = true, shadow = false, responsive, motion, widthPresets }: DemoConfiguredExampleProps) {
  const section = { page: 'project-styles', id: name, title, html: [html], css: source, classes: [], classLists: [], highlighted: [] }
  const generated = configuredExampleCSS(source, configuredMarkupClasses(html))
  const preview = shadow ? `<div data-demo-shadow><template shadowrootmode="open"><style>${generated.replaceAll('</style', '<\\/style')}</style>${html}</template></div>` : html
  const document = demoDocument(section, { html: preview, caption, bodyClass: 'p-md p(8)@media(width<240px)', motion })
  return <Demo title={title} caption={caption} frame="none" data-project-style={name} source={code && <>
    {source.trim()
      ? <CodeTabs>{[{ name: 'CSS', lang: 'css', beautify: true, code: source }, { name: 'HTML', lang: 'html', beautify: true, code: html }]}</CodeTabs>
      : <Code lang="html" beautify>{html}</Code>}
    <DemoGeneratedCSS><Code lang="css" beautify>{generated}</Code></DemoGeneratedCSS>
  </>}>
    <DemoViewport title={title} document={document} theme={theme} responsive={responsive} widthPresets={widthPresets} motion={motion} sizing="content" />
  </Demo>
}
