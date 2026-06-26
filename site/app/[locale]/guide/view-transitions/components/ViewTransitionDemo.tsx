'use client'

import clsx from 'clsx'
import Demo from 'internal/components/Demo'
import { useEffect, useState } from 'react'
import { flushSync } from 'react-dom'

type ViewTransitionDocument = Document & {
    startViewTransition?: (update: () => void) => void
}

const rootTransitionClassName = [
    'animation-duration:slow::vt-group(panel)',
    'animation-duration:slow::vt-group(title)',
].join(' ')

const views = [
    {
        id: 'overview',
        title: 'Overview',
        eyebrow: 'Root update',
        body: 'The browser captures the old card, applies the state update, then animates into the new card.',
        accent: 'bg:accent',
        tint: 'bg:accent-surface'
    },
    {
        id: 'product',
        title: 'Product detail',
        eyebrow: 'Named snapshot',
        body: 'The panel and title have stable view-transition-name values, so they transition apart from the root snapshot.',
        accent: 'bg:info',
        tint: 'bg:info/.14'
    },
    {
        id: 'settings',
        title: 'Settings',
        eyebrow: 'Fallback path',
        body: 'The click handler falls back to an immediate state update when the View Transition API is missing.',
        accent: 'bg:success',
        tint: 'bg:success/.14'
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
        <Demo className="container w:full">
            <span aria-hidden className={clsx(rootTransitionClassName, 'hidden')} />
            <div className="grid grid-cols:1 gap:lg w:full grid-cols:2@container(3xs)">
                <div className="grid grid-cols:1 gap:sm">
                    {views.map((view) => {
                        const activeButton = view.id === activeId
                        return (
                            <button
                                aria-pressed={activeButton}
                                className={clsx(
                                    'app-panel min-h:18x p:md text-left cursor:pointer',
                                    'b:1px|solid|base r:md',
                                    activeButton ? 'outline:2px|solid|accent surface:raised' : 'surface:raised:hover'
                                )}
                                key={view.id}
                                onClick={() => selectView(view.id)}
                                type="button"
                            >
                                <span className={clsx('inline-block size:2x mr:xs r:full', view.accent)} />
                                <span className="text:sm font:medium">{view.title}</span>
                                <span className="block mt:2xs text:xs text:body">{view.eyebrow}</span>
                            </button>
                        )
                    })}
                </div>
                <section className={clsx(
                    'app-panel rel overflow:hidden p:lg p:xl@container(3xs)',
                    'flex flex-col view-transition-name:panel',
                    active.tint
                )}>
                    <p className="m:0 text:xs font:medium text:body">{active.eyebrow}</p>
                    <h3 className="mx:0 mb:0 mt:sm text:2xl font:semibold view-transition-name:title text:3xl@container(3xs)">
                        {active.title}
                    </h3>
                    <div className={clsx('h:1x w:2em mt:md rounded opacity:.8', active.accent)} />
                    <p className="max-w:full mx:0 mb:0 mt:md text:sm text:body">
                        {active.body}
                    </p>
                </section>
            </div>
        </Demo>
    )
}
