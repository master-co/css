import DocumentIllustration from '../components/DocumentIllustration'
import light from '../assets/images/reference-declarations/native-value-boundary-light.png'
import dark from '../assets/images/reference-declarations/native-value-boundary-dark.png'
import { referenceIllustrations, type ReferenceIllustrationId } from './illustrations'

const images = { 'native-value-boundary': { light, dark } }

export default function ReferenceIllustration({ id }: { id: ReferenceIllustrationId }) {
  const figure = referenceIllustrations[id]
  if (!figure) throw new Error(`Unknown Reference illustration: ${id}`)
  return <DocumentIllustration title={figure.title} alt={figure.alt} images={images[id]} caption={figure.caption}>
    <ol>{figure.description.map(text => <li key={text}>{text}</li>)}</ol>
  </DocumentIllustration>
}
