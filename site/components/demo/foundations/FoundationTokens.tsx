import Code from '../../../docs-shell/components/Code'
import { configuredExampleCSS, configuredMarkupClasses } from '../../../reference/configured-example'
import { foundationScene } from '../../../common/foundation-data/specimens'
import DocumentDisclosure from '../../DocumentDisclosure'
import FoundationTokensView from './FoundationTokensView'

export default function FoundationTokens({ namespace, keys }: { namespace: string; keys?: string[] }) {
  const scene = keys && namespace !== 'color' && namespace !== 'breakpoints' ? foundationScene(namespace, keys) : undefined
  const source = scene?.html ? <>
    <Code lang="html" beautify>{scene.html}</Code>
    <Code lang="css" name="Generated CSS" beautify>{configuredExampleCSS(scene.css ?? '', configuredMarkupClasses(scene.html))}</Code>
  </> : null
  return <FoundationTokensView namespace={namespace} keys={keys} presentation="guide" source={source && <DocumentDisclosure title="Example code">{source}</DocumentDisclosure>} />
}
