import DocumentIllustration from '~/site/components/DocumentIllustration'
import light from '../../../../assets/images/view-transitions/named-captures-light.png'
import dark from '../../../../assets/images/view-transitions/named-captures-dark.png'
import { transitionIllustration as figure } from '../illustration'
export default function TransitionIllustration() {
  return <DocumentIllustration title={figure.title} alt={figure.alt} images={{ light, dark }} caption={figure.caption}>
    <ol>{figure.description.map(item => <li key={item.title}><strong>{item.title}.</strong> {item.text}</li>)}</ol>
  </DocumentIllustration>
}
