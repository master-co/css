import styled from '@master/styled.react'
import Link from './Link'
import DocBadge from './DocBadge'
import clsx from 'clsx'

export default function Tabs(props: any) {
  return (
    <nav className={clsx('overflow-x:auto overflow-y:hidden display:none::scrollbar', props.className)}>
      {/* width:fit-content min-width:100% 用於觸發 ResizeObserver */}
      <div className={clsx(
        'display:flex gap-xl width:fit-content min-width:100% border-bottom:1px|solid|var(--color-line-subtle)',
        props.contentClassName
      )}>
        {props.children}
      </div>
    </nav>
  )
}

export function Tab(props: any) {
  const { children, size } = props
  return (
    <Link {...props}
      className={clsx(
        'display:flex align-items:center justify-content:center height:48px margin-bottom:-1px border-block:2px|transparent|solid font-weight:460 white-space:nowrap app-nav',
        {
          'font-xs!': size === 'sm',
          'font-sm!': !size
        },
        props.className
      )}
      activeClassName="fg-accent! bb-accent"
      inactiveClassName="fg-text-strong bb-major:hover">
      {children}
    </Link>
  )
}

export const TabBadge = styled.div(DocBadge)`margin-left:0.5rem`

TabBadge.default = {
  color: 'primary',
  size: 'sm'
}
