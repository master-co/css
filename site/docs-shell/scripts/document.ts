import { anchor } from '../utils/anchor'
import { snackbar } from '../utils/snackbar'

function isPlainClick(event: MouseEvent) {
  return event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey
}

// Static markup has no React handlers; these delegated behaviors replace them.
document.addEventListener('click', (event) => {
  if (!(event.target instanceof Element) || !isPlainClick(event)) return
  const heading = event.target.closest<HTMLElement>('[data-doc-heading][id]')
  if (heading) {
    const link = location.origin + location.pathname + '#' + heading.id
    snackbar('Link copied <b>' + link + '</b>')
    navigator.clipboard.writeText(link)
  }
  if (event.defaultPrevented) return
  const hashLink = event.target.closest<HTMLAnchorElement>('a[href^="#"]')
  const id = hashLink && decodeURIComponent(hashLink.getAttribute('href')!.slice(1))
  if (id && document.getElementById(id)) {
    event.preventDefault()
    anchor(id, { offset: 110 })
  }
})
