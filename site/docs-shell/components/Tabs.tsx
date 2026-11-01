import clsx from 'clsx'
import Link from './Link'

/** Links between sibling pages as underlined `ui-segmented` tabs; the page being read is underlined in ink (`aria-current="page"`). */
export default function Tabs({ className, children, ...props }: any) {
  return <nav {...props} className={clsx('ui-segmented', className)} data-variant="underline">{children}</nav>
}

export function Tab({ children, ...props }: any) {
  return <Link {...props}>{children}</Link>
}
