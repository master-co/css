import Link from './Link'
import DocBadge from './DocBadge'
import clsx from 'clsx'

export default function HeaderNav({ name, children, isNew, className, ...props }: any) {
  return (
    <Link {...props} className={clsx('app-header-nav', className)} key={name} activeClassName="text-strong font-weight:460" noResolveRedirect ambiguous>
      {children}
      {isNew && <DocBadge />}
    </Link>
  )
}