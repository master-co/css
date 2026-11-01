'use client'

import { createContext, useCallback, useContext, useState, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { IconCopy } from '@tabler/icons-react'

type Result = 'success' | 'error' | undefined
const CopyFeedback = createContext<((message: string, result: Result) => void) | null>(null)

/** One status for a set of copy actions, such as a palette. */
export function DemoCopyGroup({ children, instruction = 'Select a swatch to copy its variable.' }: { children: ReactNode, instruction?: string }) {
  const [state, setState] = useState<{ instruction: string, message: string, result: Result }>()
  const current = state?.instruction === instruction ? state : undefined
  const report = useCallback((message: string, result: Result) => setState({ instruction, message, result }), [instruction])
  return <CopyFeedback.Provider value={report}>
    <div className="grid gap-sm">
      <p className="m(0) ui-copy"><span className="ui-copy-status" role="status" data-result={current?.result}>{current?.message ?? instruction}</span></p>
      {children}
    </div>
  </CopyFeedback.Provider>
}

interface Props extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onClick' | 'value'> {
  value: string
  label: string
  icon?: ReactNode
  /** Short status for a specimen that already displays the copied value. */
  feedback?: 'value' | 'compact'
}

/** The visible status describes the actual clipboard result, including denial. */
export default function DemoCopyButton({ value, label, icon = <IconCopy aria-hidden="true" />, feedback = 'value', children, className, ...props }: Props) {
  const notify = useContext(CopyFeedback)
  const [status, setStatus] = useState<{ message: string, result: Result }>({ message: '', result: undefined })
  const [busy, setBusy] = useState(false)
  const report = notify ?? ((message: string, result: Result) => setStatus({ message, result }))
  async function copy() {
    if (busy) return
    setBusy(true)
    report('Copying…', undefined)
    try {
      if (!window.isSecureContext || !navigator.clipboard?.writeText) throw new Error('Clipboard unavailable')
      await navigator.clipboard.writeText(value)
      report(feedback === 'compact' ? 'Copied' : `Copied ${value}`, 'success')
    } catch {
      report(feedback === 'compact' ? 'Copy unavailable' : `Copy unavailable: ${value}`, 'error')
    } finally { setBusy(false) }
  }
  const button = <button data-size={className ? undefined : 'sm'} {...props} type="button" aria-label={label} className={className ?? 'ui-button'} aria-busy={busy} onClick={copy}>{icon}{children}</button>
  // Grouped buttons report to the shared status and stay direct children of their layout.
  if (notify) return button
  return <span className="ui-copy">{button}<span className="ui-copy-status" role="status" data-result={status.result}>{status.message}</span></span>
}
