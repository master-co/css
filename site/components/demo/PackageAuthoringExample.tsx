import Code from 'internal/components/Code'
import DemoConfiguredExample from './DemoConfiguredExample'
import { authoringSource, authoringHTML, authoringCSS } from '../../utils/authoring-examples'

export default function PackageAuthoringExample({ part = 'preview', code = true }: { part?: 'source' | 'preview'; code?: boolean }) {
  if (part === 'source') return <Code lang="css" name="master.css">{authoringSource}</Code>
  return <>
    {code && <Code lang="html">{authoringHTML}</Code>}
    <DemoConfiguredExample
      name="authoring-package" title="Shared package vocabulary" source={authoringSource} html={authoringHTML} code={false}
      caption="Hover or focus the button. The package defines its color, spacing, radius and focus outline. The transition follows your reduced-motion preference."
    />
    {code && <details><summary>Generated CSS</summary><Code lang="css" beautify>{authoringCSS()}</Code></details>}
  </>
}
