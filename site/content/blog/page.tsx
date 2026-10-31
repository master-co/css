import '~/site/styles/blog-materials.css'
import '~/site/styles/blog.css'
import Footer from '~/site/docs-shell/components/Footer'
import pageCategories from '~/site/.categories/blog.json'
import { footerProps } from '~/site/navigation'
import dayjs from 'dayjs'
import Link from '~/site/docs-shell/components/Link'
import metadata from './metadata'
import generate from '~/site/docs-shell/utils/generate-metadata'
import dictionaries from '~/site/dictionaries'
import { IconArrowRight } from '@tabler/icons-react'
import { createTranslation } from '~/site/docs-shell/utils/i18n'
import BlogAuthors from '~/site/components/blog/BlogAuthors'

/** A "Subject: question" title breaks at its colon, as the article does: each half is a span the stylesheet sets on its own line. */
function titleHalves(title: string, className: string) {
  const match = /^(.+?[:：])\s*(.+)$/.exec(title)
  if (!match) return title
  return <>
    <span className={className}>{match[1]}</span>
    {match[1].endsWith('：') ? null : ' '}
    <span className={className}>{match[2]}</span>
  </>
}

export async function generateMetadata(props: any) {
  return await generate(metadata, props, dictionaries)
}

interface BlogPage {
  title: string
  description: string
  category?: string
  authors: { name: string }[]
  date: string
  pathname: string
}

export default async function Page(props: any) {
  const { locale } = props.params
  const tw = locale === 'tw'
  const $ = await createTranslation(locale, dictionaries)
  const pages: BlogPage[] = pageCategories
    .flatMap(({ pages }) => pages)
    .sort((a, b) => Date.parse(b.date) - Date.parse(a.date))
  const [latest, ...earlier] = pages
  // A category every post shares says nothing about any one of them.
  const showCategory = new Set(pages.map((page) => page.category ?? '')).size > 1
  // The featured post names its date in full, as its article does. The archive reads like a ledger: each year is
  // named once, on the rule that opens it, and each post carries only its day.
  const longDate = (value: string) => dayjs(value).format(tw ? 'YYYY 年 M 月 D 日' : 'MMMM D, YYYY')
  const day = (value: string) => dayjs(value).format(tw ? 'M 月 D 日' : 'MMM D')
  const year = (value: string) => dayjs(value).format('YYYY')
  const slug = (page: BlogPage) => page.pathname.split('/').at(-1)
  // A post not yet translated keeps its English text on /tw; say so, so it is set and read as English.
  const lang = (text: string) => (tw && $(text) === text ? 'en' : undefined)
  // A link is named by its title and described by its date, category (when shown) and description.
  const describedBy = (page: BlogPage) => [`post-${slug(page)}-date`, showCategory && page.category && `post-${slug(page)}-category`, `post-${slug(page)}-description`].filter(Boolean).join(' ')

  return <>
    <main className="blog-index blog-materials">
      <header className="blog-masthead">
        <h1 className="blog-masthead-title blog-stone-text">{tw ? <>最新消息<wbr />與筆記</> : 'News and notes'}</h1>
        <p className="blog-masthead-lead">{tw ? 'Master\u00a0CSS 的產品更新與實作分享。' : 'Updates and practical guides from the Master\u00a0CSS team.'}</p>
      </header>
      {latest && (
        <article className="blog-feature" aria-labelledby={`post-${slug(latest)}`}>
          <Link href={latest.pathname} className="blog-feature-link blog-plate" aria-labelledby={`post-${slug(latest)}`} aria-describedby={describedBy(latest)}>
            <span className="blog-feature-meta">
              <span className="blog-signal" aria-hidden="true" />
              <time id={`post-${slug(latest)}-date`} dateTime={latest.date}>{longDate(latest.date)}</time>
              {showCategory && latest.category && <span id={`post-${slug(latest)}-category`}>{$(latest.category)}</span>}
            </span>
            <h2 id={`post-${slug(latest)}`} className="blog-feature-title" lang={lang(latest.title)}>{titleHalves($(latest.title), 'blog-title-half')}</h2>
            <p id={`post-${slug(latest)}-description`} className="blog-feature-description" lang={lang(latest.description)}>{$(latest.description)}</p>
            <span className="blog-feature-footer">
              <BlogAuthors names={latest.authors} />
              <span className="blog-feature-action" aria-hidden="true">
                {tw ? '閱讀文章' : 'Read article'}
                <IconArrowRight size={15} stroke={1.5} />
              </span>
            </span>
          </Link>
        </article>
      )}
      {earlier.length > 0 && (
        <section className="blog-archive" aria-labelledby="blog-archive-title">
          <h2 id="blog-archive-title" className="sr-only">{tw ? '更早的文章' : 'Earlier'}</h2>
          {/* eslint-disable-next-line jsx-a11y/no-redundant-roles -- Preserve WebKit list semantics when list-style is none. */}
          <ol className="blog-archive-list" role="list">
            {earlier.map((page, index) => (
              <li key={page.pathname}>
                {(index === 0 || year(earlier[index - 1].date) !== year(page.date)) && <span className="blog-row-year" aria-hidden="true"><span>{year(page.date)}</span></span>}
                <Link href={page.pathname} className="blog-row" aria-labelledby={`post-${slug(page)}`} aria-describedby={describedBy(page)}>
                  <span className="blog-row-meta">
                    <time id={`post-${slug(page)}-date`} dateTime={page.date}>{day(page.date)}<span className="sr-only">{tw ? `，${year(page.date)} 年` : `, ${year(page.date)}`}</span></time>
                    {showCategory && page.category && <span id={`post-${slug(page)}-category`} className="blog-row-category">{$(page.category)}</span>}
                  </span>
                  <div className="blog-row-main">
                    <h3 id={`post-${slug(page)}`} className="blog-row-title" lang={lang(page.title)}>{titleHalves($(page.title), 'blog-title-half')}</h3>
                    <p id={`post-${slug(page)}-description`} className="blog-row-description" lang={lang(page.description)}>{$(page.description)}</p>
                  </div>
                  <IconArrowRight className="blog-row-arrow" size={15} stroke={1.5} aria-hidden="true" />
                </Link>
              </li>
            ))}
          </ol>
        </section>
      )}
    </main>
    <Footer {...footerProps} className="app-wrapper" />
  </>
}
