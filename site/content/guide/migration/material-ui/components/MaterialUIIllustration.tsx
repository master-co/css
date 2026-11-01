import DocumentIllustration from '~/site/components/DocumentIllustration'
import light from '../../../../../assets/images/migration-material-ui/resolve-sx-light.png'
import dark from '../../../../../assets/images/migration-material-ui/resolve-sx-dark.png'
import { materialUIIllustration as figure } from '../illustration'
export default function MaterialUIIllustration() {
  return <DocumentIllustration title={figure.title} alt={figure.alt} images={{ light, dark }} caption={figure.caption}>
    <ol>{figure.description.map(item => <li key={item.title}><strong>{item.title}.</strong> {item.text}</li>)}</ol>
  </DocumentIllustration>
}
