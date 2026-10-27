import '~/site/styles/documentation-values.css'
import type { ComponentPropsWithoutRef } from 'react'
import clsx from 'clsx'

/** Reading order stays in the authored document; columns depend on available space. */
export function DocumentSteps({ className, ...props }: ComponentPropsWithoutRef<'div'>) {
  return <div {...props} className={clsx('doc-steps', className)} />
}

export function DocumentStep({ columns = false, className, ...props }: ComponentPropsWithoutRef<'section'> & { columns?: boolean }) {
  return <section {...props} className={clsx('doc-step', className)} data-columns={columns || undefined} />
}

export function DocumentStepText(props: ComponentPropsWithoutRef<'div'>) {
  return <div {...props} className={clsx('doc-step-text', props.className)} />
}

export function DocumentStepBody(props: ComponentPropsWithoutRef<'div'>) {
  return <div {...props} className={clsx('doc-step-body', props.className)} />
}

/** Decorative numbering; the native heading supplies the accessible section title. */
export function DocumentStepNumber() {
  return <span className="doc-step-number" aria-hidden="true" />
}
