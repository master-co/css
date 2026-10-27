'use client'

import { DemoControls, DemoLabel, DemoSurface } from '~/site/components/demo/primitives'
import { useDemoViewTransition } from '~/site/components/demo/useDemoViewTransition'
import { useState } from 'react'

const rootClasses = 'animation-slow::view-transition-group(demo-panel) animation-slow::view-transition-group(demo-heading)'
const views = [
  { id: 'overview', title: 'Overview', label: 'Workspace / 01', body: 'A shared workspace for the next release. Keep the plan, the work and the details together.' },
  { id: 'product', title: 'Product detail', label: 'Workspace / 02', body: 'The same panel and heading move into the next visual state. Their snapshot names remain stable.' },
  { id: 'settings', title: 'Settings', label: 'Workspace / 03', body: 'Update the view in place. The interface stays usable when animation is unavailable or motion is reduced.' },
]

export default function ViewTransitionScene() {
  const [activeId, setActiveId] = useState('overview')
  const active = views.find(view => view.id === activeId)!
  const { run, mode } = useDemoViewTransition(rootClasses)
  return <main className="p-md bg-surface-base fg-text-body">
    <DemoControls label="Choose a view">
      {views.map(view => <button key={view.id} type="button" className="demo-button" aria-pressed={activeId === view.id}
        onClick={() => { if (view.id !== activeId) run(() => setActiveId(view.id)) }}>{view.title}</button>)}
    </DemoControls>
    <DemoSurface className="mt-md p-lg view-transition-name:demo-panel">
      <DemoLabel>{active.label}</DemoLabel>
      <h1 className="mt-sm margin-bottom:0 text-2xl font-semibold view-transition-name:demo-heading">{active.title}</h1>
      <p className="mt-md margin-bottom:0 text-sm fg-text-muted">{active.body}</p>
    </DemoSurface>
    <p className="mt-sm margin-bottom:0 text-xs fg-text-muted" role="status">{active.title} · {mode}</p>
  </main>
}
