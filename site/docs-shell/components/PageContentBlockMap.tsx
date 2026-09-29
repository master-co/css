'use client'

import '~/site/styles/docs-shell/scrollbar.css'
import clsx from 'clsx'
import { useTranslation } from '../contexts/i18n'
import { anchor } from '../utils/anchor'
import { usePageContent } from './PageContentContext'

export default function PageContentBlockMap() {
  const { activeTransitionsReady, currentId, currentParentId, items } = usePageContent()
  const $ = useTranslation()

  return (
    <nav aria-label={$('Page block map')} className="position:sticky top:0 overflow-y:auto flex:0|0|2rem order:-1 height:100dvh padding-block:8.75rem display:none@print display:none@media((width<80rem)) scrollbar scrollbar-concealed">
      <div className="display:flex flex-direction:column align-items:center justify-content:center gap:1px width:100% min-height:100%">
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
              className="display:grid place-content:center height:14px width:24px padding:0 r-xs border-width:0 outline-offset-4xs background-color:transparent cursor:pointer outline:2px|solid|var(--color-focus):focus"
              data-page-content-block-id={item.id}
              key={item.id}
              suppressHydrationWarning
              title={title}
              type="button"
              onClick={() => anchor(item.id, { offset: 110 })}
            >
              <span data-page-content-block-indicator suppressHydrationWarning className={clsx('display:block height:3px border-radius:1e9em bg-accent/.45.active-parent! opacity:.8.active-parent! width:16px.active! bg-accent.active! opacity:1.active!', {
                'transition:all|.15s': activeTransitionsReady,
                'active': active,
                'active-parent': activeParent,
                'width:14px bg-line-divider opacity:.6': item.level === 2,
                'width:10px bg-line-subtle opacity:.45': item.level === 3,
              })} />
            </button>
          )
        })}
      </div>
    </nav>
  )
}
