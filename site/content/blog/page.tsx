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
import { createTranslation } from '~/site/docs-shell/utils/i18n'
import { compareBlogDates } from '~/site/components/blog/article/neighbors'

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

// The index lists articles; it renders no document surfaces, code or prose.
export const documentStyles = false

export async function generateMetadata(props: any) {
  return await generate(metadata, props, dictionaries)
}

interface BlogPage {
  title: string
  description: string
  category?: string
  authors: { name: string }[]
  date?: string
  pathname: string
}

export default async function Page(props: any) {
  const { locale } = props.params
  const tw = locale === 'tw'
  const $ = await createTranslation(locale, dictionaries)
  const pages: BlogPage[] = pageCategories
    .flatMap<BlogPage>(({ pages }) => pages)
    .sort(compareBlogDates)
  const latest = pages[0]
  // A category every post shares says nothing about any one of them.
  const showCategory = new Set(pages.map((page) => page.category ?? '')).size > 1
  // The timeline names each year once, beside its posts; a post shows only its day (its full date is still read).
  const yearOf = (value?: string) => value ? dayjs(value).format('YYYY') : ''
  const day = (value: string) => dayjs(value).format(tw ? 'M 月 D 日' : 'MMMM D')
  const years = pages.reduce<{ year: string, pages: BlogPage[] }[]>((groups, page) => {
    const group = groups.at(-1)
    if (group?.year === yearOf(page.date)) group.pages.push(page)
    else groups.push({ year: yearOf(page.date), pages: [page] })
    return groups
  }, [])
  const slug = (page: BlogPage) => page.pathname.split('/').at(-1)
  // A post not yet translated keeps its English text on /tw; say so, so it is set and read as English.
  const lang = (text: string) => (tw && $(text) === text ? 'en' : undefined)
  // A link is named by its title and described by its date, category (when shown) and description.
  const describedBy = (page: BlogPage) => [page.date && `post-${slug(page)}-date`, showCategory && page.category && `post-${slug(page)}-category`, `post-${slug(page)}-description`].filter(Boolean).join(' ')

  return <>
    <main className="blog-index blog-materials">
      <header className="blog-masthead blog-rails">
        <h1 className="blog-hatch-text blog-masthead-title">{tw ? <>最新消息<wbr />與筆記</> : 'News and notes'}</h1>
      </header>
      {years.map(({ year, pages: posts }) => (
        // A year is a heading, not a landmark: a long archive would otherwise list one region per year.
        <section key={year} className="blog-rails blog-rails-rule blog-year">
          <h2 className="blog-year-label">{year || (tw ? '新訊' : 'New')}</h2>
          {/* eslint-disable-next-line jsx-a11y/no-redundant-roles -- Preserve WebKit list semantics when list-style is none. */}
          <ol className="blog-year-posts" role="list">
            {posts.map((page) => (
              <li key={page.pathname} className="blog-entry">
                {page === latest && <span className="blog-entry-signal blog-signal" aria-hidden="true" />}
                <Link href={page.pathname} className="blog-entry-link blog-marks" aria-labelledby={`post-${slug(page)}`} aria-describedby={describedBy(page)}>
                  <span className="blog-entry-meta">
                    {page.date && <time id={`post-${slug(page)}-date`} dateTime={page.date}>{tw ? <><span className="sr-only">{year} 年 </span>{day(page.date)}</> : <>{day(page.date)}<span className="sr-only">, {year}</span></>}</time>}
                    {showCategory && page.category && <span id={`post-${slug(page)}-category`}>{$(page.category)}</span>}
                  </span>
                  <h3 id={`post-${slug(page)}`} className="blog-entry-title" lang={lang(page.title)}>{titleHalves($(page.title), 'blog-title-half')}</h3>
                  <p id={`post-${slug(page)}-description`} className="blog-entry-description" lang={lang(page.description)}>{$(page.description)}</p>
                </Link>
              </li>
            ))}
          </ol>
        </section>
      ))}
      {years.length > 0 && <div className="blog-rails-rule blog-timeline-end" aria-hidden="true" />}
    </main>
    <Footer {...footerProps} className="app-wrapper" />
  </>
}
