import DocumentIllustration from '~/site/components/DocumentIllustration'
import light from '../../../../../assets/images/migration-bootstrap/breakpoint-values-light.png'
import dark from '../../../../../assets/images/migration-bootstrap/breakpoint-values-dark.png'
import { bootstrapIllustration as figure } from '../illustration'
export default function BootstrapIllustration() {
  return <DocumentIllustration title={figure.title} alt={figure.alt} images={{ light, dark }} caption={figure.caption}>
    <ol>{figure.description.map(item => <li key={item.title}><strong>{item.title}.</strong> {item.text}</li>)}</ol>
  </DocumentIllustration>
}
