import DocumentIllustration from '~/site/components/DocumentIllustration'
import light from '../../../../assets/images/authoring-packages/consumer-output-light.png'
import dark from '../../../../assets/images/authoring-packages/consumer-output-dark.png'
import { packageIllustration as figure } from '../illustration'

export default function PackageIllustration() {
  return <DocumentIllustration title={figure.title} alt={figure.alt} images={{ light, dark }} caption={figure.caption}>
    <ol>{figure.description.map(item => <li key={item.title}><strong>{item.title}.</strong> {item.text}</li>)}</ol>
  </DocumentIllustration>
}
