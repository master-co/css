import type { ReactNode } from 'react'

export interface DocumentParameter {
  name: string
  type: string
  requirement?: string
  description: ReactNode
}

/** Parameter metadata stays with its term; descriptions use the full reading width. */
export default function DocumentParameters({ label, parameters }: { label: string, parameters: readonly DocumentParameter[] }) {
  return <dl className="doc-options doc-parameters" aria-label={label}>
    {parameters.map(parameter => <div className="doc-option" key={parameter.name}>
      <dt><code>{parameter.name}</code></dt>
      <dd>
        <div className="doc-parameter-meta"><code>{parameter.type}</code>{parameter.requirement && <span>{parameter.requirement}</span>}</div>
        <p>{parameter.description}</p>
      </dd>
    </div>)}
  </dl>
}
