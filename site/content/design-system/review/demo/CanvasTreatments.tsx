import Demo from '~/site/components/demo/Demo'
import { DemoItem } from '~/site/components/demo/primitives'
import { canvasTreatments } from '../../components/catalog'

export default function CanvasTreatments() {
  return <div className="grid-cols(1) gap-md grid-cols(2)@sm">{canvasTreatments.map(choice =>
    <Demo key={choice.background} title={choice.title} background={choice.background} padding="sm" caption={choice.description}>
      <div className="flex gap-sm py-lg"><DemoItem>01</DemoItem><DemoItem>02</DemoItem><DemoItem>03</DemoItem></div>
    </Demo>)}
  </div>
}
