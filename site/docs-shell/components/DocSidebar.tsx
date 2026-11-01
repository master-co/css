'use client'

import '~/site/styles/docs-shell/scrollbar.css'
import SearchButton from './SearchButton'
import { Fragment } from 'react'
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
  embedded?: boolean
  onNavigate?: () => void
}

export default function DocSidebar({ pageCategories, includeNestedPages = false, embedded = false, onNavigate }: DocSidebarProps) {
  const tw = useLocale() === 'tw'
  const entries = <SidebarEntries pageCategories={pageCategories} includeNestedPages={includeNestedPages} onNavigate={onNavigate} />
  if (embedded) return <nav className="doc-menu-documents" aria-label={tw ? '文件章節' : 'Documentation chapters'}>{entries}</nav>
  return <aside id="sidebar" aria-label={tw ? '文件導覽' : 'Documentation navigation'} className="sticky top(0) overflow-y-auto basis-auto grow(0) shrink(0) (height:100dvh) w(252) pb-2xl (padding-top:3.813rem) br-line-subtle br-solid br(1) (overscroll-behavior:contain) hidden@media(print) pr-xl@sm hidden@media(width<64rem) doc-sidebar scrollbar scrollbar-concealed">
    <div className="top(20) (z-index:1) flex items-center (margin-bottom:-1.875rem) (margin-inline:-1rem) px-md (padding-bottom:1.875rem) (padding-top:1.25rem) pointer-none sticky@md top(0)@md (background-image:linear-gradient(180deg,var(--color-surface-base)|0%,var(--color-surface-base)|calc(100%-2rem),transparent|100%))@md">
      <SearchButton className="flex items-center w-full font-sm (line-height:2.25rem) text-left fg-text-muted pointer-auto" />
    </div>
    {entries}
  </aside>
}

function SidebarEntries({ pageCategories, includeNestedPages, onNavigate }: Pick<DocSidebarProps, 'pageCategories' | 'includeNestedPages' | 'onNavigate'>) {
  const $ = useTranslation()
  const locale = useLocale()
  return <div className="relative_:is(h4,.app-nav)@layer(defaults) flex_:is(h4,.app-nav)@layer(defaults) items-center_:is(h4,.app-nav)@layer(defaults) (min-height:2rem)_:is(h4,.app-nav)@layer(defaults) (margin-top:1.5rem)_:is(h4)@layer(defaults) (padding-left:1rem)_.app-nav@layer(defaults) pt(0)_:is(h4)@layer(defaults) bl-line-subtle_.app-nav@layer(defaults) bl-solid_.app-nav@layer(defaults) bl(1)_.app-nav@layer(defaults) font-xs_:is(h4)@layer(defaults) (color:var(--color-text-muted))_.app-nav@layer(defaults) (color:var(--color-text-strong))_:is(h4)@layer(defaults) bg-text-muted_.app-nav:hover_svg@layer(defaults) absolute_svg inset(0)_svg (height:calc(100%-0.75rem))_svg w(2)_svg my-auto_svg ml(-1)_svg (contain:content):is(.app-nav,h4)">
        {pageCategories
          .filter((eachPageCategory: any) => eachPageCategory.name !== 'Overview')
          .map((eachPageCategory: any) => {
            const pages = eachPageCategory.pages.filter((metadata: any) => includeNestedPages || metadata.pathname.split('/').length === 3)
            if (pages.length === 0) return
            return (
              <Fragment key={eachPageCategory.name}>
                <h4>{$(eachPageCategory.name)}</h4>
                {pages
                  .map((metadata: any) => {
                    const translatedTitle = $(metadata.other?.subject || metadata.title.absolute || metadata.title)
                    return (
                      <Link activeClassName="active (font-weight:460) bg-accent_svg"
                        ambiguous
                        href={metadata.pathname}
                        className="app-nav"
                        scrollIntoView
                        disabled={metadata.disabled}
                        unfinished={metadata.unfinished}
                        onClick={onNavigate}
                        key={metadata.pathname}>
                        <div>
                          {!metadata.disabled && <svg></svg>}
                          {$(translatedTitle)}
                          {metadata.type === 'entity' && locale !== 'en' && translatedTitle !== metadata.title && <span className='(margin-left:.5em) font-xs vertical-top' translate='no'>{metadata.title}</span>}
                        </div>
                      </Link>
                    )
                  })}
              </Fragment>
            )
          })}
      </div>
}
