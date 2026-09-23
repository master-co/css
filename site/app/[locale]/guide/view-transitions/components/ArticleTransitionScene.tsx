'use client'

import clsx from 'clsx'
import Image from 'next/image'
import { IconArrowLeft, IconArrowUpRight } from '@tabler/icons-react'
import { useRef, useState } from 'react'
import { DemoLabel, DemoSurface } from '~/site/components/demo/primitives'
import { useDemoViewTransition } from '~/site/components/demo/useDemoViewTransition'
import articleAuroraImage from '~/site/assets/images/view-transitions/article-aurora.jpg'
import articleStudioImage from '~/site/assets/images/view-transitions/article-studio.jpg'

const rootClasses = 'animation-duration:slower::view-transition-group(.demo-article) animation-timing-function:smooth::view-transition-group(.demo-article)'
const shared = 'view-transition-class:demo-article'

const articles = [
  {
    id: 'aurora',
    title: 'Designing transitions that preserve context',
    date: 'May 12, 2026',
    description: 'A practical pattern for moving readers from a dense article feed into a focused story view.',
    image: articleAuroraImage,
    imageAlt: 'Green mountain ridge with a winding road',
    imageTransition: 'view-transition-name:article-aurora-image',
    titleTransition: 'view-transition-name:article-aurora-title',
    dateTransition: 'view-transition-name:article-aurora-date',
  },
  {
    id: 'studio',
    title: 'Building quieter detail pages',
    date: 'May 9, 2026',
    description: 'How shared element motion helps a page change feel intentional without adding visual noise.',
    image: articleStudioImage,
    imageAlt: 'Snowy mountain valley with yellow tents',
    imageTransition: 'view-transition-name:article-studio-image',
    titleTransition: 'view-transition-name:article-studio-title',
    dateTransition: 'view-transition-name:article-studio-date',
  },
]

export default function ArticleTransitionScene() {
  const [selectedId, setSelectedId] = useState<string>()
  const selected = articles.find(article => article.id === selectedId)
  const heading = useRef<HTMLHeadingElement>(null)
  const buttons = useRef(new Map<string, HTMLButtonElement>())
  const { run, mode } = useDemoViewTransition(rootClasses)
  return <main className="container p:md bg:surface-base text:body">
    <div className="flex flex-wrap items-baseline justify-between gap:xs mb:md">
      <DemoLabel>Field notes / Collection 01</DemoLabel>
      <span className="text:xs text:muted" role="status">{selected ? 'Article detail' : '2 articles'} · {mode}</span>
    </div>
    {selected ? <article data-article-detail className="overflow:hidden demo-surface">
      <Image alt={selected.imageAlt} src={selected.image} placeholder="blur" sizes="(max-width: 600px) 100vw, 600px"
        className={clsx(selected.imageTransition, shared, 'block h:auto w:full video object-cover')} />
      <div className="p:lg">
        <time dateTime={selected.id === 'aurora' ? '2026-05-12' : '2026-05-09'} className={clsx(selected.dateTransition, shared, 'text:xs text:muted')}>{selected.date}</time>
        <h1 ref={heading} tabIndex={-1} className={clsx(selected.titleTransition, shared, 'mb:0 mt:sm text:2xl font:semibold outline:2px|solid|blue:focus-visible outline-offset:4xs:focus-visible')}>{selected.title}</h1>
        <p className="mb:0 mt:md text:sm text:muted">{selected.description} The image, title and date keep their names in both views. Each snapshot can move to its new bounds while surrounding content fades.</p>
        <button type="button" className="mt:lg demo-button" onClick={() => run(() => setSelectedId(undefined), () => buttons.current.get(selected.id) ?? null)}>
          <IconArrowLeft size={14} aria-hidden="true" />Back to collection
        </button>
      </div>
    </article> : <div className="grid grid-cols:1 gap:md grid-cols:2@container(md)">
      {articles.map(article => <DemoSurface key={article.id} className="flex overflow:hidden flex-col">
        <Image alt={article.imageAlt} src={article.image} placeholder="blur" sizes="(max-width: 480px) 100vw, 300px"
          className={clsx(article.imageTransition, shared, 'block h:auto w:full aspect-ratio:16/10 object-cover')} />
        <article className="flex flex-col flex:1 p:md">
          <time dateTime={article.id === 'aurora' ? '2026-05-12' : '2026-05-09'} className={clsx(article.dateTransition, shared, 'text:xs text:muted')}>{article.date}</time>
          <h2 className={clsx(article.titleTransition, shared, 'mb:0 mt:xs text:lg font:semibold')}>{article.title}</h2>
          <p className="mb:md mt:sm text:sm text:muted">{article.description}</p>
          <button ref={element => { if (element) buttons.current.set(article.id, element); else buttons.current.delete(article.id) }}
            type="button" className="self-start mt:auto demo-button" aria-label={`Read ${article.title}`}
            onClick={() => run(() => setSelectedId(article.id), () => heading.current)}>
            Read article<IconArrowUpRight size={14} aria-hidden="true" />
          </button>
        </article>
      </DemoSurface>)}
    </div>}
  </main>
}
