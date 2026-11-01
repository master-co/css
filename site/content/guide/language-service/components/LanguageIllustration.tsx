import DocumentIllustration from '~/site/components/DocumentIllustration'
import light from '../../../../assets/images/language-service/project-completion-light.png'
import dark from '../../../../assets/images/language-service/project-completion-dark.png'
import { languageIllustration as figure } from '../illustration'

export default function LanguageIllustration() {
  return <DocumentIllustration title={figure.title} alt={figure.alt} images={{ light, dark }} caption={figure.caption}>
    <ol>
      {figure.description.map(item => <li key={item.title}><strong>{item.title}.</strong> {item.text}</li>)}
    </ol>
  </DocumentIllustration>
}
