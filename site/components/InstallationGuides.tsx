import IconButtons from '~/site/docs-shell/components/IconButtons'
import brands from '~/site/docs-shell/data/brands'
import { installationGuides } from '../utils/installation-guides'

export default function InstallationGuides() {
  return <IconButtons url="/guide/installation" className="my-xl grid-cols:6@sm grid-cols:8@lg">
    {installationGuides.map(([slug]) => brands[slug])}
  </IconButtons>
}
