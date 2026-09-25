'use client'

import '~/site/styles/demo-colors.css'
import '~/site/styles/demo.css'
import { createContext, useContext, useState, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { IconCopy } from '@tabler/icons-react'

const CopyFeedback = createContext<((message: string) => void) | null>(null)

export function DemoCopyGroup({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState('Select a swatch to copy its variable.')
  return <CopyFeedback.Provider value={setStatus}>
    <div className="demo-copy-group">
      <div className="demo-copy-feedback" role="status">{status}</div>
      {children}
    </div>
  </CopyFeedback.Provider>
}

interface Props extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onClick' | 'value'> {
  value: string
  label: string
  icon?: ReactNode
}

/** The visible status describes the actual clipboard result, including denial. */
export default function DemoCopyButton({ value, label, icon = <IconCopy size={15} stroke={1.6} aria-hidden="true" />, children, className, ...props }: Props) {
  const notify = useContext(CopyFeedback)
  const [status, setStatus] = useState('')
  const [busy, setBusy] = useState(false)
  const report = notify ?? setStatus
  async function copy() {
    if (busy) return
    setBusy(true)
    try {
      await navigator.clipboard.writeText(value)
      report(`Copied ${value}`)
    } catch {
      report(`Copy unavailable. Select this value: ${value}`)
    } finally { setBusy(false) }
  }
  return <span className="demo-copy">
    <button {...props} type="button" aria-label={label} className={className ?? 'demo-button demo-copy-button'} aria-busy={busy} onClick={copy}>{icon}{children}</button>
    {!notify && <span className="demo-copy-status" role="status">{status}</span>}
  </span>
}
