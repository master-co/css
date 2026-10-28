import Code from '~/site/docs-shell/components/Code'
import DemoConfiguredExample from './DemoConfiguredExample'
import GeneratedCSS from '../GeneratedCSS'
import { authoringSource, authoringHTML, authoringCSS } from '../../utils/authoring-examples'

export default function PackageAuthoringExample({ part = 'preview', code = true, previewFirst = false }: { part?: 'source' | 'preview'; code?: boolean; previewFirst?: boolean }) {
  if (part === 'source') return <Code lang="css" name="master.css">{authoringSource}</Code>
  return <>
    {code && !previewFirst && <Code lang="html">{authoringHTML}</Code>}
    <DemoConfiguredExample
      name="authoring-package" title="Shared package vocabulary" source={authoringSource} html={authoringHTML} code={false}
      caption="Hover or focus the button. The package defines its color, spacing, radius and focus outline. The transition follows your reduced-motion preference."
    />
    {code && previewFirst && <Code lang="html">{authoringHTML}</Code>}
    {code && <GeneratedCSS><Code lang="css" beautify>{authoringCSS()}</Code></GeneratedCSS>}
  </>
}
