import Code from '~/site/docs-shell/components/Code'
import DocumentCopyButton from './DocumentCopyButton'
import DocumentDisclosure from './DocumentDisclosure'

/** Full TypeScript remains server rendered and copyable, including long contracts. */
export default function DocumentDeclaration({ label, children }: { label: string, children: string }) {
  const lines = children.split('\n').length
  const code = <figure className="doc-declaration" aria-label={`${label} declaration`}>
    <figcaption><span>TypeScript</span><DocumentCopyButton label={`${label} declaration`} text={children} /></figcaption>
    <Code lang="typescript" beautify={false} dedent={false}>{children}</Code>
  </figure>
  return lines > 40 ? <DocumentDisclosure title={`Complete declaration · ${lines} lines`}>{code}</DocumentDisclosure> : code
}
