import ConfiguredExample from '~/site/reference/ConfiguredExample'
import DemoConfiguredExample from '~/site/components/demo/DemoConfiguredExample'
import { componentMarkup, componentSource, themeMarkup, themeSource } from '../examples'

export default function ReleaseExample({ name }: { name: 'theme' | 'component' }) {
  if (name === 'theme') return <DemoConfiguredExample name="fieldwork-theme" title="A field note, in your colors" source={themeSource} html={themeMarkup} theme caption="Switch the color scheme: the accent and surface respond together, while the story’s spacing stays the same. Open the field note to read on." />
  return <ConfiguredExample source={componentSource} html={componentMarkup} />
}
