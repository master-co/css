import DocumentFlow from './DocumentFlow'
import { deliveryFlow, type DeliveryFlowName } from '../utils/delivery-flows'

export default function DeliveryFlow({ name }: { name: DeliveryFlowName }) {
  return <DocumentFlow {...deliveryFlow(name)} />
}
