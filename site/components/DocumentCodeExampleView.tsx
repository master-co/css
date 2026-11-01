import '~/site/styles/system/data.css'
import { IconAlertTriangle, IconCircleX } from '@tabler/icons-react'
import GeneratedCSS from './GeneratedCSS'

export interface DocumentCodeExampleViewProps {
  title: string
  /** Named code blocks: their bars carry the part's label and its copy control. */
  sourceCode: React.ReactNode
  resultCode?: React.ReactNode
  resultKind?: 'generated-css'
  diagnostic?: { severity: 'Warning' | 'Error', rule: string, message: string }
}

/** Static, verified source/output pair in one tray. It does not simulate an editor or execute code. */
export default function DocumentCodeExampleView({ title, sourceCode, resultCode, resultKind, diagnostic }: DocumentCodeExampleViewProps) {
  const DiagnosticIcon = diagnostic?.severity === 'Error' ? IconCircleX : IconAlertTriangle
  return <figure className="ui-tray" aria-label={title}>
    <figcaption className="ui-tray-head"><p className="ui-tray-title">{title}</p></figcaption>
    {sourceCode}
    {diagnostic && <div className="ui-callout" data-tone={diagnostic.severity === 'Error' ? 'danger' : 'warning'}>
      <DiagnosticIcon stroke={1.6} aria-hidden="true" />
      <div>
        <p><b>{diagnostic.severity}</b> · <code>{diagnostic.rule}</code></p>
        <p>{diagnostic.message}</p>
      </div>
    </div>}
    {resultCode && (resultKind === 'generated-css' ? <GeneratedCSS>{resultCode}</GeneratedCSS> : resultCode)}
  </figure>
}
