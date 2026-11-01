import DocumentIllustration from '~/site/components/DocumentIllustration'
import light from '../../../../../assets/images/migration-css-in-js/stable-class-light.png'
import dark from '../../../../../assets/images/migration-css-in-js/stable-class-dark.png'
import { cssInJSIllustration as figure } from '../illustration'
export default function CSSInJSIllustration() {
  return <DocumentIllustration title={figure.title} alt={figure.alt} images={{ light, dark }} caption={figure.caption}>
    <ol>{figure.description.map(item => <li key={item.title}><strong>{item.title}.</strong> {item.text}</li>)}</ol>
  </DocumentIllustration>
}
