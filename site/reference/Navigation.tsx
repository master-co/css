'use client'

import { useEffect } from 'react'
import usePathname from 'internal/uses/rewrited-pathname'
import DocSidebar from 'internal/components/DocSidebar'
import { referenceSections, type ReferenceDocument } from './types'

type Entry = Pick<ReferenceDocument, 'id' | 'kind' | 'title' | 'category' | 'url'>

export default function ReferenceNavigation({ documents, categoryOrder }: { documents: Entry[]; categoryOrder: string[] }) {
  const pathname = usePathname()
  const categories = referenceSections.flatMap(section => {
    const docs = documents.filter(doc => section.kinds.includes(doc.kind))
    return [...new Set(docs.map(doc => doc.category))]
      .sort((a, b) => categoryOrder.indexOf(a) - categoryOrder.indexOf(b))
      .map(name => ({ name, pages: docs.filter(doc => doc.category === name).map(doc => ({ title: doc.title, pathname: doc.url })) }))
  })
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
  return <DocSidebar pageCategories={categories} includeNestedPages />
}
