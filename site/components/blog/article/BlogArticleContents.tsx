'use client'

import '~/site/styles/docs-shell/page-content.css'
import { useRef } from 'react'
import { PageContentList } from '~/site/docs-shell/components/PageContent'
import { PageContentProvider, type PageContentItem } from '~/site/docs-shell/components/PageContentContext'

/**
 * The post's contents in the page's left margin: the documentation's contents ruler (the same list, the same live
 * mark, the same scroll tracking), under a label in the reader's language. A list taller than the window scrolls on
 * its own and keeps the current entry in view. `lang` names the language of the section titles when the post is not
 * yet translated.
 */
export default function BlogArticleContents({ items, label, lang }: { items: PageContentItem[], label: string, lang?: string }) {
  const ref = useRef<HTMLElement>(null)
  return (
    <nav ref={ref} className="blog-article-contents ui-toc" aria-label={label}>
      <h4 aria-hidden="true">{label}</h4>
      <PageContentProvider items={items}>
        <PageContentList lang={lang} translate={false} scrollContainerRef={ref} />
      </PageContentProvider>
    </nav>
  )
}
