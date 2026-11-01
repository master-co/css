import '~/site/styles/docs-shell/docs.css'
import clsx from 'clsx'
import type { ComponentPropsWithoutRef } from 'react'

/** The documentation frame under the header: the sidebar, then the main column. */
export default function DocWrapper({ className, ...props }: ComponentPropsWithoutRef<'div'>) {
  return <div {...props} className={clsx('ui-docs', className)} />
}
