import '~/site/styles/system/data.css'
import '~/site/styles/docs-shell/steps.css'
import clsx from 'clsx'
import type { ComponentPropsWithoutRef } from 'react'

/** Document steps on `ui-steps`: the list numbers each step beside its authored heading. */
export default function StepSection({ className, ...props }: ComponentPropsWithoutRef<'ol'>) {
  return <ol {...props} className={clsx('ui-steps', className)} data-variant="document" />
}

export function Step({ $row, className, children, ...props }: ComponentPropsWithoutRef<'div'> & { $row?: boolean }) {
  return <li><div {...props} className={clsx('ui-steps-content', className)} data-columns={$row || undefined}>{children}</div></li>
}

export function StepL({ className, ...props }: ComponentPropsWithoutRef<'div'>) {
  return <div {...props} className={clsx('ui-steps-text', className)} />
}

export function StepR({ className, ...props }: ComponentPropsWithoutRef<'div'>) {
  return <div {...props} className={clsx('ui-steps-source', className)} />
}
