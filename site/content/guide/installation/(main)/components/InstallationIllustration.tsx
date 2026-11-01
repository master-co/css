import DocumentIllustration from '~/site/components/DocumentIllustration'
import light from '../../../../../assets/images/installation/setup-flow-light.png'
import dark from '../../../../../assets/images/installation/setup-flow-dark.png'
import { installationIllustration as figure } from '../illustration'

export default function InstallationIllustration() {
  return <DocumentIllustration title={figure.title} alt={figure.alt} images={{ light, dark }} caption={figure.caption}>
    <ol>
      {figure.description.map(item => <li key={item.title}><strong>{item.title}.</strong> {item.text}</li>)}
    </ol>
  </DocumentIllustration>
}
