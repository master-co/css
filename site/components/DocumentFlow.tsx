import '~/site/styles/system/data.css'

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
  return <figure className="ui-tray" aria-label={title}>
    <figcaption className="ui-tray-head"><p className="ui-tray-title">{title}</p></figcaption>
    <div className="ui-stage" data-padding="sm" data-align="start">
      {/* eslint-disable-next-line jsx-a11y/no-redundant-roles -- Preserve WebKit list semantics when list-style is none. */}
      <ol className="ui-steps" role="list">
        {steps.map(step => <li key={step.title}>
          <div>
            <h4>{step.title}</h4>
            <p>{step.description}</p>
          </div>
        </li>)}
      </ol>
    </div>
    {caption && <p className="ui-tray-caption">{caption}</p>}
  </figure>
}
