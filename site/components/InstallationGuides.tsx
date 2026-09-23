import IconButtons from 'internal/components/IconButtons'
import brands from 'internal/data/brands'
import { installationGuides } from '../utils/installation-guides'

export default function InstallationGuides() {
  return <IconButtons url="/guide/installation" className="my:xl grid-cols:6@sm grid-cols:8@lg">
    {installationGuides.map(([slug]) => brands[slug])}
  </IconButtons>
}
