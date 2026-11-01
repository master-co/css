'use client'

import Link from './Link'
import { useTranslation } from '../contexts/i18n'
import type { DefinedMetadata } from '../types/Metadata'
import { useLocale } from '../contexts/locale'

export interface DocSidebarProps {
  pageCategories: {
    name: string,
    pages: (Pick<DefinedMetadata, 'pathname' | 'title'> & Partial<DefinedMetadata>)[]
  }[],
  includeNestedPages?: boolean
  /** Inside the compact menu: the groups only, without the documentation landmark. */
  embedded?: boolean
  onNavigate?: () => void
}

/** The documentation sidebar: one navigation group per category; the page being read inks a bar on the guide. Search lives in the header. */
export default function DocSidebar({ pageCategories, includeNestedPages = false, embedded = false, onNavigate }: DocSidebarProps) {
  const tw = useLocale() === 'tw'
  const groups = <SidebarGroups pageCategories={pageCategories} includeNestedPages={includeNestedPages} onNavigate={onNavigate} />
  if (embedded) return <div className="ui-sidebar">{groups}</div>
  return <aside id="sidebar" aria-label={tw ? '文件導覽' : 'Documentation navigation'} className="ui-sidebar">
    {groups}
  </aside>
}

function SidebarGroups({ pageCategories, includeNestedPages, onNavigate }: Pick<DocSidebarProps, 'pageCategories' | 'includeNestedPages' | 'onNavigate'>) {
  const $ = useTranslation()
  const locale = useLocale()
  return pageCategories
    .filter((eachPageCategory: any) => eachPageCategory.name !== 'Overview')
    .map((eachPageCategory: any) => {
      const pages = eachPageCategory.pages.filter((metadata: any) => includeNestedPages || metadata.pathname.split('/').length === 3)
      if (pages.length === 0) return null
      const name = $(eachPageCategory.name)
      return (
        <nav className="ui-nav-group" aria-label={name} key={eachPageCategory.name}>
          <h4>{name}</h4>
          {pages.map((metadata: any) => {
            const translatedTitle = $(metadata.other?.subject || metadata.title.absolute || metadata.title)
            return (
              <Link className="ui-nav-link"
                current="true"
                ambiguous
                href={metadata.pathname}
                scrollIntoView
                disabled={metadata.disabled}
                unfinished={metadata.unfinished}
                onClick={onNavigate}
                key={metadata.pathname}>
                {$(translatedTitle)}
                {metadata.type === 'entity' && locale !== 'en' && translatedTitle !== metadata.title && <small translate="no">{metadata.title}</small>}
              </Link>
            )
          })}
        </nav>
      )
    })
}
