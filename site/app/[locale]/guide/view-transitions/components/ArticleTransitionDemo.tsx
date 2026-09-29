'use client'

import '~/site/styles/btn.css'
import '~/site/styles/btn-yellow.css'
import clsx from 'clsx'
import Demo from '~/site/docs-shell/components/Demo'
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
  'animation-duration-slower::view-transition-group(.article)',
  'animation-timing-function-smooth::view-transition-group(.article)',
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
    <Demo className="container-type:inline-size width:100%">
      <span aria-hidden className={clsx(rootTransitionClassName, 'display:none')} />
      {!selectedArticle &&
        <div className="grid-cols(1) display:grid gap-lg width:100% grid-cols(2)@container((width>=16rem))">
          {articles.map((article) => (
            <article className="display:flex overflow:hidden flex-direction:column padding:0 app-panel" key={article.id}>
              <Image
                alt={article.imageAlt}
                className={clsx(article.imageTransition, sharedTransitionClassName, 'height:auto width:100% aspect-ratio:16/10 object-fit:cover')}
                placeholder="blur"
                sizes="(min-width: 480px) 50vw, 100vw"
                src={article.image}
              />
              <div className="display:flex flex:1 flex-direction:column p-lg">
                <time className={clsx(article.dateTransition, sharedTransitionClassName, 'display:block mb-xs text-xs fg-text-body')}>
                  {article.date}
                </time>
                <h3 className={clsx(article.titleTransition, sharedTransitionClassName, 'margin:0 text-lg font-semibold leading-sm')}>
                  {article.title}
                </h3>
                <p className="margin-inline:0 mt-sm margin-bottom:0 text-sm fg-text-body">
                  {article.description}
                </p>
                <button
                  className="align-self:start mt-lg btn btn-sm touch-yellow yellow"
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
        <article className="overflow:hidden width:100% padding:0 app-panel">
          <Image
            alt={selectedArticle.imageAlt}
            className={clsx(selectedArticle.imageTransition, sharedTransitionClassName, 'height:auto width:100% aspect-ratio:16/10 object-fit:cover')}
            placeholder="blur"
            sizes="100vw"
            src={selectedArticle.image}
          />
          <div className="p-lg p-xl@container((width>=16rem))">
            <time className={clsx(selectedArticle.dateTransition, sharedTransitionClassName, 'display:block mb-sm text-sm fg-text-body')}>
              {selectedArticle.date}
            </time>
            <h3 className={clsx(selectedArticle.titleTransition, sharedTransitionClassName, 'margin:0 text-2xl font-semibold text-3xl@container((width>=16rem))')}>
              {selectedArticle.title}
            </h3>
            <p className="margin-inline:0 mt-md margin-bottom:0 text-md fg-text-body">
              {selectedArticle.description} The image, title, and date keep the same transition names in both layouts, so the browser can move each snapshot into its new position while the rest of the interface cross-fades around it.
            </p>
            <button
              className="mt-lg padding:0 btn btn-sm"
              onClick={() => transition(() => setSelectedId(undefined))}
              type="button"
            >
              <IconChevronLeft className="height:1em width:1em mr-2xs stroke-width:2" />
              Back to list
            </button>
          </div>
        </article>
      }
    </Demo>
  )
}
