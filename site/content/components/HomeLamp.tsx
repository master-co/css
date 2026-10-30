'use client'

import { useEffect } from 'react'

/** Hangs the page lamp over every `.home-lit` element below the hero and in the footer; without script, CSS keeps the resting light. */
export default function HomeLamp() {
  useEffect(() => {
    const root = document.body
    let cleanup: (() => void) | undefined
    let disposed = false
    // Only a failed download falls back silently to the resting light in CSS; a fault in the lamp surfaces.
    import('./home-lamp').then(({ mountHomeLamp }) => {
      if (!disposed) cleanup = mountHomeLamp(root)
    }, () => undefined)
    return () => {
      disposed = true
      cleanup?.()
    }
  }, [])
  return null
}
