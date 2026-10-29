'use client'

import { useEffect } from 'react'
import { usePathname } from '~/site/docs-shell/layouts/root'
import DocSidebar, { type DocSidebarProps } from '~/site/docs-shell/components/DocSidebar'

export default function ReferenceNavigation({ pageCategories }: Pick<DocSidebarProps, 'pageCategories'>) {
  const pathname = usePathname()
  useEffect(() => {
    function reveal() {
      const id = decodeURIComponent(location.hash.slice(1))
      const target = id && document.getElementById(id)
      if (!target) return
      let parent = target.parentElement
      while (parent) { if (parent instanceof HTMLDetailsElement) parent.open = true; parent = parent.parentElement }
      if (id) target.scrollIntoView({ block: 'start' })
    }
    reveal()
    window.addEventListener('hashchange', reveal)
    return () => window.removeEventListener('hashchange', reveal)
  }, [pathname])
  return <DocSidebar pageCategories={pageCategories} includeNestedPages />
}
