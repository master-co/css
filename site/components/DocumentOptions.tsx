import type { ReactNode } from 'react'

export interface DocumentOption {
  name: string
  defaultValue?: string
  description: ReactNode
}

export function DocumentOptionList({ label, children }: { label: string, children: ReactNode }) {
  return <dl className="doc-options" aria-label={label}>{children}</dl>
}

export function DocumentOptionEntry({ name, children }: { name: string, children: ReactNode }) {
  return <div className="doc-option">
    <dt><code>{name}</code></dt>
    <dd>{children}</dd>
  </div>
}

/** Long identifiers keep their own line; values and prose remain readable on mobile. */
export default function DocumentOptions({ label, options }: { label: string, options: readonly DocumentOption[] }) {
  return <DocumentOptionList label={label}>
    {options.map(option => <DocumentOptionEntry name={option.name} key={option.name}>
      {option.defaultValue !== undefined && <div className="doc-option-default"><span>Default</span><code>{option.defaultValue}</code></div>}
      <p>{option.description}</p>
    </DocumentOptionEntry>)}
  </DocumentOptionList>
}
