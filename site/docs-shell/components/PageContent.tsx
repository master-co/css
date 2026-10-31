'use client'

import '~/site/styles/docs-shell/scrollbar.css'
import '~/site/styles/docs-shell/page-content.css'
import Link from './Link'
import { useLayoutEffect, useMemo, useRef, type RefObject } from 'react'
import clsx from 'clsx'
import { useI18n, useTranslation } from '../contexts/i18n'
import { useLocale } from '../contexts/locale'
import Image from './Image'
import canIUseImg from '~/site/assets/images/references/caniuse.png'
import mdnImg from '~/site/assets/images/references/mdn-web-docs.png'
import { usePageContent, type PageContentItem } from './PageContentContext'
import PageContentTitle from './PageContentTitle'

const initializedPageContentScrollContainers = new WeakSet<HTMLElement>()

/**
 * The documentation rail: the page's contents as a ruler, its references, and the source links. The rail stands still;
 * a list taller than the window scrolls inside it, so the source links stay in view under it.
 */
export default function PageContent({ metadata }: any) {
  const ref = useRef<HTMLDivElement>(null)
  const $ = useTranslation()

  return (
    <aside aria-label={$('On this page')} className="sticky top(0) basis-auto grow(0) shrink(0) (height:100dvh) (width:calc(252/16*1rem)) pb-2xl (padding-top:8.75rem) hidden@media(print) hidden@media((width<80rem)) doc-page-contents page-content">
      <span className="page-content-label">{$('On this page')}</span>
      {(metadata.canIUseLink || metadata.mdnLink) &&
        <div className="page-content-references">
          {
            metadata.canIUseLink &&
            <Link href={metadata.canIUseLink} rel="noreferrer noopener" target="_blank" className="(content:none)::after">
              <Image src={canIUseImg} loading='eager' width={24} height={24} alt={$('Can I use ?')} />
            </Link>
          }
          {
            metadata.mdnLink &&
            <Link href={metadata.mdnLink} rel="noreferrer noopener" target="_blank" className="(content:none)::after">
              <Image src={mdnImg} loading='eager' width={24} height={24} alt={$('MDN Web Docs')} />
            </Link>
          }
        </div>
      }
      <div ref={ref} className="page-content-scroll scrollbar scrollbar-concealed">
        <PageContentList scrollContainerRef={ref} />
      </div>
      <ul className="page-content-aside">
        {metadata.sourcePath && <li>
          <Link href={`https://github.com/master-co/css/blob/rc/${encodeURI(metadata.sourcePath)}`} indicate>
            {$('Edit this page')}
          </Link>
        </li>}
        <li>
          <Link href={`https://github.com/master-co/css/issues/new?assignees=&labels=documentation&template=docs_request.yml&labels=docs&title=📄+${metadata.title.absolute || metadata.title}:+`} indicate>
            {$('Issue on this page')}
          </Link>
        </li>
      </ul>
    </aside>
  )
}

/** A list longer than this folds every section but the one being read to its title. */
const foldAfter = 12

/**
 * The live list inside a `PageContentProvider`: the entry being read carries `aria-current` and the long tick. With a
 * scroll container, the current entry is kept in view inside it. Titles are translated unless they come from the
 * page's own (already localized) headings.
 */
export function PageContentList({ scrollContainerRef, lang, translate = true }: { scrollContainerRef?: RefObject<HTMLElement | null>, lang?: string, translate?: boolean }) {
  const { activeTransitionsReady, currentId, currentParentId, items } = usePageContent()
  const fold = items.length > foldAfter && items.some((item) => item.level === 3)
  return (
    <ol className="page-content-list" lang={lang} data-fold={fold ? '' : undefined}>
      {items.map((item) => (
        <li key={item.id} data-level={item.level}>
          <PageContentNav item={item} translate={translate} activeTransitionsReady={activeTransitionsReady} currentId={currentId} currentParentId={currentParentId} scrollContainerRef={scrollContainerRef} />
        </li>
      ))}
    </ol>
  )
}

function PageContentNav({ item: { id, level, title }, translate, activeTransitionsReady, currentId, currentParentId, scrollContainerRef }: {
  item: PageContentItem
  translate: boolean
  activeTransitionsReady: boolean
  currentId: string
  currentParentId?: string
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
  }, [active, scrollContainerRef, currentId, currentParentId])

  // The live state is pre-rendered and the transition enabled with an attribute: a class added after hydration would
  // start the Master CSS engine on every documentation page.
  return <Link ref={ref} href={'#' + id} aria-current={active ? 'location' : undefined} data-page-content-nav-id={id} data-level={level} lang={lang} data-transitions-ready={activeTransitionsReady ? '' : undefined} suppressHydrationWarning className={clsx('page-content-link', { active: active || currentParentId === id })}>
    <PageContentTitle title={title} translate={translate ? $ : undefined} />
  </Link>
}
