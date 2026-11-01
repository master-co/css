import DocumentIllustration from '~/site/components/DocumentIllustration'
import light from '../../../../assets/images/global-styles/entry-graph-light.png'
import dark from '../../../../assets/images/global-styles/entry-graph-dark.png'
import { globalIllustration as figure } from '../illustration'

export default function GlobalIllustration() {
  return <DocumentIllustration title={figure.title} alt={figure.alt} images={{ light, dark }} caption={figure.caption}>
    <ol>{figure.description.map(item => <li key={item.title}><strong>{item.title}.</strong> {item.text}</li>)}</ol>
  </DocumentIllustration>
}
