import clsx from 'clsx'
import Link from './Link'

/** Links between sibling pages as a `ui-segmented` control; the page being read is raised (`aria-current="page"`). */
export default function Tabs({ className, children, ...props }: any) {
  return <nav {...props} className={clsx('ui-segmented', className)} data-size="lg">{children}</nav>
}

export function Tab({ children, ...props }: any) {
  return <Link {...props}>{children}</Link>
}
