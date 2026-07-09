'use client'

import clsx from 'clsx'
import Demo from 'internal/components/Demo'
import Image from 'next/image'
import { IconChevronLeft } from '@tabler/icons-react'
import { useEffect, useState } from 'react'
import { flushSync } from 'react-dom'
import articleAuroraImage from '~/site/assets/images/view-transitions/article-aurora.jpg'
import articleCoastImage from '~/site/assets/images/view-transitions/article-coast.jpg'
import articleGridImage from '~/site/assets/images/view-transitions/article-grid.jpg'
import articleStudioImage from '~/site/assets/images/view-transitions/article-studio.jpg'

type ViewTransitionDocument = Document & {
  startViewTransition?: (update: () => void) => void
}

const rootTransitionClassName = [
  'animation-duration:slower::view-transition-group(.article)',
  'animation-timing-function:smooth::view-transition-group(.article)',
].join(' ')

const sharedTransitionClassName = 'view-transition-class:article'

const articles = [
  {
    id: 'aurora',
    title: 'Designing transitions that preserve context',
    date: 'May 12, 2026',
    description: 'A practical pattern for moving readers from a dense article feed into a focused story view.',
    image: articleAuroraImage,
    imageAlt: 'Green mountain ridge with a winding road',
    imageTransition: 'view-transition-name:article-image',
    titleTransition: 'view-transition-name:article-title',
    dateTransition: 'view-transition-name:article-date',
  },
  {
    id: 'studio',
    title: 'Building quieter detail pages',
    date: 'May 9, 2026',
    description: 'How shared element motion helps a page change feel intentional without adding visual noise.',
    image: articleStudioImage,
    imageAlt: 'Snowy mountain valley with accent tents',
    imageTransition: 'view-transition-name:article-studio-image',
    titleTransition: 'view-transition-name:article-studio-title',
    dateTransition: 'view-transition-name:article-studio-date',
  },
  {
    id: 'coast',
    title: 'Making navigation feel continuous',
    date: 'May 4, 2026',
    description: 'Use named snapshots to connect source cards with their destination layouts.',
    image: articleCoastImage,
    imageAlt: 'Forest valley with cliffs reflected in a river',
    imageTransition: 'view-transition-name:article-coast-image',
    titleTransition: 'view-transition-name:article-coast-title',
    dateTransition: 'view-transition-name:article-coast-date',
  },
  {
    id: 'grid',
    title: 'Responsive motion in compact layouts',
    date: 'April 28, 2026',
    description: 'Manifest transitions around the real content container so they still work on phones.',
    image: articleGridImage,
    imageAlt: 'City skyline at sunset',
    imageTransition: 'view-transition-name:article-grid-image',
    titleTransition: 'view-transition-name:article-grid-title',
    dateTransition: 'view-transition-name:article-grid-date',
  }
]

export default function ArticleTransitionDemo() {
  const [selectedId, setSelectedId] = useState<string>()
  const selectedArticle = articles.find((article) => article.id === selectedId)

  useEffect(() => {
    const rootClasses = rootTransitionClassName.split(' ')
    document.documentElement.classList.add(...rootClasses)
    return () => document.documentElement.classList.remove(...rootClasses)
  }, [])

  function transition(update: () => void) {
    const transitionDocument = document as ViewTransitionDocument

    if (!transitionDocument.startViewTransition) {
      update()
      return
    }

    transitionDocument.startViewTransition(() => {
      flushSync(update)
    })
  }

  return (
    <Demo className="container w:full">
      <span aria-hidden className={clsx(rootTransitionClassName, 'hidden')} />
      {!selectedArticle &&
        <div className="grid grid-cols:1 gap:lg w:full grid-cols:2@container(3xs)">
          {articles.map((article) => (
            <article className="app-panel flex overflow:hidden flex-col p:0" key={article.id}>
              <Image
                alt={article.imageAlt}
                className={clsx(article.imageTransition, sharedTransitionClassName, 'h:auto w:full aspect-ratio:16/10 object-cover')}
                placeholder="blur"
                sizes="(min-width: 480px) 50vw, 100vw"
                src={article.image}
              />
              <div className="flex flex-col flex:1 p:lg">
                <time className={clsx(article.dateTransition, sharedTransitionClassName, 'block mb:xs text:xs text:body')}>
                  {article.date}
                </time>
                <h3 className={clsx(article.titleTransition, sharedTransitionClassName, 'm:0 text:lg font:semibold leading:sm')}>
                  {article.title}
                </h3>
                <p className="mx:0 mb:0 mt:sm text:sm text:body">
                  {article.description}
                </p>
                <button
                  className="btn btn-sm yellow touch-yellow self-start mt:lg"
                  onClick={() => transition(() => setSelectedId(article.id))}
                  type="button"
                >
                  Read More
                </button>
              </div>
            </article>
          ))}
        </div>
      }
      {selectedArticle &&
        <article className="app-panel overflow:hidden w:full p:0">
          <Image
            alt={selectedArticle.imageAlt}
            className={clsx(selectedArticle.imageTransition, sharedTransitionClassName, 'h:auto w:full aspect-ratio:16/10 object-cover')}
            placeholder="blur"
            sizes="100vw"
            src={selectedArticle.image}
          />
          <div className="p:lg p:xl@container(3xs)">
            <time className={clsx(selectedArticle.dateTransition, sharedTransitionClassName, 'block mb:sm text:sm text:body')}>
              {selectedArticle.date}
            </time>
            <h3 className={clsx(selectedArticle.titleTransition, sharedTransitionClassName, 'm:0 text:2xl font:semibold text:3xl@container(3xs)')}>
              {selectedArticle.title}
            </h3>
            <p className="mx:0 mb:0 mt:md text:md text:body">
              {selectedArticle.description} The image, title, and date keep the same transition names in both layouts, so the browser can move each snapshot into its new position while the rest of the interface cross-fades around it.
            </p>
            <button
              className="btn btn-sm mt:lg p:0"
              onClick={() => transition(() => setSelectedId(undefined))}
              type="button"
            >
              <IconChevronLeft className="size:1em mr:2xs stroke:2" />
              Back to list
            </button>
          </div>
        </article>
      }
    </Demo>
  )
}
