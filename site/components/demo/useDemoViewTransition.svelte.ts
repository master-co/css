import { flushSync, onMount } from 'svelte'
import { createSubscriber } from 'svelte/reactivity'

const reducedMotion = '(prefers-reduced-motion: reduce)'
const subscribe = createSubscriber(update => {
  const media = matchMedia(reducedMotion)
  media.addEventListener('change', update)
  return () => media.removeEventListener('change', update)
})
function browserMode() {
  return matchMedia(reducedMotion).matches ? 'Reduced motion · instant update'
    : typeof document.startViewTransition === 'function' ? 'Native view transition' : 'API unavailable · instant update'
}

/**
 * Use inside a dedicated example document so the root snapshot cannot capture the docs.
 * Call it during component initialization. `mode` is reactive: read it from the returned object.
 */
export function useDemoViewTransition() {
  let active: ViewTransition | null = null
  let revision = 0
  // The server and the first client render agree on "Ready"; the browser's mode follows after mount.
  let mounted = $state(false)
  onMount(() => {
    mounted = true
    const media = matchMedia(reducedMotion)
    const changed = () => { if (media.matches) active?.skipTransition() }
    media.addEventListener('change', changed)
    return () => {
      revision++
      active?.skipTransition()
      media.removeEventListener('change', changed)
    }
  })

  function run(update: () => void, focus?: () => HTMLElement | null | undefined) {
    const request = ++revision
    active?.skipTransition()
    const commit = () => {
      if (request !== revision) return
      flushSync(update)
      const target = focus?.()
      target?.focus({ preventScroll: true })
      if (target) {
        const bounds = target.getBoundingClientRect()
        const offset = bounds.top < 16 ? bounds.top - 16 : bounds.bottom > innerHeight - 16 ? bounds.bottom - innerHeight + 16 : 0
        if (offset) window.scrollBy({ top: offset, behavior: 'instant' })
      }
    }
    if (!document.startViewTransition || matchMedia(reducedMotion).matches) {
      commit()
      return
    }
    const transition = document.startViewTransition(commit)
    active = transition
    // Rapid selections can skip a snapshot; the DOM update still runs.
    void transition.ready.catch(() => {})
    // A failed update is an application error, not a reason to repeat the update.
    void transition.updateCallbackDone.catch(error => { reportError(error) })
    const finished = () => { if (active === transition) active = null }
    void transition.finished.then(finished, finished)
  }
  return {
    run,
    get mode() {
      if (!mounted) return 'Ready'
      subscribe()
      return browserMode()
    }
  }
}
