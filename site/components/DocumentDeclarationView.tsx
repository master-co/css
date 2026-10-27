import '~/site/styles/documentation-values.css'
import DocumentCopyButton from './DocumentCopyButton'
import DocumentDisclosure from './DocumentDisclosure'

/** Full TypeScript remains server rendered and copyable, including long contracts. */
export default function DocumentDeclarationView({ label, source, children }: { label: string, source: string, children: React.ReactNode }) {
  const lines = source.split('\n').length
  const code = <figure className="doc-declaration" aria-label={`${label} declaration`}>
    <figcaption><span>TypeScript</span><DocumentCopyButton label={`${label} declaration`} text={source} /></figcaption>
    {children}
  </figure>
  return lines > 40 ? <DocumentDisclosure title={`Complete declaration · ${lines} lines`}>{code}</DocumentDisclosure> : code
}
