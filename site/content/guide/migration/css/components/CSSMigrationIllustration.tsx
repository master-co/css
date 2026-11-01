import DocumentIllustration from '~/site/components/DocumentIllustration'
import light from '../../../../../assets/images/migration-css/equivalent-card-light.png'
import dark from '../../../../../assets/images/migration-css/equivalent-card-dark.png'
import { cssMigrationIllustration as figure } from '../illustration'
export default function CSSMigrationIllustration() {
  return <DocumentIllustration title={figure.title} alt={figure.alt} images={{ light, dark }} caption={figure.caption}>
    <ol>{figure.description.map(item => <li key={item.title}><strong>{item.title}.</strong> {item.text}</li>)}</ol>
  </DocumentIllustration>
}
