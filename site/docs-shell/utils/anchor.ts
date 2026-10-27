export function anchor(id: string, options?: any) {
  const element = document.getElementById(id)
  if (!element) {
    return
  }
  const elementPosition = (document.documentElement.scrollTop || document.body.scrollTop) + element.getBoundingClientRect().top
  const offsetPosition = elementPosition - (options?.offset || 0)
  history.pushState({}, '', window.location.pathname + '#' + id)
  if (options?.still) {
    document.body.scrollTop = document.documentElement.scrollTop = offsetPosition
  } else {
    window.scrollTo({
      top: offsetPosition,
      behavior: 'smooth'
    })
  }
}