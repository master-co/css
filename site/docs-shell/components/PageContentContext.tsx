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
  currentParentId?: string
  activeTransitionsReady: boolean
}

declare global {
  interface Window {
    __pageContentInitialActiveId?: string
  }
}

const headingOffset = 110
const PageContentContext = createContext<PageContentContextValue | undefined>(undefined)

function getCurrentParentId(items: PageContentItem[], currentId: string) {
  const currentIndex = items.findIndex((item) => item.id === currentId)
  const currentItem = items[currentIndex]
  if (currentItem?.level !== 3) return

  for (let i = currentIndex - 1; i >= 0; i--) {
    if (items[i].level === 2) {
      return items[i].id
    }
  }
}

function computeActiveState(items: PageContentItem[]) {
  const headings = items
    .map((item) => document.getElementById(item.id))
    .filter((heading): heading is HTMLElement => Boolean(heading))
  if (!headings.length) {
    return { currentId: '' }
  }

  let currentId = headings[0].id
  const top = window.scrollY + headingOffset

  for (const heading of headings) {
    if (top >= heading.offsetTop) {
      currentId = heading.id
    } else {
      break
    }
  }

  return {
    currentId,
    currentParentId: getCurrentParentId(items, currentId)
  }
}

function applyActiveState({ currentId, currentParentId }: {
  currentId: string
  currentParentId?: string
}) {
  document.querySelectorAll<HTMLElement>('[data-page-content-nav-id]').forEach((nav) => {
    const id = nav.dataset.pageContentNavId
    const active = currentId === id
    nav.classList.toggle('active', active || currentParentId === id)
    if (active) {
      nav.setAttribute('aria-current', 'location')
    } else {
      nav.removeAttribute('aria-current')
    }
  })

  document.querySelectorAll<HTMLButtonElement>('[data-page-content-block-id]').forEach((button) => {
    const id = button.dataset.pageContentBlockId
    const active = currentId === id
    const activeParent = currentParentId === id
    const indicator = button.querySelector<HTMLElement>('[data-page-content-block-indicator]')

    if (active) {
      button.setAttribute('aria-current', 'location')
    } else {
      button.removeAttribute('aria-current')
    }

    indicator?.classList.toggle('active', active)
    indicator?.classList.toggle('active-parent', activeParent)
  })
}

export function PageContentProvider({ children, items }: {
  children: ReactNode
  items: PageContentItem[]
}) {
  const [currentId, setCurrentId] = useState('')
  const [activeTransitionsReady, setActiveTransitionsReady] = useState(false)

  useInsertionEffect(() => {
    applyActiveState(computeActiveState(items))
  }, [items])

  useLayoutEffect(() => {
    let animationFrame = 0
    let transitionReadyFrame = 0
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

    setActiveTransitionsReady(false)
    updateCurrentId()
    transitionReadyFrame = window.requestAnimationFrame(() => {
      transitionReadyFrame = 0
      setActiveTransitionsReady(true)
    })
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
      if (transitionReadyFrame) {
        window.cancelAnimationFrame(transitionReadyFrame)
      }
    }
  }, [items])

  const currentParentId = useMemo(() => getCurrentParentId(items, currentId), [currentId, items])

  const value = useMemo(() => ({
    activeTransitionsReady,
    currentId,
    currentParentId,
    items
  }), [activeTransitionsReady, currentId, currentParentId, items])

  return <PageContentContext.Provider value={value}>{children}</PageContentContext.Provider>
}

export function usePageContent() {
  const context = useContext(PageContentContext)
  if (!context) {
    throw new Error('usePageContent must be used inside PageContentProvider')
  }
  return context
}
