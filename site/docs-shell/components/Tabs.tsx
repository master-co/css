import styled from '@master/styled.react'
import Link from './Link'
import DocBadge from './DocBadge'
import clsx from 'clsx'

export default function Tabs(props: any) {
  return (
    <nav className={clsx('overflow-x:auto overflow-y:hidden display:none::-webkit-scrollbar', props.className)}>
      {/* width:fit-content min-width:100% 用於觸發 ResizeObserver */}
      <div className={clsx(
        'display:flex gap-xl width:fit-content min-width:100% bb-line-subtle border-bottom-style:solid border-bottom-width:1px',
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
        // Each state owns the bottom color: a token longhand does not override a native block shorthand.
        'display:flex align-items:center justify-content:center height:48px margin-bottom:-1px border-block-style:solid border-block-width:2px border-top-color:transparent font-weight:460 white-space:nowrap app-nav',
        {
          'font-xs!': size === 'sm',
          'font-sm!': !size
        },
        props.className
      )}
      activeClassName="fg-accent! bb-accent"
      inactiveClassName="fg-text-strong border-bottom-color:transparent bb-major:hover">
      {children}
    </Link>
  )
}

export const TabBadge = styled.div(DocBadge)`margin-left:0.5rem`

TabBadge.default = {
  color: 'primary',
  size: 'sm'
}
