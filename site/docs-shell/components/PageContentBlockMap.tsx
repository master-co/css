'use client'

import clsx from 'clsx'
import { useTranslation } from '../contexts/i18n'
import { anchor } from '../utils/anchor'
import { usePageContent } from './PageContentContext'

export default function PageContentBlockMap() {
  const { activeTransitionsReady, currentId, currentParentId, items } = usePageContent()
  const $ = useTranslation()

  return (
    <nav aria-label={$('Page block map')} className="sticky top overflow-y:auto flex:0|0|2rem order:-1 h:100dvh py:35x hidden@print hidden@<lg scrollbar scrollbar-concealed">
      <div className="flex flex-col items-center justify-center gap:1px w:full min-h:full">
        {items.map((item) => {
          const active = currentId === item.id
          const activeParent = currentParentId === item.id
          const title = item.title.startsWith('`')
            ? item.title.replace(/`/g, '')
            : $(item.title)

          return (
            <button
              aria-current={active ? 'location' : undefined}
              aria-label={title}
              className="grid place-content:center h:14px w:24px p:0 b:0 r:xs outline-offset:4xs bg:transparent cursor:pointer outline:2px|solid|focus:focus"
              data-page-content-block-id={item.id}
              key={item.id}
              suppressHydrationWarning
              title={title}
              type="button"
              onClick={() => anchor(item.id, { offset: 110 })}
            >
              <span data-page-content-block-indicator suppressHydrationWarning className={clsx('block h:3px rounded opacity:.8!.active-parent w:16px!.active opacity:1!.active bg:accent!.active bg:accent/.45!.active-parent', {
                'transition:all|.15s': activeTransitionsReady,
                'active': active,
                'active-parent': activeParent,
                'w:14px bg:line-base opacity:.6': item.level === 2,
                'w:10px bg:line-muted opacity:.45': item.level === 3,
              })} />
            </button>
          )
        })}
      </div>
    </nav>
  )
}
