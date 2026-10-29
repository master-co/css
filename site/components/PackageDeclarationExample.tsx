import DocumentDeclaration from './DocumentDeclaration'
import { packageDeclaration } from '../utils/package-declaration'
import { routeIndex } from '../reference/route-index'
import { loadReferenceDocument } from '../reference/load-document'

/** The gallery reads the same generated declaration as the linked Reference page. */
export default async function PackageDeclarationExample({ identifier }: { identifier: string }) {
  const packageName = identifier.match(/^(@[^/]+\/[^/#]+|[^/#]+)/)?.[0]
  const entry = routeIndex.find(doc => doc.kind === 'package' && doc.title === packageName)
  if (!entry) throw new Error(`Unknown package reference: ${identifier}`)
  const document = await loadReferenceDocument(entry.id)
  return <DocumentDeclaration label={identifier}>{packageDeclaration(identifier, { documents: [document] })}</DocumentDeclaration>
}
