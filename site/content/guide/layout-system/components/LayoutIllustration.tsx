import DocumentIllustration from '~/site/components/DocumentIllustration'
import light from '../../../../assets/images/layout-system/coordinated-spans-light.png'
import dark from '../../../../assets/images/layout-system/coordinated-spans-dark.png'
import { layoutIllustration as figure } from '../illustration'
export default function LayoutIllustration() {
  return <DocumentIllustration title={figure.title} alt={figure.alt} images={{ light, dark }} caption={figure.caption}>
    <ol>{figure.description.map(item => <li key={item.title}><strong>{item.title}.</strong> {item.text}</li>)}</ol>
  </DocumentIllustration>
}
