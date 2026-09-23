import DemoWaterfall from './DemoWaterfall'
import { resourceWaterfalls } from '../../utils/first-paint-examples'

export default function ResourceWaterfall() {
  return <div data-first-paint="waterfalls">{resourceWaterfalls.map(scenario => <DemoWaterfall key={scenario.title} {...scenario} />)}</div>
}
