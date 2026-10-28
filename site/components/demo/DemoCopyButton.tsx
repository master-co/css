'use client'

import '~/site/styles/demo-colors.css'
import '~/site/styles/demo.css'
import { createContext, useCallback, useContext, useState, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { IconCopy } from '@tabler/icons-react'

const CopyFeedback = createContext<((message: string) => void) | null>(null)

export function DemoCopyGroup({ children, instruction = 'Select a swatch to copy its variable.' }: { children: ReactNode, instruction?: string }) {
  const [result, setResult] = useState<{ instruction: string, message: string }>()
  const status = result?.instruction === instruction ? result.message : instruction
  const report = useCallback((message: string) => setResult({ instruction, message }), [instruction])
  return <CopyFeedback.Provider value={report}>
    <div className="demo-copy-group">
      <div className="demo-copy-feedback">
        <span className="demo-copy-reserve" aria-hidden="true">{instruction}</span>
        <span role="status">{status}</span>
      </div>
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
export default function DemoCopyButton({ value, label, icon = <IconCopy size={15} stroke={1.8} aria-hidden="true" />, children, className, ...props }: Props) {
  const notify = useContext(CopyFeedback)
  const [status, setStatus] = useState('')
  const [busy, setBusy] = useState(false)
  const report = notify ?? setStatus
  async function copy() {
    if (busy) return
    setBusy(true)
    try {
      if (!window.isSecureContext || !navigator.clipboard?.writeText) throw new Error('Clipboard unavailable')
      await navigator.clipboard.writeText(value)
      report(`Copied ${value}`)
    } catch {
      report(`Copy unavailable: ${value}`)
    } finally { setBusy(false) }
  }
  return <span className="demo-copy">
    <button {...props} type="button" aria-label={label} className={className ?? 'demo-button demo-copy-button'} aria-busy={busy} onClick={copy}>{icon}{children}</button>
    {!notify && <span className="demo-copy-status" role="status">{status}</span>}
  </span>
}
