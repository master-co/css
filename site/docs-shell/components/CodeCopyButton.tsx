import { IconCheck, IconCopy } from '@tabler/icons-react'
import clsx from 'clsx'

/**
 * Copies the code it belongs to through `docs-shell/scripts/code`. Pass `text`
 * only when it differs from the rendered code lines.
 */
export default function CodeCopyButton({ text, name, className }: { text?: string, name?: string, className?: string }) {
  const label = name ? `Copy ${name}` : 'Copy code'
  return <div className={clsx('code-copy', className)}>
    <span className="code-copy-status" role="status"></span>
    <button type="button" className="code-copy-button" aria-label={label} title={label} data-code-copy={name ?? ''} data-code-copy-text={text}>
      <IconCopy size={16} aria-hidden="true" data-code-copy-idle="" />
      <IconCheck size={16} aria-hidden="true" data-code-copy-done="" />
    </button>
  </div>
}
