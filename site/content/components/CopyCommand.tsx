'use client'

import { useEffect, useState } from 'react'
import { IconCheck, IconCopy } from '@tabler/icons-react'
import clsx from 'clsx'
import { useTranslation } from '~/site/docs-shell/contexts/i18n'

/** A shell command with a copy button. */
export default function CopyCommand({ className, command }: { className?: string, command: string }) {
  const $ = useTranslation()
  const [status, setStatus] = useState<'idle' | 'copied' | 'failed'>('idle')

  useEffect(() => {
    if (status === 'idle') return
    const timeout = setTimeout(() => setStatus('idle'), 1800)
    return () => clearTimeout(timeout)
  }, [status])

  return (
    <div className={clsx('home-command home-glass', className)}>
      <span aria-hidden="true" className="fg-text-muted">$</span>
      <code className="overflow:hidden min-width:0 text-overflow:ellipsis white-space:nowrap">{command}</code>
      <button
        aria-label={status === 'copied' ? $('Copied') : $('Copy command')}
        className="home-command-copy"
        onClick={() => navigator.clipboard.writeText(command).then(() => setStatus('copied'), () => setStatus('failed'))}
        type="button">
        {status === 'copied' ? <IconCheck aria-hidden="true" size={16} stroke={2} /> : <IconCopy aria-hidden="true" size={16} stroke={1.75} />}
      </button>
      <span aria-live="polite" className="sr-only">{status === 'copied' ? $('Copied') : status === 'failed' ? $('Copy failed') : ''}</span>
    </div>
  )
}
