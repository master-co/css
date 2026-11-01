import DocumentIllustration from '~/site/components/DocumentIllustration'
import light from '../../../../assets/images/theme/shared-spacing-light.png'
import dark from '../../../../assets/images/theme/shared-spacing-dark.png'
import { themeIllustration as figure } from '../illustration'

export default function ThemeIllustration() {
  return <DocumentIllustration title={figure.title} alt={figure.alt} images={{ light, dark }} caption={figure.caption}>
    <ol>
      {figure.description.map(item => <li key={item.title}><strong>{item.title}.</strong> {item.text}</li>)}
    </ol>
  </DocumentIllustration>
}
