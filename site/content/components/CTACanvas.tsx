'use client'

import { useEffect, useRef, useState } from 'react'

/** The words and actions render without JavaScript; only the silk and its lamp hydrate. */
export default function CTACanvas() {
  const ref = useRef<HTMLCanvasElement>(null)
  // A restored WebGL context remounts the field on a fresh canvas state.
  const [generation, setGeneration] = useState(0)
  useEffect(() => {
    const canvas = ref.current
    const host = canvas?.closest<HTMLElement>('.home-cta')
    if (!canvas || !host) return
    let disposed = false
    let cleanup: (() => void) | undefined
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return
      observer.disconnect()
      import('./cta-canvas').then(({ mountCTAField }) => {
        if (!disposed) cleanup = mountCTAField(host, canvas, () => setGeneration((value) => value + 1), generation > 0)
      }).catch(() => { /* The invitation and its single point remain complete without Canvas. */ })
    }, { rootMargin: '240px' })
    observer.observe(canvas)
    return () => {
      disposed = true
      observer.disconnect()
      cleanup?.()
    }
  }, [generation])
  return <canvas className="home-cta-canvas" ref={ref} aria-hidden="true" />
}
