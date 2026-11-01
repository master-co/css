'use client'

import '~/site/styles/docs-shell/page-content.css'
import Link from './Link'
import { useLayoutEffect, useMemo, useRef, type RefObject } from 'react'
import { useI18n, useTranslation } from '../contexts/i18n'
import { useLocale } from '../contexts/locale'
import { usePageContent, type PageContentItem } from './PageContentContext'
import PageContentTitle from './PageContentTitle'
import groupPageContent from '../utils/group-page-content'

const initializedPageContentScrollContainers = new WeakSet<HTMLElement>()

/**
 * The documentation rail (`ui-toc`): the page's contents and the source links. The rail stands still;
 * a list taller than the window scrolls inside it, so the source links stay in view under it.
 */
export default function PageContent({ metadata }: any) {
  const ref = useRef<HTMLOListElement>(null)
  const $ = useTranslation()

  return (
    <nav aria-labelledby="page-content-label" className="ui-toc" data-rail="">
      <h4 id="page-content-label">{$('On this page')}</h4>
      <PageContentList ref={ref} scrollContainerRef={ref} />
      <div className="ui-toc-actions">
        {metadata.sourcePath && <Link href={`https://github.com/master-co/css/blob/rc/${encodeURI(metadata.sourcePath)}`} indicate>
          {$('Edit this page')}
        </Link>}
        <Link href={`https://github.com/master-co/css/issues/new?assignees=&labels=documentation&template=docs_request.yml&labels=docs&title=📄+${metadata.title.absolute || metadata.title}:+`} indicate>
          {$('Issue on this page')}
        </Link>
      </div>
    </nav>
  )
}

/** A list longer than this folds every section but the one being read to its title. */
const foldAfter = 12

/**
 * The live list inside a `PageContentProvider`, nested as `ui-toc` lists: the entry being read carries
 * `aria-current="location"`. With a scroll container, the current entry is kept in view inside it. Titles are
 * translated unless they come from the page's own (already localized) headings.
 */
export function PageContentList({ ref, scrollContainerRef, lang, translate = true }: { ref?: RefObject<HTMLOListElement | null>, scrollContainerRef?: RefObject<HTMLElement | null>, lang?: string, translate?: boolean }) {
  const { currentId, items } = usePageContent()
  const fold = items.length > foldAfter && items.some((item) => item.level === 3)
  const nav = (item: PageContentItem) => <PageContentNav item={item} translate={translate} currentId={currentId} scrollContainerRef={scrollContainerRef} />
  return (
    <ol ref={ref} lang={lang} data-fold={fold ? '' : undefined}>
      {groupPageContent(items).map(({ item, children }) => (
        <li key={item.id}>
          {nav(item)}
          {children.length > 0 && <ol>{children.map((child) => <li key={child.id}>{nav(child)}</li>)}</ol>}
        </li>
      ))}
    </ol>
  )
}

function PageContentNav({ item: { id, title }, translate, currentId, scrollContainerRef }: {
  item: PageContentItem
  translate: boolean
  currentId: string
  scrollContainerRef?: RefObject<HTMLElement | null>
}) {
  const ref = useRef<HTMLAnchorElement>(null)
  const active = useMemo(() => currentId === id, [currentId, id])
  const $ = useTranslation()
  const { defaultLocale, hreflangOfLocale } = useI18n()
  const locale = useLocale()
  // A title the page's language has no translation for is read in its source language.
  const lang = translate && locale !== defaultLocale && !title.startsWith('`') && $(title) === title ? hreflangOfLocale?.[defaultLocale] ?? defaultLocale : undefined

  useLayoutEffect(() => {
    const container = scrollContainerRef?.current
    if (active && container && ref.current && container.scrollHeight > container.clientHeight) {
      const behavior: ScrollBehavior = initializedPageContentScrollContainers.has(container) && !matchMedia('(prefers-reduced-motion: reduce)').matches
        ? 'smooth'
        : 'instant' as ScrollBehavior

      // The current entry settles about a third of the way down the scrolling list.
      container.scrollTo({
        top: container.scrollTop + ref.current.getBoundingClientRect().top - container.getBoundingClientRect().top - container.clientHeight / 3,
        behavior
      })
      initializedPageContentScrollContainers.add(container)
    }
  }, [active, scrollContainerRef, currentId])

  // The bootstrap script marks the live entry before hydration, so its attribute may differ from the first render.
  return <Link ref={ref} href={'#' + id} aria-current={active ? 'location' : undefined} data-page-content-nav-id={id} lang={lang} suppressHydrationWarning>
    <PageContentTitle title={title} translate={translate ? $ : undefined} />
  </Link>
}
