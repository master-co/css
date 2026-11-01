import styled from '@master/styled.react'
import Link from './Link'
import DocBadge from './DocBadge'
import clsx from 'clsx'

export default function Tabs(props: any) {
  return (
    <nav className={clsx('overflow-x-auto overflow-y-hidden hidden::-webkit-scrollbar', props.className)}>
      {/* w-fit min-w-full 用於觸發 ResizeObserver */}
      <div className={clsx(
        'flex gap-xl w-fit min-w-full bb-line-subtle bb-solid bb(1)',
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
        'flex items-center justify-center h(48) mb(-1) by-solid by(2) (border-top-color:transparent) (font-weight:460) whitespace-nowrap (user-select:none) doc-tab',
        {
          'font-xs!': size === 'sm',
          'font-sm!': !size
        },
        props.className
      )}
      activeClassName="fg-accent! bb-accent"
      inactiveClassName="fg-text-strong (border-bottom-color:transparent) bb-major:hover">
      {children}
    </Link>
  )
}

export const TabBadge = styled.div(DocBadge)`(margin-left:0.5rem)`

TabBadge.default = {
  color: 'primary',
  size: 'sm'
}
