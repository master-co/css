import '~/site/styles/docs-shell/steps.css'
import clsx from 'clsx'
import type { ComponentPropsWithoutRef } from 'react'

type BlockProps = ComponentPropsWithoutRef<'div'>

/** Steps follow the document's reading width, including inside the docs sidebar layout. */
export default function StepSection({ className, ...props }: BlockProps) {
  return <div {...props} className={clsx('step-section', className)} />
}

export function Step({ $row, className, ...props }: BlockProps & { $row?: boolean }) {
  return <div {...props} className={clsx('doc-install-step', className)} data-columns={$row || undefined} />
}

export function StepNum({ className, ...props }: ComponentPropsWithoutRef<'span'>) {
  return <span {...props} className={clsx('doc-install-step-number', className)} aria-hidden="true" />
}

export function StepEnd({ className, ...props }: ComponentPropsWithoutRef<'span'>) {
  return <span {...props} className={clsx('doc-install-step-end', className)} aria-hidden="true" />
}

export function StepL({ className, ...props }: BlockProps) {
  return <div {...props} className={clsx('doc-install-step-text', className)} />
}

export function StepR({ className, ...props }: BlockProps) {
  return <div {...props} className={clsx('doc-install-step-body', className)} />
}
