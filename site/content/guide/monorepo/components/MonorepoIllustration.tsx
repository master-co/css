import DocumentIllustration from '~/site/components/DocumentIllustration'
import light from '../../../../assets/images/monorepo/project-contexts-light.png'
import dark from '../../../../assets/images/monorepo/project-contexts-dark.png'
import { monorepoIllustration as figure } from '../illustration'
export default function MonorepoIllustration() {
  return <DocumentIllustration title={figure.title} alt={figure.alt} images={{ light, dark }} caption={figure.caption}>
    <ol>{figure.description.map(item => <li key={item.title}><strong>{item.title}.</strong> {item.text}</li>)}</ol>
  </DocumentIllustration>
}
