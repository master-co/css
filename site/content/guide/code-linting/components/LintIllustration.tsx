import DocumentIllustration from '~/site/components/DocumentIllustration'
import light from '../../../../assets/images/code-linting/fix-and-review-light.png'
import dark from '../../../../assets/images/code-linting/fix-and-review-dark.png'
import { lintIllustration as figure } from '../illustration'
export default function LintIllustration() {
  return <DocumentIllustration title={figure.title} alt={figure.alt} images={{ light, dark }} caption={figure.caption}>
    <ol>{figure.description.map(item => <li key={item.title}><strong>{item.title}.</strong> {item.text}</li>)}</ol>
  </DocumentIllustration>
}
