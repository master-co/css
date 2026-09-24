import Code from '~/site/docs-shell/components/Code'
import DocumentCopyButton from './DocumentCopyButton'

export interface DocumentCodeExampleProps {
  title: string
  language: string
  source: string
  result?: string
  resultLanguage?: string
  sourceLabel?: string
  resultLabel?: string
  diagnostic?: { severity: 'Warning' | 'Error', rule: string, message: string }
}

/** Static, verified source/output pair. It does not simulate an editor or execute code. */
export default function DocumentCodeExample({ title, language, source, result, resultLanguage = language, sourceLabel = 'Source', resultLabel = 'Result', diagnostic }: DocumentCodeExampleProps) {
  return <figure className="doc-code-example" aria-label={title}>
    <figcaption>{title}</figcaption>
    <div className="doc-code-example-part">
      <div className="doc-code-example-bar"><span>{sourceLabel}</span><DocumentCopyButton text={source} label={`${title} — ${sourceLabel}`} /></div>
      <Code lang={language}>{source}</Code>
    </div>
    {diagnostic && <div className="doc-code-diagnostic" data-severity={diagnostic.severity.toLowerCase()}>
      <span className="doc-code-severity">{diagnostic.severity}</span>
      <code>{diagnostic.rule}</code>
      <p>{diagnostic.message}</p>
    </div>}
    {result !== undefined && <div className="doc-code-example-part">
      <div className="doc-code-example-bar"><span>{resultLabel}</span><DocumentCopyButton text={result} label={`${title} — ${resultLabel}`} /></div>
      <Code lang={resultLanguage}>{result}</Code>
    </div>}
  </figure>
}
