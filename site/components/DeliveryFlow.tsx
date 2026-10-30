import DocumentFlow from './DocumentFlow'
import DocumentIllustration from './DocumentIllustration'
import { deliveryIllustrationImages } from './delivery-illustration-images'
import { deliveryFlow, deliveryIllustrations, type DeliveryFlowName } from '../utils/delivery-flows'

export default function DeliveryFlow({ name }: { name: DeliveryFlowName }) {
  const flow = deliveryFlow(name)
  if (name === 'runtime' || name === 'progressive' || name === 'hydration') {
    return <DocumentIllustration title={flow.title} alt={deliveryIllustrations[name].alt} images={deliveryIllustrationImages[name]} caption={flow.caption}>
      <ol>
        {flow.steps.map(step => <li key={step.title}><strong>{step.title}.</strong> {step.description}</li>)}
      </ol>
    </DocumentIllustration>
  }
  return <DocumentFlow {...flow} />
}
