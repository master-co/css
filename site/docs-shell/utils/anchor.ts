export function anchor(id: string, options?: { offset?: number; still?: boolean }) {
  const element = document.getElementById(id)
  if (!element) {
    return
  }
  for (let parent = element.parentElement; parent; parent = parent.parentElement) {
    if (parent instanceof HTMLDetailsElement) parent.open = true
  }
  const hadTabIndex = element.hasAttribute('tabindex')
  if (!hadTabIndex) element.setAttribute('tabindex', '-1')
  element.focus({ preventScroll: true })
  if (!hadTabIndex) element.addEventListener('blur', () => element.removeAttribute('tabindex'), { once: true })
  const elementPosition = (document.documentElement.scrollTop || document.body.scrollTop) + element.getBoundingClientRect().top
  const offsetPosition = elementPosition - (options?.offset ?? 0)
  history.pushState({}, '', window.location.pathname + '#' + id)
  if (options?.still) {
    document.body.scrollTop = document.documentElement.scrollTop = offsetPosition
  } else {
    window.scrollTo({
      top: offsetPosition,
      behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth'
    })
  }
}
