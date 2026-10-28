/** Read the exact generated declaration used by the linked package reference. */
export function packageDeclaration(identifier: string, catalog: { documents: readonly { kind: string, identifierAnchors?: unknown, markdown: string }[] }) {
  const doc = catalog.documents.find(doc => doc.kind === 'package' && (doc.identifierAnchors as Record<string, string> | undefined)?.[identifier])
  const anchor = (doc?.identifierAnchors as Record<string, string> | undefined)?.[identifier]
  const section = doc?.markdown.split(`{#${anchor}}\n`)[1]?.split(/\n#{2,3} /)[0]
  const declaration = section?.match(/```typescript declaration\n([\s\S]*?)\n```/)?.[1]
  if (!declaration) throw new Error(`Missing gallery declaration: ${identifier}`)
  return declaration
}
