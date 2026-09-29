'use client'

import clsx from 'clsx'
import Demo from '~/site/docs-shell/components/Demo'
import { useEffect, useState } from 'react'
import { flushSync } from 'react-dom'

type ViewTransitionDocument = Document & {
  startViewTransition?: (update: () => void) => void
}

const rootTransitionClassName = [
  'animation-duration-slow::view-transition-group(panel)',
  'animation-duration-slow::view-transition-group(title)',
].join(' ')

const views = [
  {
    id: 'overview',
    title: 'Overview',
    eyebrow: 'Root update',
    body: 'The browser captures the old card, applies the state update, then animates into the new card.',
    accent: 'bg-accent',
    tint: 'bg-accent-surface'
  },
  {
    id: 'product',
    title: 'Product detail',
    eyebrow: 'Named snapshot',
    body: 'The panel and title have stable view-transition-name values, so they transition apart from the root snapshot.',
    accent: 'bg-info',
    tint: 'bg-info/.14'
  },
  {
    id: 'settings',
    title: 'Settings',
    eyebrow: 'Fallback path',
    body: 'The click handler falls back to an immediate state update when the View Transition API is missing.',
    accent: 'bg-success',
    tint: 'bg-success/.14'
  }
]

export default function ViewTransitionDemo() {
  const [activeId, setActiveId] = useState(views[0].id)
  const active = views.find((view) => view.id === activeId) ?? views[0]

  useEffect(() => {
    const rootClasses = rootTransitionClassName.split(' ')
    document.documentElement.classList.add(...rootClasses)
    return () => document.documentElement.classList.remove(...rootClasses)
  }, [])

  function selectView(nextId: string) {
    if (nextId === activeId) return

    const update = () => setActiveId(nextId)
    const transitionDocument = document as ViewTransitionDocument

    if (!transitionDocument.startViewTransition) {
      update()
      return
    }

    transitionDocument.startViewTransition(() => {
      flushSync(update)
    })
  }

  return (
    <Demo className="container-type:inline-size width:100%">
      <span aria-hidden className={clsx(rootTransitionClassName, 'display:none')} />
      <div className="grid-cols(1) display:grid gap-lg width:100% grid-cols(2)@container((width>=16rem))">
        <div className="grid-cols(1) display:grid gap-sm">
          {views.map((view) => {
            const activeButton = view.id === activeId
            return (
              <button
                aria-pressed={activeButton}
                className={clsx(
                  'min-height:4.5rem p-md text-align:left cursor:pointer app-panel',
                  'r-md border-width:1px border-style:solid b-line-divider',
                  activeButton ? 'outline-width:2px outline-style:solid outline-accent bg-surface-raised' : 'bg-surface-raised:hover'
                )}
                key={view.id}
                onClick={() => selectView(view.id)}
                type="button"
              >
                <span className={clsx('display:inline-block height:0.5rem width:0.5rem mr-xs border-radius:100%', view.accent)} />
                <span className="text-sm font-medium">{view.title}</span>
                <span className="display:block mt-2xs text-xs fg-text-body">{view.eyebrow}</span>
              </button>
            )
          })}
        </div>
        <section className={clsx(
          'position:relative overflow:hidden p-lg p-xl@container((width>=16rem)) app-panel',
          'display:flex flex-direction:column view-transition-name:panel',
          active.tint
        )}>
          <p className="margin:0 text-xs font-medium fg-text-body">{active.eyebrow}</p>
          <h3 className="margin-inline:0 mt-sm margin-bottom:0 text-2xl font-semibold view-transition-name:title text-3xl@container((width>=16rem))">
            {active.title}
          </h3>
          <div className={clsx('height:0.25rem width:2em mt-md border-radius:1e9em opacity:.8', active.accent)} />
          <p className="max-width:100% margin-inline:0 mt-md margin-bottom:0 text-sm fg-text-body">
            {active.body}
          </p>
        </section>
      </div>
    </Demo>
  )
}
