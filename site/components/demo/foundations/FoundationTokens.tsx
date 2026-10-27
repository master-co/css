import Code from '../../../docs-shell/components/Code'
import { configuredExampleCSS, configuredMarkupClasses } from '../../../reference/configured-example'
import { foundationScene } from '../../../common/foundation-data/specimens'
import GeneratedCSS from '../../GeneratedCSS'
import FoundationTokensView from './FoundationTokensView'

export default function FoundationTokens({ namespace, keys }: { namespace: string; keys?: string[] }) {
  const scene = keys && namespace !== 'color' && namespace !== 'breakpoints' ? foundationScene(namespace, keys) : undefined
  const source = scene?.html ? <>
    <Code lang="html" beautify>{scene.html}</Code>
    <GeneratedCSS><Code lang="css" beautify>{configuredExampleCSS(scene.css ?? '', configuredMarkupClasses(scene.html))}</Code></GeneratedCSS>
  </> : null
  return <FoundationTokensView namespace={namespace} keys={keys} source={source} />
}
