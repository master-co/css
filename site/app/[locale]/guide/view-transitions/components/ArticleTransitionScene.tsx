'use client'

import clsx from 'clsx'
import Image from 'next/image'
import { IconArrowLeft, IconArrowUpRight } from '@tabler/icons-react'
import { useRef, useState } from 'react'
import { DemoLabel, DemoSurface } from '~/site/components/demo/primitives'
import { useDemoViewTransition } from '~/site/components/demo/useDemoViewTransition'
import articleAuroraImage from '~/site/assets/images/view-transitions/article-aurora.jpg'
import articleStudioImage from '~/site/assets/images/view-transitions/article-studio.jpg'

const rootClasses = 'animation-slower::view-transition-group(.demo-article) animation-smooth::view-transition-group(.demo-article)'
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
  return <main className="container-type:inline-size p-md bg-surface-base fg-text-body">
    <div className="display:flex flex-wrap:wrap align-items:baseline justify-content:space-between gap-xs mb-md">
      <DemoLabel>Field notes / Collection 01</DemoLabel>
      <span className="text-xs fg-text-muted" role="status">{selected ? 'Article detail' : '2 articles'} · {mode}</span>
    </div>
    {selected ? <article data-article-detail className="overflow:hidden demo-surface">
      <Image alt={selected.imageAlt} src={selected.image} placeholder="blur" sizes="(max-width: 600px) 100vw, 600px"
        className={clsx(selected.imageTransition, shared, 'display:block height:auto width:100% aspect-ratio:16/9 object-fit:cover')} />
      <div className="p-lg">
        <time dateTime={selected.id === 'aurora' ? '2026-05-12' : '2026-05-09'} className={clsx(selected.dateTransition, shared, 'text-xs fg-text-muted')}>{selected.date}</time>
        <h1 ref={heading} tabIndex={-1} className={clsx(selected.titleTransition, shared, 'mt-sm margin-bottom:0 text-2xl font-semibold outline-width:2px:focus-visible outline-style:solid:focus-visible outline-blue:focus-visible outline-offset-4xs:focus-visible')}>{selected.title}</h1>
        <p className="mt-md margin-bottom:0 text-sm fg-text-muted">{selected.description} The image, title and date keep their names in both views. Each snapshot can move to its new bounds while surrounding content fades.</p>
        <button type="button" className="mt-lg demo-button" onClick={() => run(() => setSelectedId(undefined), () => buttons.current.get(selected.id) ?? null)}>
          <IconArrowLeft size={14} aria-hidden="true" />Back to collection
        </button>
      </div>
    </article> : <div className="grid-cols(1) display:grid gap-md grid-cols(2)@container((width>=28rem))">
      {articles.map(article => <DemoSurface key={article.id} className="display:flex overflow:hidden flex-direction:column">
        <Image alt={article.imageAlt} src={article.image} placeholder="blur" sizes="(max-width: 480px) 100vw, 300px"
          className={clsx(article.imageTransition, shared, 'display:block height:auto width:100% aspect-ratio:16/10 object-fit:cover')} />
        <article className="display:flex flex:1 flex-direction:column p-md">
          <time dateTime={article.id === 'aurora' ? '2026-05-12' : '2026-05-09'} className={clsx(article.dateTransition, shared, 'text-xs fg-text-muted')}>{article.date}</time>
          <h2 className={clsx(article.titleTransition, shared, 'mt-xs margin-bottom:0 text-lg font-semibold')}>{article.title}</h2>
          <p className="mb-md mt-sm text-sm fg-text-muted">{article.description}</p>
          <button ref={element => { if (element) buttons.current.set(article.id, element); else buttons.current.delete(article.id) }}
            type="button" className="align-self:start margin-top:auto demo-button" aria-label={`Read ${article.title}`}
            onClick={() => run(() => setSelectedId(article.id), () => heading.current)}>
            Read article<IconArrowUpRight size={14} aria-hidden="true" />
          </button>
        </article>
      </DemoSurface>)}
    </div>}
  </main>
}
