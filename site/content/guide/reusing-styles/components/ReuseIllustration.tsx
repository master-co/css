import DocumentIllustration from '~/site/components/DocumentIllustration'
import light from '../../../../assets/images/reusing-styles/shared-and-local-light.png'
import dark from '../../../../assets/images/reusing-styles/shared-and-local-dark.png'
import { reuseIllustration as figure } from '../illustration'

export default function ReuseIllustration() {
  return <DocumentIllustration title={figure.title} alt={figure.alt} images={{ light, dark }} caption={figure.caption}>
    <ol>
      {figure.description.map(item => <li key={item.title}><strong>{item.title}.</strong> {item.text}</li>)}
    </ol>
  </DocumentIllustration>
}
