import type { PageContentItem } from './PageContentContext'

function escapeScriptJson(value: unknown) {
  return JSON.stringify(value)
    .replace(/</g, '\\u003c')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029')
}

function pageContentBootstrap(items: Pick<PageContentItem, 'id' | 'level'>[]) {
  const headingOffset = 110
  let attempts = 0

  const run = () => {
    attempts += 1
    const headings = items
      .map((item) => document.getElementById(item.id))
      .filter((heading): heading is HTMLElement => Boolean(heading))
    const hasPageContentNav = document.querySelector('[data-page-content-nav-id]')

    if (!headings.length || !hasPageContentNav) {
      if (attempts < 120) {
        window.requestAnimationFrame(run)
      }
      return
    }

    let currentId = headings[0].id
    const top = window.scrollY + Math.max(headingOffset, window.innerHeight * 0.3)

    for (const heading of headings) {
      if (top >= heading.getBoundingClientRect().top + window.scrollY) {
        currentId = heading.id
      } else {
        break
      }
    }

    if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2) {
      currentId = headings[headings.length - 1].id
    }

    const currentIndex = items.findIndex((item) => item.id === currentId)
    let needsLayoutRetry = false
    ;(window as any).__pageContentInitialActiveId = currentId

    document.querySelectorAll<HTMLElement>('[data-page-content-nav-id]').forEach((nav) => {
      const id = nav.dataset.pageContentNavId
      if (currentId === id) {
        nav.setAttribute('aria-current', 'location')
      } else {
        nav.removeAttribute('aria-current')
      }
    })

    const activePageContentNav = Array.from(document.querySelectorAll<HTMLElement>('[data-page-content-nav-id]'))
      .find((nav) => nav.dataset.pageContentNavId === currentId)
    const pageContentScroll = activePageContentNav?.closest<HTMLElement>('.ui-toc[data-rail] > ol')
    if (activePageContentNav && pageContentScroll && window.innerWidth >= 1024) {
      if (pageContentScroll.offsetHeight && activePageContentNav.offsetHeight) {
        if (currentIndex <= 0 || activePageContentNav.offsetTop) {
          pageContentScroll.scrollTo({
            top: activePageContentNav.offsetTop - pageContentScroll.clientHeight / 3,
            behavior: 'instant'
          })
        } else {
          needsLayoutRetry = true
        }
      } else {
        needsLayoutRetry = true
      }
    }

    const sidebar = document.getElementById('sidebar')
    const sidebarLinks = Array.from(sidebar?.querySelectorAll<HTMLAnchorElement>('a.ui-nav-link[href]') || [])
    const activeSidebarLink = sidebar?.querySelector<HTMLElement>('a.ui-nav-link[aria-current]')
      || sidebarLinks.find((link) => {
        try {
          return new URL(link.getAttribute('href') || '', location.href).pathname === location.pathname
        } catch {
          return false
        }
      })
    if (sidebar && activeSidebarLink && window.innerWidth >= 768) {
      const activeSidebarIndex = sidebarLinks.indexOf(activeSidebarLink as HTMLAnchorElement)
      if (sidebar.offsetHeight && activeSidebarLink.offsetHeight) {
        if (activeSidebarIndex <= 0 || activeSidebarLink.offsetTop) {
          sidebar.scrollTo({
            top: activeSidebarLink.offsetTop + activeSidebarLink.offsetHeight - sidebar.clientHeight / 2,
            behavior: 'instant'
          })
        } else {
          needsLayoutRetry = true
        }
      } else {
        needsLayoutRetry = true
      }
    }

    if (needsLayoutRetry && attempts < 120) {
      window.requestAnimationFrame(run)
    }
  }

  run()
}

/** Marks the doc-page active state while the document parses, before islands hydrate. */
export default function PageContentBootstrap({ items }: {
  items: PageContentItem[]
}) {
  const serializedItems = escapeScriptJson(items.map(({ id, level }) => ({ id, level })))
  return (
    <script
      data-page-content-bootstrap
      id="page-content-bootstrap"
      dangerouslySetInnerHTML={{
        __html: `(${pageContentBootstrap.toString()})(${serializedItems});`
      }}
    />
  )
}
