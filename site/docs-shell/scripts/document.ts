import { anchor } from '../utils/anchor'
import { snackbar } from '../utils/snackbar'
import './document-anchor'

function isPlainClick(event: MouseEvent) {
  return event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey
}

// Static markup has no React handlers; these delegated behaviors replace them.
document.addEventListener('click', (event) => {
  if (!(event.target instanceof Element) || !isPlainClick(event)) return
  const heading = event.target.closest<HTMLElement>('[data-doc-heading][id]')
  if (heading) {
    const link = location.origin + location.pathname + '#' + heading.id
    navigator.clipboard?.writeText(link).then(() => snackbar('Link copied <b>' + link + '</b>'), () => {})
  }
  if (event.defaultPrevented) return
  const hashLink = event.target.closest<HTMLAnchorElement>('a[href^="#"]')
  const id = hashLink && decodeURIComponent(hashLink.getAttribute('href')!.slice(1))
  if (id && document.getElementById(id)) {
    event.preventDefault()
    const contents = hashLink?.closest<HTMLDetailsElement>('[data-contents-disclosure]')
    if (contents) contents.open = false
    anchor(id, { offset: 110 })
  }
})

// Give bounded inline previews the same horizontal keys in every browser.
document.addEventListener('keydown', event => {
  if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return
  const element = event.target
  if (!(element instanceof HTMLElement) || !element.matches('[data-preview-scroll]')) return
  if ((event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') || element.scrollWidth <= element.clientWidth) return
  event.preventDefault()
  element.scrollBy({ left: event.key === 'ArrowRight' ? 40 : -40, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' })
})

// A table wider than its column scrolls sideways; only then does it take a tab stop, so keyboard users can scroll it.
// Tables inside islands are left to their components: changing their markup before hydration breaks it.
const tableSizes = new ResizeObserver(entries => {
  for (const { target } of entries) {
    const table = target as HTMLElement
    if (table.scrollWidth > table.clientWidth + 1) table.tabIndex = 0
    else table.removeAttribute('tabindex')
  }
})
document.querySelectorAll<HTMLElement>('.ui-table:not([tabindex])').forEach(table => { if (!table.closest('site-island')) tableSizes.observe(table) })
