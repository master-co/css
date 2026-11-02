import DocumentIllustration from '~/site/components/DocumentIllustration'
import { releaseFigures, type ReleaseFigureName } from '../illustrations'
import fieldworkLight from '../../../../assets/images/release-v2/fieldwork-light.png'
import fieldworkDark from '../../../../assets/images/release-v2/fieldwork-dark.png'
import anatomyLight from '../../../../assets/images/release-v2/anatomy-light.png'
import anatomyDark from '../../../../assets/images/release-v2/anatomy-dark.png'
import tokensLight from '../../../../assets/images/release-v2/tokens-light.png'
import tokensDark from '../../../../assets/images/release-v2/tokens-dark.png'
import layersLight from '../../../../assets/images/release-v2/layers-light.png'
import layersDark from '../../../../assets/images/release-v2/layers-dark.png'
import deliveryLight from '../../../../assets/images/release-v2/delivery-light.png'
import deliveryDark from '../../../../assets/images/release-v2/delivery-dark.png'
import toolsLight from '../../../../assets/images/release-v2/tools-light.png'
import toolsDark from '../../../../assets/images/release-v2/tools-dark.png'

const images = {
  fieldwork: { light: fieldworkLight, dark: fieldworkDark },
  anatomy: { light: anatomyLight, dark: anatomyDark },
  tokens: { light: tokensLight, dark: tokensDark },
  layers: { light: layersLight, dark: layersDark },
  delivery: { light: deliveryLight, dark: deliveryDark },
  tools: { light: toolsLight, dark: toolsDark }
}

export default function ReleaseIllustration({ name }: { name: ReleaseFigureName }) {
  const figure = releaseFigures[name]
  return <DocumentIllustration title={figure.title} alt={figure.alt} caption={figure.caption} images={images[name]} fullSize>
    <ol>{figure.description.map(text => <li key={text}>{text}</li>)}</ol>
  </DocumentIllustration>
}
