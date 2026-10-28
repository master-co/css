import { DocumentValueList } from '~/site/components/DocumentValues'
import { documentValueExamples } from './value-examples'

export default function DocumentValueExamples() {
  return <DocumentValueList rows={documentValueExamples} />
}
