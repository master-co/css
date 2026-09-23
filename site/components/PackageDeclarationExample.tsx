import catalog from '../.generated/reference.json'
import DocumentDeclaration from './DocumentDeclaration'

/** The gallery reads the same generated declaration as the linked Reference page. */
export default function PackageDeclarationExample({ identifier }: { identifier: string }) {
  const doc = catalog.documents.find(doc => doc.kind === 'package' && (doc.identifierAnchors as Record<string, string> | undefined)?.[identifier])
  const anchor = (doc?.identifierAnchors as Record<string, string> | undefined)?.[identifier]
  const section = doc?.markdown.split(`{#${anchor}}\n`)[1]?.split(/\n#{2,3} /)[0]
  const declaration = section?.match(/```typescript declaration\n([\s\S]*?)\n```/)?.[1]
  if (!declaration) throw new Error(`Missing gallery declaration: ${identifier}`)
  return <DocumentDeclaration label={identifier}>{declaration}</DocumentDeclaration>
}
