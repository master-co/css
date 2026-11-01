import DocumentDisclosure from './DocumentDisclosure'

/** Full TypeScript remains server rendered and copyable, including long contracts. */
export default function DocumentDeclarationView({ source, children }: { source: string, children: React.ReactNode }) {
  const lines = source.split('\n').length
  return lines > 40 ? <DocumentDisclosure title={`Complete declaration · ${lines} lines`}>{children}</DocumentDisclosure> : children
}
