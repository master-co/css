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
      'sticky top overflow-y:auto flex:0|0|auto h:100dvh w:252px pb:2xl pt:3.813rem br:1px|solid|subtle overscroll-behavior:contain hidden@print pr:xl@sm z:1050@<md surface:raised/.8@<md backdrop-filter:blur(25px)@<md px:5x@<sm scrollbar scrollbar-concealed',
      { 'hidden@<md': !opened }
    )}>
      <div className="top:20px z:1 flex items-center mx:-4x mb:-1.875rem px:md pb:1.875rem pt:5x untouchable sticky@md top@md bg:linear-gradient(180deg,surface-base|0%,surface-base|calc(100%-2rem),transparent|100%)@md">
        <SearchButton className="flex items-center w:full font:sm leading:2.25rem text-left text:disabled pointer-events:auto" />
      </div>
      <div className="{flex;min-h:8x;rel;align-items:center}_:is(h4,.app-nav)@default {pt:0;fg:var(--color-text-strong);mt:6x;text:12px}_:is(h4)@default {fg:var(--color-text-muted);pl:4x;bl:1px|solid|var(--color-line-muted)}_.app-nav@default bg:text-disabled_.app-nav:hover_svg@default {w:2px;h:calc(100%-3x);abs;inset:0;my:auto;margin-left:-1px}_svg contain:content:is(.app-nav,h4)">
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
                      <Link activeClassName="active font-weight:460 bg:accent_svg"
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
                          {metadata.type === 'entity' && locale !== 'en' && translatedTitle !== metadata.title && <span className='ml:.5em font:xs vertical-align:top' translate='no'>{metadata.title}</span>}
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
