import styled from '@master/styled.react'
import Link from './Link'
import DocBadge from './DocBadge'
import clsx from 'clsx'

export default function Tabs(props: any) {
  return (
    <nav className={clsx('overflow-x:auto overflow-y:hidden hidden::scrollbar', props.className)}>
      {/* w:fit min-w:full 用於觸發 ResizeObserver */}
      <div className={clsx(
        'flex gap:xl w:fit min-w:full bb:1px|solid|subtle',
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
        'flex items-center justify-center h:48px mb:-1px by:2px|transparent|solid font-weight:460 white-space:nowrap app-nav',
        {
          'font:xs!': size === 'sm',
          'font:sm!': !size
        },
        props.className
      )}
      activeClassName="fg:accent! bb:accent"
      inactiveClassName="text:strong bb:major:hover">
      {children}
    </Link>
  )
}

export const TabBadge = styled.div(DocBadge)`ml:2x`

TabBadge.default = {
  color: 'primary',
  size: 'sm'
}
