'use client'

import { useEffect, useRef } from 'react'
import { IconPlayerPause, IconPlayerPlay } from '@tabler/icons-react'
import { useTranslation } from '~/site/docs-shell/contexts/i18n'
import type { WorkflowFigure } from './workflow-canvas'

/** Only the drawing hydrates. Links, code and native controls stay server rendered. */
export default function WorkflowCanvas({ figure }: { figure: WorkflowFigure }) {
  const $ = useTranslation()
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const canvas = ref.current
    const scene = canvas?.closest<HTMLElement>('.home-wf-scene')
    if (!canvas || !scene) return
    let disposed = false
    let cleanup: (() => void) | undefined
    // The lower-page illustrations do not load their painter until they approach the viewport.
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return
      observer.disconnect()
      import('./workflow-canvas').then(({ mountWorkflowCanvas }) => {
        if (!disposed) cleanup = mountWorkflowCanvas(scene, canvas, figure)
      }).catch(() => { /* Native content remains usable if the drawing cannot load. */ })
    }, { rootMargin: '240px' })
    observer.observe(scene)
    return () => {
      disposed = true
      observer.disconnect()
      cleanup?.()
    }
  }, [figure])
  return (
    <>
      <canvas aria-hidden="true" className="home-wf-canvas" ref={ref} />
      <button aria-label={$('Pause illustration')} className="home-wf-play" data-wf-play="" data-pause-label={$('Pause illustration')} data-play-label={$('Play illustration')} type="button">
        <IconPlayerPause aria-hidden="true" className="home-wf-pause-icon" size={14} stroke={1.75} />
        <IconPlayerPlay aria-hidden="true" className="home-wf-play-icon" size={14} stroke={1.75} />
      </button>
    </>
  )
}
