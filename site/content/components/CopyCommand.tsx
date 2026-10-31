'use client'

import { useEffect, useState } from 'react'
import { IconCheck, IconCopy } from '@tabler/icons-react'
import clsx from 'clsx'
import { useTranslation } from '~/site/docs-shell/contexts/i18n'

/** A shell command with a copy button. */
export default function CopyCommand({ className, command, wrap = false }: { className?: string, command: string, wrap?: boolean }) {
  const $ = useTranslation()
  const [status, setStatus] = useState<'idle' | 'copied' | 'failed'>('idle')

  useEffect(() => {
    if (status === 'idle') return
    const timeout = setTimeout(() => setStatus('idle'), 1800)
    return () => clearTimeout(timeout)
  }, [status])

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(command)
      setStatus('copied')
    } catch {
      setStatus('failed')
    }
  }

  return (
    <div className={clsx('home-command home-glass', className)} data-status={status}>
      <span aria-hidden="true" className="fg-text-muted">$</span>
      <code className={wrap ? '(overflow-wrap:anywhere) (min-width:0) (white-space:normal)' : '(overflow:hidden) (min-width:0) (text-overflow:ellipsis) (white-space:nowrap)'}>{command}</code>
      <button
        aria-label={status === 'copied' ? $('Copied') : $('Copy command')}
        className="home-command-copy"
        onClick={copy}
        type="button">
        {status === 'copied' ? <IconCheck aria-hidden="true" size={16} stroke={2} /> : <IconCopy aria-hidden="true" size={16} stroke={1.75} />}
      </button>
      <span aria-live="polite" className="sr-only">{status === 'copied' ? $('Copied') : status === 'failed' ? $('Copy failed') : ''}</span>
    </div>
  )
}
