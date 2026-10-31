'use client'

import { useEffect, useRef } from 'react'
import Link from '~/site/docs-shell/components/Link'
import { useTranslation } from '~/site/docs-shell/contexts/i18n'

export interface BlogArticleSection {
  id: string
  title: string
}

/**
 * A quiet contents rail beside wide reading columns. The section being read carries the page's one live mark.
 * It is rendered complete on the server; the script only moves that mark.
 */
export default function BlogArticleContents({ items, lang }: { items: BlogArticleSection[], lang?: string }) {
  const $ = useTranslation()
  const listRef = useRef<HTMLOListElement>(null)

  useEffect(() => {
    const list = listRef.current
    if (!list) return
    const links = Array.from(list.querySelectorAll<HTMLAnchorElement>('a[href^="#"]'))
    const headings = links
      .map((link) => document.getElementById(decodeURIComponent(link.hash.slice(1))))
      .filter((heading): heading is HTMLElement => !!heading)
    if (!headings.length) return
    let frame = 0
    const update = () => {
      frame = 0
      // Below the rail's breakpoint it is not displayed; the post's own contents list stands in for it.
      if (!list.offsetParent) return
      // The current section is the last heading that has passed a line a third of the way down the viewport.
      const line = innerHeight * 0.32
      let current = -1
      headings.forEach((heading, index) => {
        if (heading.getBoundingClientRect().top <= line) current = index
      })
      const atEnd = innerHeight + scrollY >= document.documentElement.scrollHeight - 2
      if (atEnd) current = headings.length - 1
      links.forEach((link, index) => {
        const active = index === current
        if (active) link.setAttribute('aria-current', 'location')
        else link.removeAttribute('aria-current')
      })
    }
    const request = () => { if (!frame) frame = requestAnimationFrame(update) }
    update()
    addEventListener('scroll', request, { passive: true })
    addEventListener('resize', request)
    return () => {
      cancelAnimationFrame(frame)
      removeEventListener('scroll', request)
      removeEventListener('resize', request)
    }
  }, [])

  return (
    <nav className="blog-article-contents" aria-labelledby="blog-article-contents-title">
      <p className="blog-article-contents-title" id="blog-article-contents-title">{$('On this page')}</p>
      <ol ref={listRef} lang={lang}>
        {items.map((item) => (
          <li key={item.id}>
            <Link href={'#' + item.id}>{item.title}</Link>
          </li>
        ))}
      </ol>
    </nav>
  )
}
