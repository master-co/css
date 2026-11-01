import DocumentIllustration from '~/site/components/DocumentIllustration'
import light from '../../../../assets/images/compatibility/field-fallback-light.png'
import dark from '../../../../assets/images/compatibility/field-fallback-dark.png'
import { compatibilityIllustration as figure } from '../illustration'

export default function CompatibilityIllustration() {
  return <DocumentIllustration title={figure.title} alt={figure.alt} images={{ light, dark }} caption={figure.caption}>
    <ol>
      {figure.description.map(item => <li key={item.title}><strong>{item.title}.</strong> {item.text}</li>)}
    </ol>
  </DocumentIllustration>
}
