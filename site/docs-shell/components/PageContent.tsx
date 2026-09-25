'use client'

import '~/site/styles/docs-shell/scrollbar.css'
import ContentsSvg from '../../public/images/contents.svg'
import { anchor } from '../utils/anchor'
import Link from './Link'
import { useLayoutEffect, useMemo, useRef } from 'react'
import clsx from 'clsx'
import { useTranslation } from '../contexts/i18n'
import Image from 'next/image'
import canIUseImg from '../../public/images/caniuse.favicon.png'
import mdnImg from '../../public/images/mdnwebdocs.png'
import { usePageContent } from './PageContentContext'

const initializedPageContentScrollContainers = new WeakSet<HTMLElement>()

export default function PageContent({ metadata }: any) {
  const { activeTransitionsReady, currentId, currentParentId, items: pageContent } = usePageContent()
  const ref = useRef<HTMLElement>(null)
  const pageDirname = metadata.fileURL?.substring(0, metadata.fileURL.lastIndexOf('/'))
  const pageContentPath = encodeURIComponent(metadata.sourcePath || ('site/app/[locale]/' + pageDirname?.match(/\[locale\]\/(.*)/)?.[1] + '/content.mdx'))
  const $ = useTranslation()

  return (
    <aside ref={ref} className="sticky top overflow-y:auto flex:0|0|auto h:100dvh w:calc(252/16*1rem) pb-2xl pt:8.75rem b-subtle:not(.top) hidden@print hidden@media((width<80rem)) bl:1px|solid|transparent@media((width<80rem)) surface-raised/.8@media((width<80rem)) backdrop-filter:blur(25px)@media((width<80rem)) scrollbar scrollbar-concealed">
      <div className="flex items-center mb-md">
        <ContentsSvg width="14" height="14" className="my:-1px ml:-0.125rem" fill="currentColor" />
        <span className=" ml-3xs font-xs">{$('On this page')}</span>
      </div>
      {(metadata.canIUseLink || metadata.mdnLink) &&
        <div className='flex gap:0.625rem mb-md'>
          {
            metadata.canIUseLink &&
            <Link href={metadata.canIUseLink} rel="noreferrer noopener" target="_blank" className="inline-flex overflow:hidden r-xs content:none::after">
              <Image src={canIUseImg} loading='eager' width={24} height={24} alt={$('Can I use ?')} />
            </Link>
          }
          {
            metadata.mdnLink &&
            <Link href={metadata.mdnLink} rel="noreferrer noopener" target="_blank" className="inline-flex overflow:hidden r-xs content:none::after">
              <Image src={mdnImg} loading='eager' width={24} height={24} alt={$('MDN Web Docs')} />
            </Link>
          }
        </div>
      }
      <ul className='pl-md bl:1px|solid|var(--color-line-muted)'>
        {
          pageContent.map((eachPageContentNav: any) => {
            return <li key={eachPageContentNav.id}>
              <PageContentNav {...eachPageContentNav} pageContent={pageContent} PageContentNav={eachPageContentNav} activeTransitionsReady={activeTransitionsReady} currentId={currentId} currentParentId={currentParentId} asideRef={ref}>
                {$(eachPageContentNav.title)}
              </PageContentNav>
            </li>
          })
        }
      </ul>
      <ul className='mt-sm'>
        <li>
          <Link className="block py-4xs text-xs! text-muted app-nav" href={`https://github.com/master-co/css/tree/rc/${pageContentPath}`} indicate>
            {$('Edit this page')}
          </Link>
        </li>
        <li>
          <Link className="block py-4xs text-xs! text-muted app-nav" href={`https://github.com/master-co/css/issues/new?assignees=&labels=documentation&template=docs_request.yml&labels=docs&title=📄+${metadata.title.absolute || metadata.title}:+`} indicate>
            {$('Issue on this page')}
          </Link>
        </li>
      </ul>
    </aside>
  )
}

function PageContentNav({ children, id, level, activeTransitionsReady, currentId, currentParentId, asideRef }: any) {
  const ref = useRef<HTMLAnchorElement>(null)
  const active = useMemo(() => currentId === id, [currentId, id])
  const $ = useTranslation()

  useLayoutEffect(() => {
    if (active && asideRef.current && ref.current) {
      const behavior: ScrollBehavior = initializedPageContentScrollContainers.has(asideRef.current)
        ? 'smooth'
        : 'instant' as ScrollBehavior

      asideRef.current.scrollTo({
        top: asideRef.current.scrollTop + ref.current.getBoundingClientRect().top - 180,
        behavior
      })
      initializedPageContentScrollContainers.add(asideRef.current)
    }
  }, [active, asideRef, currentId, currentParentId])

  const Text = useMemo(() => {
    if (typeof children === 'string') {
      if (children?.startsWith('`')) {
        return <code className='contents leading:1'>{children.replace(/`/g, '')}</code>
      } else {
        return $(children)
      }
    } else {
      return children
    }
  }, [$, children])

  return <Link ref={ref} href={'#' + id} aria-current={active ? 'location' : undefined} data-page-content-nav-id={id} suppressHydrationWarning className={clsx('flex items-center text-muted contain:content will-change:color app-nav fg-accent.active! fill-accent.active_svg', {
    'transition:color|.15s': activeTransitionsReady,
    'active': active || currentParentId === id,
    'min-h:32px': level === 2,
    'min-h:24px font-xs': level === 3,
  })}
    onClick={(event: any) => {
      event.preventDefault()
      anchor(id, { offset: 109 })
    }}>
    <div className={clsx({
      'min-h:32px py-4xs': level === 2,
      'ml:1em py:1px pl:1em text-indent:-1em': level === 3
    })}>
      {Text}
    </div>
  </Link>
}
