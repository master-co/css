'use client'

import { useEffect, useRef, useSyncExternalStore } from 'react'
import { flushSync } from 'react-dom'

function subscribe(listener: () => void) {
  const media = matchMedia('(prefers-reduced-motion: reduce)')
  media.addEventListener('change', listener)
  return () => media.removeEventListener('change', listener)
}
function browserMode() {
  return matchMedia('(prefers-reduced-motion: reduce)').matches ? 'Reduced motion · instant update'
    : typeof document.startViewTransition === 'function' ? 'Native view transition' : 'API unavailable · instant update'
}

/** Use inside a dedicated example document so the root snapshot cannot capture the docs. */
export function useDemoViewTransition() {
  const active = useRef<ViewTransition | null>(null)
  const revision = useRef({ value: 0 })
  const mode = useSyncExternalStore(subscribe, browserMode, () => 'Ready')
  useEffect(() => {
    const requests = revision.current
    const media = matchMedia('(prefers-reduced-motion: reduce)')
    const changed = () => { if (media.matches) active.current?.skipTransition() }
    media.addEventListener('change', changed)
    return () => {
      requests.value++
      active.current?.skipTransition()
      media.removeEventListener('change', changed)
    }
  }, [])

  function run(update: () => void, focus?: () => HTMLElement | null) {
    const request = ++revision.current.value
    active.current?.skipTransition()
    const commit = () => {
      if (request !== revision.current.value) return
      flushSync(update)
      const target = focus?.()
      target?.focus({ preventScroll: true })
      if (target) {
        const bounds = target.getBoundingClientRect()
        const offset = bounds.top < 16 ? bounds.top - 16 : bounds.bottom > innerHeight - 16 ? bounds.bottom - innerHeight + 16 : 0
        if (offset) window.scrollBy({ top: offset, behavior: 'instant' })
      }
    }
    if (!document.startViewTransition || matchMedia('(prefers-reduced-motion: reduce)').matches) {
      commit()
      return
    }
    const transition = document.startViewTransition(commit)
    active.current = transition
    // Rapid selections can skip a snapshot; the DOM update still runs.
    void transition.ready.catch(() => {})
    // A failed update is an application error, not a reason to repeat the update.
    void transition.updateCallbackDone.catch(error => { reportError(error) })
    const finished = () => { if (active.current === transition) active.current = null }
    void transition.finished.then(finished, finished)
  }
  return { run, mode }
}
