/** Keep an initial article fragment in view while previews and fonts settle. */
export {}

const fragment = location.hash
let target: HTMLElement | null = null
try { target = document.getElementById(decodeURIComponent(fragment.slice(1))) } catch { /* A malformed fragment has no target. */ }
const article = target?.closest<HTMLElement>('main article.prose')
const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined

// Reload and history navigation keep the browser's own saved reading position.
if (navigation?.type === 'navigate' && fragment && target && article) {
  const destination = target
  const controller = new AbortController()
  let frame = 0
  let aligned = false
  let expectedScroll = scrollY
  const rootStyle = document.documentElement.style
  const previousAnchoring = rootStyle.getPropertyValue('overflow-anchor')
  const previousPriority = rootStyle.getPropertyPriority('overflow-anchor')
  // One mechanism owns the initial position; native anchoring resumes on reader intent.
  rootStyle.setProperty('overflow-anchor', 'none')

  const stop = () => {
    controller.abort()
    observer.disconnect()
    cancelAnimationFrame(frame)
    if (previousAnchoring) rootStyle.setProperty('overflow-anchor', previousAnchoring, previousPriority)
    else rootStyle.removeProperty('overflow-anchor')
  }
  const margin = () => parseFloat(getComputedStyle(destination).scrollMarginTop) || 0
  const align = () => {
    frame = 0
    if (controller.signal.aborted) return
    if (!destination.isConnected || location.hash !== fragment) return stop()
    // Native fragment navigation opens containing disclosures; preserve that behavior.
    if (destination.closest('details:not([open])')) return
    const offset = destination.getBoundingClientRect().top - margin()
    if (Math.abs(offset) > 1) scrollBy({ top: offset, behavior: 'instant' })
    expectedScroll = scrollY
    aligned = true
  }
  const schedule = () => {
    if (!frame && !controller.signal.aborted) frame = requestAnimationFrame(align)
  }
  const observer = new ResizeObserver(schedule)
  observer.observe(article)
  document.fonts.ready.then(schedule)

  // Reader intent ends stabilization, including assistive or scripted scrolling.
  for (const event of ['wheel', 'touchstart', 'pointerdown', 'keydown', 'hashchange', 'pagehide']) {
    window.addEventListener(event, stop, { once: true, passive: true, signal: controller.signal })
  }
  window.addEventListener('scroll', () => {
    if (aligned && Math.abs(scrollY - expectedScroll) > 1
      && Math.abs(destination.getBoundingClientRect().top - margin()) > 2) stop()
  }, { passive: true, signal: controller.signal })
}
