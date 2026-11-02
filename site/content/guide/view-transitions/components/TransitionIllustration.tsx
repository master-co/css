import DocumentIllustration from '~/site/components/DocumentIllustration'
import light from '../../../../assets/images/view-transitions/named-captures-light.png'
import dark from '../../../../assets/images/view-transitions/named-captures-dark.png'
import lifecycleLight from '../../../../assets/images/view-transitions/capture-lifecycle-light.png'
import lifecycleDark from '../../../../assets/images/view-transitions/capture-lifecycle-dark.png'
import identityLight from '../../../../assets/images/view-transitions/capture-identity-light.png'
import identityDark from '../../../../assets/images/view-transitions/capture-identity-dark.png'
import treeLight from '../../../../assets/images/view-transitions/capture-tree-light.png'
import treeDark from '../../../../assets/images/view-transitions/capture-tree-dark.png'
import navigationLight from '../../../../assets/images/view-transitions/capture-navigation-light.png'
import navigationDark from '../../../../assets/images/view-transitions/capture-navigation-dark.png'
import { transitionIllustration, transitionStudies, type TransitionStudyName } from '../illustration'

const images = {
  'capture-lifecycle': { light: lifecycleLight, dark: lifecycleDark },
  'capture-identity': { light: identityLight, dark: identityDark },
  'capture-tree': { light: treeLight, dark: treeDark },
  'capture-navigation': { light: navigationLight, dark: navigationDark }
}

export default function TransitionIllustration({ name }: { name?: TransitionStudyName }) {
  const figure = name ? transitionStudies[name] : transitionIllustration
  return <DocumentIllustration title={figure.title} alt={figure.alt} images={name ? images[name] : { light, dark }} caption={figure.caption}>
    <ol>{figure.description.map(item => <li key={item.title}><strong>{item.title}.</strong> {item.text}</li>)}</ol>
  </DocumentIllustration>
}
