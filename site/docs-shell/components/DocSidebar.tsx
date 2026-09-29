'use client'

import SearchButton from './SearchButton'
import { Fragment, useRef, useState, useLayoutEffect } from 'react'
import Link from './Link'
import { useTranslation } from '../contexts/i18n'
import { usePathname } from 'next/navigation'
import clsx from 'clsx'
import { DefinedMetadata } from '../types/Metadata'
import { useLocale } from '../contexts/locale'

export default function DocSidebar({ pageCategories, includeNestedPages = false }: {
  pageCategories: {
    name: string,
    pages: (Pick<DefinedMetadata, 'pathname' | 'title'> & Partial<DefinedMetadata>)[]
  }[],
  includeNestedPages?: boolean
}) {
  const $ = useTranslation()
  const locale = useLocale()
  const [opened, setOpened] = useState(false)
  const pathname = usePathname()
  const sidebarRef = useRef<HTMLElement>(null)

  useLayoutEffect(() => {
    setOpened(false)
  }, [pathname])

  useLayoutEffect(() => {
    const toggle = () => {
      setOpened(!opened)
    }
    document.getElementById('sidebar-toggle')?.addEventListener('click', toggle, { passive: true })
    return () => {
      document.getElementById('sidebar-toggle')?.removeEventListener('click', toggle)
    }
  }, [opened])

  return (
    <aside id="sidebar" ref={sidebarRef} className={clsx(
      'position:sticky top:0 overflow-y:auto flex:0|0|auto height:100dvh width:252px pb-2xl padding-top:3.813rem border-right:1px|solid|var(--color-line-subtle) overscroll-behavior:contain display:none@print pr-xl@sm z-index:1050@media((width<64rem)) bg-surface-raised/.8@media((width<64rem)) backdrop-filter:blur(25px)@media((width<64rem)) padding-inline:1.25rem@media((width<52.125rem)) scrollbar scrollbar-concealed',
      { 'display:none@media((width<64rem))': !opened }
    )}>
      <div className="top:20px z-index:1 display:flex align-items:center margin-inline:-1rem margin-bottom:-1.875rem px-md padding-bottom:1.875rem padding-top:1.25rem pointer-events:none position:sticky@md top:0@md background-image:linear-gradient(180deg,var(--color-surface-base)|0%,var(--color-surface-base)|calc(100%-2rem),transparent|100%)@md">
        <SearchButton className="display:flex align-items:center width:100% font-sm line-height:2.25rem text-align:left fg-text-muted pointer-events:auto" />
      </div>
      <div className="{display:flex;min-height:2rem;position:relative;align-items:center}_:is(h4,.app-nav)@default {padding-top:0;color:var(--color-text-strong);margin-top:1.5rem;font-size:12px}_:is(h4)@default {color:var(--color-text-muted);padding-left:1rem;border-left:1px|solid|var(--color-line-subtle)}_.app-nav@default bg-text-muted_.app-nav:hover_svg@default {width:2px;height:calc(100%-0.75rem);position:absolute;inset:0;margin-block:auto;margin-left:-1px}_svg contain:content:is(.app-nav,h4)">
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
                      <Link activeClassName="active font-weight:460 bg-accent_svg"
                        ambiguous
                        href={metadata.pathname}
                        className="app-nav"
                        scrollIntoView
                        disabled={metadata.disabled}
                        unfinished={metadata.unfinished}
                        key={metadata.pathname}>
                        <div>
                          {!metadata.disabled && <svg></svg>}
                          {$(translatedTitle)}
                          {metadata.type === 'entity' && locale !== 'en' && translatedTitle !== metadata.title && <span className='margin-left:.5em font-xs vertical-align:top' translate='no'>{metadata.title}</span>}
                        </div>
                      </Link>
                    )
                  })}
              </Fragment>
            )
          })}
      </div>
    </aside>
  )
}
