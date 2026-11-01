import DocumentIllustration from '~/site/components/DocumentIllustration'
import light from '../../../../assets/images/ai-coding/generated-and-computed-light.png'
import dark from '../../../../assets/images/ai-coding/generated-and-computed-dark.png'
import { aiIllustration as figure } from '../illustration'

export default function AIIllustration() {
  return <DocumentIllustration title={figure.title} alt={figure.alt} images={{ light, dark }} caption={figure.caption}>
    <ol>
      {figure.description.map(item => <li key={item.title}><strong>{item.title}.</strong> {item.text}</li>)}
    </ol>
  </DocumentIllustration>
}
