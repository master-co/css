import Code from '../../../docs-shell/components/Code'
import { configuredExampleCSS, configuredMarkupClasses } from '../../../reference/configured-example'
import { foundationScene } from '../../../common/foundation-data/specimens'
import FoundationTokensView from './FoundationTokensView'

export default function FoundationTokens({ namespace, keys }: { namespace: string; keys?: string[] }) {
  const scene = keys && namespace !== 'color' && namespace !== 'breakpoints' ? foundationScene(namespace, keys) : undefined
  const source = scene?.html ? <details><summary>Specimen HTML and CSS</summary>
    <Code lang="html" beautify>{scene.html}</Code>
    <Code lang="css">{configuredExampleCSS(scene.css ?? '', configuredMarkupClasses(scene.html))}</Code>
  </details> : null
  return <FoundationTokensView namespace={namespace} keys={keys} source={source} />
}
