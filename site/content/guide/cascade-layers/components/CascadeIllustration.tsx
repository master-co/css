import DocumentIllustration from '~/site/components/DocumentIllustration'
import light from '../../../../assets/images/cascade-layers/local-padding-light.png'
import dark from '../../../../assets/images/cascade-layers/local-padding-dark.png'
import { cascadeIllustration as figure } from '../illustration'
export default function CascadeIllustration() {
  return <DocumentIllustration title={figure.title} alt={figure.alt} images={{ light, dark }} caption={figure.caption}>
    <ol>{figure.description.map(item => <li key={item.title}><strong>{item.title}.</strong> {item.text}</li>)}</ol>
  </DocumentIllustration>
}
