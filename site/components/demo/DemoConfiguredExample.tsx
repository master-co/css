import Code from '~/site/docs-shell/components/Code'
import Demo from './Demo'
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
}

/** Configuration, preview and portable code use the same literal source. */
export default function DemoConfiguredExample({ name, title, source, html, caption, theme, code = true, shadow = false }: DemoConfiguredExampleProps) {
  const section = { page: 'project-styles', id: name, title, html: [html], css: source, classes: [], classLists: [], highlighted: [] }
  const shadowCSS = shadow ? configuredExampleCSS(source, configuredMarkupClasses(html)).replaceAll('</style', '<\\/style') : ''
  const preview = shadow ? `<div data-demo-shadow><template shadowrootmode="open"><style>${shadowCSS}</style>${html}</template></div>` : html
  const document = demoDocument(section, { html: preview, caption, bodyClass: 'p:md' })
  return <>
    {code && <>
      {source.trim() && <Code lang="css" name="Configuration">{source}</Code>}
      <Code lang="html" name="HTML">{html}</Code>
    </>}
    <Demo title={title} caption={caption} padding="none" background="plain" data-project-style={name}>
      <DemoViewport title={title} document={document} theme={theme} sizing="content" />
    </Demo>
    {code && <details>
      <summary>Generated CSS</summary>
      <Code lang="css" beautify>{configuredExampleCSS(source, configuredMarkupClasses(html))}</Code>
    </details>}
  </>
}
