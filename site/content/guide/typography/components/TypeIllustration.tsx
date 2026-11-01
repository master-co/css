import DocumentIllustration from '~/site/components/DocumentIllustration'
import light from '../../../../assets/images/typography/line-rhythm-light.png'
import dark from '../../../../assets/images/typography/line-rhythm-dark.png'
import { typeIllustration as figure } from '../illustration'
export default function TypeIllustration() {
  return <DocumentIllustration title={figure.title} alt={figure.alt} images={{ light, dark }} caption={figure.caption}>
    <ol>{figure.description.map(item => <li key={item.title}><strong>{item.title}.</strong> {item.text}</li>)}</ol>
  </DocumentIllustration>
}
