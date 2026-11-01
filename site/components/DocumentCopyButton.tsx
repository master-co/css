'use client'

import { useEffect, useState, useSyncExternalStore } from 'react'
import { IconCheck, IconCopy } from '@tabler/icons-react'

const subscribe = () => () => {}
const hydrated = () => true
const server = () => false

/** Content stays server-rendered; only clipboard feedback needs client state. */
export default function DocumentCopyButton({ text, label }: { text: string, label: string }) {
  const [result, setResult] = useState<'success' | 'error'>()
  const ready = useSyncExternalStore(subscribe, hydrated, server)
  useEffect(() => {
    if (result !== 'success') return
    const timer = setTimeout(() => setResult(undefined), 2000)
    return () => clearTimeout(timer)
  }, [result])
  return <span className="ui-copy">
    <button type="button" className="ui-button" data-size="sm" disabled={!ready} aria-label={`Copy ${label}`} onClick={async () => {
      try {
        await navigator.clipboard.writeText(text)
        setResult('success')
      } catch {
        setResult('error')
      }
    }}>
      {result === 'success' ? <IconCheck stroke={1.8} aria-hidden="true" /> : <IconCopy stroke={1.8} aria-hidden="true" />}
      Copy
    </button>
    <span className="ui-copy-status" role="status" data-result={result}>
      {result === 'success' && <>Copied<span className="sr-only"> {label}</span></>}
      {result === 'error' && 'Clipboard unavailable. Select the text to copy it.'}
    </span>
  </span>
}
