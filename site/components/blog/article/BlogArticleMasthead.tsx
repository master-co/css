import dayjs from 'dayjs'
import authors from '~/site/docs-shell/data/authors'
import Image from '~/site/docs-shell/components/Image'
import Link from '~/site/docs-shell/components/Link'
import { useI18n, useTranslation } from '~/site/docs-shell/contexts/i18n'
import { useLocale } from '~/site/docs-shell/contexts/locale'
import { titleLines } from './title-lines'
import { sourceLanguageOf } from './language'

/**
 * The post's own header, the first section of the drawing: a quiet line of category and date, the title in a soft
 * stone tone, the description, and the authors. Nothing moves and nothing glows; the page's one light simply
 * falls on it from above and to the left.
 */
export default function BlogArticleMasthead({ metadata }: { metadata: any }) {
  const $ = useTranslation()
  const i18n = useI18n()
  const locale = useLocale()
  const tw = locale === 'tw'
  const source: string = metadata.title?.absolute || metadata.title
  const title: string = $(source)
  const languageOf = (text?: string) => sourceLanguageOf(text, { ...i18n, locale })
  const people = (metadata.authors ?? [])
    .map(({ name }: { name: string }) => authors.find((author) => author.name === name))
    .filter(Boolean) as typeof authors
  return (
    <header className="blog-article-masthead blog-rails">
      {(metadata.category || metadata.date) && (
        <p className="blog-article-meta">
          {metadata.category && <span>{$(metadata.category)}</span>}
          {metadata.date && (
            <time dateTime={metadata.date}>
              {dayjs(metadata.date).format(tw ? 'YYYY 年 M 月 D 日' : 'MMMM D, YYYY')}
            </time>
          )}
        </p>
      )}
      <h1 className="blog-article-title blog-stone-text" lang={languageOf(source)}>{titleLines(title, 'blog-article-title-line')}</h1>
      {metadata.description && <p className="blog-article-dek" lang={languageOf(metadata.description)}>{$(metadata.description)}</p>}
      {people.length > 0 && (
        <div className="blog-article-byline">
          <span className="blog-article-byline-label">{$('Written by')}</span>
          <ul className="blog-article-authors">
            {people.map((author) => (
              <li key={author.name}>
                <Link className="blog-article-author" href={author.url}>
                  <Image className="blog-article-avatar" src={author.image} width={28} height={28} alt="" />
                  <span>{author.name}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </header>
  )
}
