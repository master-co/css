import DocumentIllustration from '~/site/components/DocumentIllustration'
import light from '../../../../../assets/images/migration-tailwindcss/apply-contracts-light.png'
import dark from '../../../../../assets/images/migration-tailwindcss/apply-contracts-dark.png'
import { tailwindIllustration as figure } from '../illustration'
export default function TailwindIllustration() {
  return <DocumentIllustration title={figure.title} alt={figure.alt} images={{ light, dark }} caption={figure.caption}>
    <ol>{figure.description.map(item => <li key={item.title}><strong>{item.title}.</strong> {item.text}</li>)}</ol>
  </DocumentIllustration>
}
