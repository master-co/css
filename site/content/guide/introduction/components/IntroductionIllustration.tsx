import DocumentIllustration from '~/site/components/DocumentIllustration'
import light from '../../../../assets/images/introduction/class-to-css-light.png'
import dark from '../../../../assets/images/introduction/class-to-css-dark.png'
import { introductionIllustration as figure } from '../illustration'

export default function IntroductionIllustration() {
  return <DocumentIllustration title={figure.title} alt={figure.alt} images={{ light, dark }} caption={figure.caption}>
    <ol>
      {figure.description.map(item => <li key={item.title}><strong>{item.title}.</strong> {item.text}</li>)}
    </ol>
  </DocumentIllustration>
}
