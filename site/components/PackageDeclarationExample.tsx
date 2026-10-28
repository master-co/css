import DocumentDeclaration from './DocumentDeclaration'
import { packageDeclaration } from '../utils/package-declaration'
import catalog from '../.generated/reference.json'

/** The gallery reads the same generated declaration as the linked Reference page. */
export default function PackageDeclarationExample({ identifier }: { identifier: string }) {
  return <DocumentDeclaration label={identifier}>{packageDeclaration(identifier, catalog)}</DocumentDeclaration>
}
