import DemoTokenTable from '~/site/components/demo/DemoTokenTable'
import { getFontWeightRows } from './font-weight-data'

export default function FontWeightTokens() {
  return <DemoTokenTable descriptionTitle="Value / specimen" rows={getFontWeightRows().map(row => ({
    ...row, description: <span className="text-md" style={{ fontWeight: Number(row.value) }}>{row.description}</span>,
  }))} />
}
