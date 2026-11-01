'use client'

import { createContext, ReactNode, useContext, useInsertionEffect, useLayoutEffect, useMemo, useState } from 'react'

export interface PageContentItem {
  id: string
  title: string
  level: 2 | 3
}

interface PageContentContextValue {
  items: PageContentItem[]
  currentId: string
}

declare global {
  interface Window {
    __pageContentInitialActiveId?: string
  }
}

const headingOffset = 110
const PageContentContext = createContext<PageContentContextValue | undefined>(undefined)

function computeActiveState(items: PageContentItem[]) {
  const headings = items
    .map((item) => document.getElementById(item.id))
    .filter((heading): heading is HTMLElement => Boolean(heading))
  if (!headings.length) {
    return { currentId: '' }
  }

  let currentId = headings[0].id
  // A section is being read once its heading passes a line a third of the way down the viewport (never above where an
  // in-page link lands it). Compared in page coordinates: a heading inside a positioned section reports its offsetTop
  // from that section.
  const top = window.scrollY + Math.max(headingOffset, window.innerHeight * 0.3)

  for (const heading of headings) {
    if (top >= heading.getBoundingClientRect().top + window.scrollY) {
      currentId = heading.id
    } else {
      break
    }
  }

  // A last section too short to reach the line is the one being read once the page can scroll no further.
  if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2) {
    currentId = headings[headings.length - 1].id
  }

  return { currentId }
}

function applyActiveState({ currentId }: { currentId: string }) {
  document.querySelectorAll<HTMLElement>('[data-page-content-nav-id]').forEach((nav) => {
    const id = nav.dataset.pageContentNavId
    if (currentId === id) {
      nav.setAttribute('aria-current', 'location')
    } else {
      nav.removeAttribute('aria-current')
    }
  })
}

export function PageContentProvider({ children, items }: {
  children: ReactNode
  items: PageContentItem[]
}) {
  const [currentId, setCurrentId] = useState('')

  useInsertionEffect(() => {
    applyActiveState(computeActiveState(items))
  }, [items])

  useLayoutEffect(() => {
    let animationFrame = 0
    let initialUpdateTimeout = 0

    const updateCurrentId = () => {
      animationFrame = 0
      const activeState = computeActiveState(items)

      applyActiveState(activeState)
      setCurrentId((previousId) => previousId === activeState.currentId ? previousId : activeState.currentId)
    }

    const requestUpdate = () => {
      if (animationFrame) return
      animationFrame = window.requestAnimationFrame(updateCurrentId)
    }

    updateCurrentId()
    initialUpdateTimeout = window.setTimeout(requestUpdate, 100)
    document.addEventListener('scroll', requestUpdate, {
      capture: true,
      passive: true
    })
    window.addEventListener('resize', requestUpdate, { passive: true })

    return () => {
      document.removeEventListener('scroll', requestUpdate, true)
      window.removeEventListener('resize', requestUpdate)
      window.clearTimeout(initialUpdateTimeout)
      if (animationFrame) {
        window.cancelAnimationFrame(animationFrame)
      }
    }
  }, [items])

  const value = useMemo(() => ({ currentId, items }), [currentId, items])

  return <PageContentContext.Provider value={value}>{children}</PageContentContext.Provider>
}

export function usePageContent() {
  const context = useContext(PageContentContext)
  if (!context) {
    throw new Error('usePageContent must be used inside PageContentProvider')
  }
  return context
}
