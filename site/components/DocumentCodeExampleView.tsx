import '~/site/styles/documentation-values.css'
import DocumentCopyButton from './DocumentCopyButton'
import GeneratedCSS from './GeneratedCSS'

export interface DocumentCodeExampleViewProps {
  title: string
  sourceCode: React.ReactNode
  source: string
  result?: string
  resultCode?: React.ReactNode
  resultKind?: 'generated-css'
  sourceLabel?: string
  resultLabel?: string
  diagnostic?: { severity: 'Warning' | 'Error', rule: string, message: string }
}

/** Static, verified source/output pair. It does not simulate an editor or execute code. */
export default function DocumentCodeExampleView({ title, sourceCode, source, result, resultCode, resultKind, sourceLabel = 'Source', resultLabel = 'Result', diagnostic }: DocumentCodeExampleViewProps) {
  const output = result !== undefined && <div className="doc-code-example-part">
    <div className="doc-code-example-bar"><span>{resultLabel}</span><DocumentCopyButton text={result} label={`${title} — ${resultKind === 'generated-css' ? 'Generated CSS' : resultLabel}`} /></div>
    {resultCode}
  </div>
  return <figure className="doc-code-example" aria-label={title}>
    <figcaption>{title}</figcaption>
    <div className="doc-code-example-part">
      <div className="doc-code-example-bar"><span>{sourceLabel}</span><DocumentCopyButton text={source} label={`${title} — ${sourceLabel}`} /></div>
      {sourceCode}
    </div>
    {diagnostic && <div className="doc-code-diagnostic" data-severity={diagnostic.severity.toLowerCase()}>
      <span className="doc-code-severity">{diagnostic.severity}</span>
      <code>{diagnostic.rule}</code>
      <p>{diagnostic.message}</p>
    </div>}
    {output && (resultKind === 'generated-css' ? <GeneratedCSS>{output}</GeneratedCSS> : output)}
  </figure>
}
