export interface DocumentFlowStep {
  title: string
  description: string
}

export interface DocumentFlowProps {
  title: string
  steps: readonly DocumentFlowStep[]
  caption?: string
}

/** A static, ordered process; no timeline duration or interactive state is implied. */
export default function DocumentFlow({ title, steps, caption }: DocumentFlowProps) {
  return <figure className="doc-flow" aria-label={title}>
    <figcaption>{title}</figcaption>
    {/* eslint-disable-next-line jsx-a11y/no-redundant-roles -- Preserve WebKit list semantics when list-style is none. */}
    <ol role="list">
      {steps.map((step, index) => <li key={step.title}>
        <span className="doc-flow-number" aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
        <strong>{step.title}</strong>
        <p>{step.description}</p>
      </li>)}
    </ol>
    {caption && <p className="doc-flow-caption">{caption}</p>}
  </figure>
}
