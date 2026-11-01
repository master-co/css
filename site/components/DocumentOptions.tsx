import '~/site/styles/system/data.css'
import type { ReactNode } from 'react'
import DocumentIdentifier from './DocumentIdentifier'

export interface DocumentOption {
  name: string
  defaultValue?: string
  description: ReactNode
}

export function DocumentOptionList({ label, children }: { label: string, children: ReactNode }) {
  return <dl className="ui-params" aria-label={label}>{children}</dl>
}

export function DocumentOptionEntry({ name, children }: { name: string, children: ReactNode }) {
  return <div>
    <dt><DocumentIdentifier>{name}</DocumentIdentifier></dt>
    <dd>{children}</dd>
  </div>
}

/** Names keep their own column; defaults and prose stay readable on mobile. */
export default function DocumentOptions({ label, options }: { label: string, options: readonly DocumentOption[] }) {
  return <DocumentOptionList label={label}>
    {options.map(option => <DocumentOptionEntry name={option.name} key={option.name}>
      {option.defaultValue !== undefined && <small>Default <code>{option.defaultValue}</code></small>}
      <p>{option.description}</p>
    </DocumentOptionEntry>)}
  </DocumentOptionList>
}
