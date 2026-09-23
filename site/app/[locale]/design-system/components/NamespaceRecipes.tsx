import { DocumentNamespaceTable } from '~/site/components/DocumentValues'
import { variableNamespaceSources } from '~/site/utils/variable-namespace-sources'

export default function NamespaceRecipes() {
  return <DocumentNamespaceTable rows={variableNamespaceSources.filter(row => ['duration', 'color-text', 'spacing'].includes(row.namespace))} />
}
