import { Demo, DemoItem } from '~/site/components/demo'
import { canvasTreatments } from '../../components/catalog'

export default function CanvasTreatments() {
  return <div className="review-demo-treatments">{canvasTreatments.map(choice =>
    <Demo key={choice.background} title={choice.title} background={choice.background} padding="md" caption={choice.description}>
      <DemoItem className="p-md text-align:center">Aa</DemoItem>
    </Demo>
  )}</div>
}
