import DocumentIllustration from '~/site/components/DocumentIllustration'
import light from '../../../../../assets/images/migration-sass/compiler-boundary-light.png'
import dark from '../../../../../assets/images/migration-sass/compiler-boundary-dark.png'
import { sassIllustration as figure } from '../illustration'
export default function SassIllustration() {
  return <DocumentIllustration title={figure.title} alt={figure.alt} images={{ light, dark }} caption={figure.caption}>
    <ol>{figure.description.map(item => <li key={item.title}><strong>{item.title}.</strong> {item.text}</li>)}</ol>
  </DocumentIllustration>
}
