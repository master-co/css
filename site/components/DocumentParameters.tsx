import '~/site/styles/system/data.css'
import '~/site/styles/system/specimens.css'
import type { ReactNode } from 'react'
import DocumentIdentifier from './DocumentIdentifier'

export interface DocumentParameter {
  name: string
  type: string
  requirement?: string
  description: ReactNode
}

/** Name, type and requirement read as one term; descriptions use the remaining width. */
export default function DocumentParameters({ label, parameters }: { label: string, parameters: readonly DocumentParameter[] }) {
  return <dl className="ui-params" aria-label={label}>
    {parameters.map(parameter => <div key={parameter.name}>
      <dt>
        <span><DocumentIdentifier>{parameter.name}</DocumentIdentifier></span>
        <small>{parameter.type}</small>
        {parameter.requirement && (/^required$/i.test(parameter.requirement)
          ? <span className="ui-badge" data-size="sm">{parameter.requirement}</span>
          : <small>{parameter.requirement}</small>)}
      </dt>
      <dd><p>{parameter.description}</p></dd>
    </div>)}
  </dl>
}
