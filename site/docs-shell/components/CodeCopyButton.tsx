'use client'

import { useEffect, useRef, useState } from 'react'
import { IconCheck, IconCopy } from '@tabler/icons-react'
import clsx from 'clsx'

export default function CodeCopyButton({ text, name, className }: { text: string, name?: string, className?: string }) {
  const [status, setStatus] = useState<'idle' | 'copied' | 'error'>('idle')
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const label = name ? `Copy ${name}` : 'Copy code'

  useEffect(() => () => {
    if (resetTimer.current) clearTimeout(resetTimer.current)
  }, [])

  function showStatus(next: 'copied' | 'error') {
    if (resetTimer.current) clearTimeout(resetTimer.current)
    setStatus(next)
    resetTimer.current = setTimeout(() => setStatus('idle'), next === 'error' ? 5000 : 2000)
  }

  return <div className={clsx('code-copy', className)}>
    <span className="code-copy-status" data-error={status === 'error' || undefined} role="status">
      {status === 'copied' ? `${name || 'Code'} copied` : status === 'error' ? 'Clipboard unavailable. Select the code to copy it.' : ''}
    </span>
    <button type="button" className="code-copy-button" aria-label={label} title={label} onClick={async () => {
      try {
        if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable')
        await navigator.clipboard.writeText(text)
        showStatus('copied')
      } catch {
        showStatus('error')
      }
    }}>
      {status === 'copied' ? <IconCheck size={16} aria-hidden="true" /> : <IconCopy size={16} aria-hidden="true" />}
    </button>
  </div>
}
