'use client'

import '~/site/styles/documentation-values.css'
import { useState, useSyncExternalStore } from 'react'
import { IconCheck, IconCopy } from '@tabler/icons-react'

const subscribe = () => () => {}
const hydrated = () => true
const server = () => false

/** Content stays server-rendered; only clipboard feedback needs client state. */
export default function DocumentCopyButton({ text, label }: { text: string, label: string }) {
  const [status, setStatus] = useState('')
  const ready = useSyncExternalStore(subscribe, hydrated, server)
  return <>
    <button type="button" className="doc-copy-button" disabled={!ready} aria-label={`Copy ${label}`} onClick={async () => {
      try {
        await navigator.clipboard.writeText(text)
        setStatus(`${label} copied`)
      } catch {
        setStatus('Clipboard unavailable. Select the text to copy it.')
      }
    }}>
      {status === `${label} copied` ? <IconCheck size={14} aria-hidden="true" /> : <IconCopy size={14} aria-hidden="true" />}
      <span>Copy</span>
    </button>
    <span className={status.startsWith('Clipboard') ? 'doc-copy-status' : 'sr-only'} role="status">{status}</span>
  </>
}
