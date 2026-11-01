import { IconCheck, IconCopy } from '@tabler/icons-react'
import clsx from 'clsx'

/**
 * Copies the code it belongs to through `docs-shell/scripts/code`: the icon swaps and the status beside it says what
 * happened (`data-result`). Pass `text` only when it differs from the rendered code lines.
 */
export default function CodeCopyButton({ text, name, className }: { text?: string, name?: string, className?: string }) {
  const label = name ? `Copy ${name}` : 'Copy code'
  return <span className={clsx('ui-copy', className)}>
    <span className="ui-copy-status" role="status"></span>
    <button type="button" className="ui-button" data-variant="quiet" data-shape="icon" data-size="sm" aria-label={label} title={label} data-code-copy={name ?? ''} data-code-copy-text={text}>
      <IconCopy size={16} stroke={1.5} aria-hidden="true" />
      <IconCheck size={16} stroke={1.6} aria-hidden="true" className="ui-result-icon" />
    </button>
  </span>
}
