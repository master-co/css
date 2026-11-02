'use client'

import Image from '~/site/docs-shell/components/Image'
import { IconArrowLeft, IconArrowUpRight } from '@tabler/icons-react'
import { useRef, useState } from 'react'
import { DemoLabel, DemoSurface } from '~/site/components/demo/primitives'
import { useDemoViewTransition } from '~/site/components/demo/useDemoViewTransition'
import articleAuroraImage from '~/site/assets/images/view-transitions/article-aurora.jpg'
import articleStudioImage from '~/site/assets/images/view-transitions/article-studio.jpg'

const articles = [
  {
    id: 'aurora',
    title: 'Designing transitions that preserve context',
    date: 'May 12, 2026',
    description: 'A practical pattern for moving readers from a dense article feed into a focused story view.',
    image: articleAuroraImage,
    imageAlt: 'Green mountain ridge with a winding road',
  },
  {
    id: 'studio',
    title: 'Building quieter detail pages',
    date: 'May 9, 2026',
    description: 'How shared element motion helps a page change feel intentional without adding visual noise.',
    image: articleStudioImage,
    imageAlt: 'Snowy mountain valley with yellow tents',
  },
]

export default function ArticleTransitionScene() {
  const [selectedId, setSelectedId] = useState<string>()
  const selected = articles.find(article => article.id === selectedId)
  const heading = useRef<HTMLHeadingElement>(null)
  const buttons = useRef(new Map<string, HTMLButtonElement>())
  const { run, mode } = useDemoViewTransition()
  return <main className="container-inline p-md bg-surface-base fg-text-body">
    <div className="flex flex-wrap items-baseline justify-between gap-xs mb-md">
      <DemoLabel>Field notes / Collection 01</DemoLabel>
      <span className="text-xs fg-text-muted" role="status">{selected ? 'Article detail' : '2 articles'} · {mode}</span>
    </div>
    {selected ? <article data-article-detail className="overflow-hidden ui-sheet" data-elevation="1">
      <Image alt={selected.imageAlt} src={selected.image} loading="eager" sizes="(max-width: 600px) 100vw, 600px"
        style={{ viewTransitionName: `article-${selected.id}-image` }} className="block h-auto w-full (aspect-ratio:16/9) object-cover article-capture" />
      <div className="p-lg">
        <time dateTime={selected.id === 'aurora' ? '2026-05-12' : '2026-05-09'} style={{ viewTransitionName: `article-${selected.id}-date` }} className="text-xs fg-text-muted article-capture">{selected.date}</time>
        <h1 ref={heading} tabIndex={-1} style={{ viewTransitionName: `article-${selected.id}-title` }} className="mb(0) mt-sm text-2xl font-regular outline-solid:focus-visible outline(2):focus-visible outline-text-link:focus-visible outline-offset-4xs:focus-visible article-capture">{selected.title}</h1>
        <p className="mb(0) mt-md text-sm fg-text-muted">{selected.description} The image, title and date keep their names in both views. Each snapshot can move to its new bounds while surrounding content fades.</p>
        <button type="button" className="mt-lg ui-button" onClick={() => run(() => setSelectedId(undefined), () => buttons.current.get(selected.id) ?? null)}>
          <IconArrowLeft aria-hidden="true" />Back to collection
        </button>
      </div>
    </article> : <div className="grid-cols(1) grid gap-md grid-cols(2)@container(width>=28rem)">
      {articles.map(article => <DemoSurface key={article.id} elevation="raised" className="flex overflow-hidden flex-col">
        <Image alt={article.imageAlt} src={article.image} loading="eager" sizes="(max-width: 600px) 100vw, 600px"
          style={{ viewTransitionName: `article-${article.id}-image` }} className="block h-auto w-full (aspect-ratio:16/10) object-cover article-capture" />
        <article className="flex flex-col (flex:1) p-md">
          <time dateTime={article.id === 'aurora' ? '2026-05-12' : '2026-05-09'} style={{ viewTransitionName: `article-${article.id}-date` }} className="text-xs fg-text-muted article-capture">{article.date}</time>
          <h2 style={{ viewTransitionName: `article-${article.id}-title` }} className="mb(0) mt-xs text-lg font-regular article-capture">{article.title}</h2>
          <p className="mb-md mt-sm text-sm fg-text-muted">{article.description}</p>
          <button ref={element => { if (element) buttons.current.set(article.id, element); else buttons.current.delete(article.id) }}
            type="button" className="self-start mt-auto ui-button" aria-label={`Read ${article.title}`}
            onClick={() => run(() => setSelectedId(article.id), () => heading.current)}>
            Read article<IconArrowUpRight aria-hidden="true" />
          </button>
        </article>
      </DemoSurface>)}
    </div>}
  </main>
}
