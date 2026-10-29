import '~/site/styles/docs-shell/prose.css'
import '~/site/styles/blog.css'
import Footer from '~/site/docs-shell/components/Footer'
import pageCategories from '~/site/.categories/blog.json'
import { footerProps } from '~/site/navigation'
import Image from '~/site/docs-shell/components/Image'
import dayjs from 'dayjs'
import Link from '~/site/docs-shell/components/Link'
import metadata from './metadata'
import generate from '~/site/docs-shell/utils/generate-metadata'
import dictionaries from '~/site/dictionaries'
import { IconArrowUpRight } from '@tabler/icons-react'
import authors from '~/site/docs-shell/data/authors'
import { createTranslation } from '~/site/docs-shell/utils/i18n'


export async function generateMetadata(props: any) {
  return await generate(metadata, props, dictionaries)
}

function AuthorAvatarStack({ children }: { children: any[] }) {
  return (
    <div className="blog-authors"><span className="blog-avatar-stack" aria-hidden="true">
      {children.map((eachAuthor: any, index: number) => {
        const author = authors.find((x: any) => x.name === eachAuthor.name)
        if (!author) return null
        return (
          <span key={author.name} className="blog-avatar" style={{ zIndex: index + 1 }}><Image
            src={author.image}
            width={24}
            height={24}
            alt=""
          /></span>
        )
      })}</span><span className="blog-author-names">{children.map(author => author.name).join(' · ')}</span>
    </div>
  )
}

export default async function Page(props: any) {
  const { locale } = props.params
  const tw = locale === 'tw'
  const $ = await createTranslation(locale, dictionaries)
  const pages = pageCategories
    .map(({ pages }) => pages)
    .flat()
    .sort((a: any, b: any) => Date.parse(b.date) - Date.parse(a.date))

  return <>
    <main className="blog-page">
      <header className="blog-header"><p className="blog-overline">Master CSS <span aria-hidden="true">/</span> Blog</p><h1>{tw ? '最新消息與筆記' : 'News and notes'}</h1><p>{tw ? 'Master CSS 的產品更新與實作分享。' : 'Updates and practical guides from the Master CSS team.'}</p></header>
      <section className="blog-index" aria-labelledby="latest-updates">
        <div className="blog-index-heading"><h2 id="latest-updates">{tw ? '最新文章' : 'Latest updates'}</h2><span>{pages.length} {tw ? '篇文章' : pages.length === 1 ? 'article' : 'articles'}</span></div>
        <div className="blog-post-grid">
          {pages
            .map((page: any, index: number) => {
              const formattedDate = dayjs(page.date).format(tw ? 'YYYY 年 M 月 D 日' : 'MMM D, YYYY')
              const id = `post-${page.pathname.split('/').at(-1)}`
              return (
                <article key={page.pathname + index}>
                  <Link href={page.pathname} className="blog-post-link" aria-labelledby={id}>
                    <div className="blog-post-meta"><span>{$(page.category)}</span><time dateTime={page.date}>{formattedDate}</time></div>
                    <h3 id={id}>{$(page.title)}</h3>
                    <p>{$(page.description)}</p>
                    <div className="blog-post-footer"><AuthorAvatarStack>{page.authors}</AuthorAvatarStack><span className="blog-read">{tw ? '閱讀文章' : 'Read article'}<IconArrowUpRight size={16} stroke={1.5} aria-hidden="true" /></span></div>
                  </Link>
                </article>
              )
            })
          }
        </div>
      </section>
    </main>
    <Footer {...footerProps} className="app-wrapper" />
  </>
}
