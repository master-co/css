import '~/site/styles/docs-shell/prose.css'
import '~/site/styles/blog-materials.css'
import '~/site/styles/blog-article.css'
import Footer from '~/site/docs-shell/components/Footer'
import { footerProps } from '~/site/navigation'
import type { CSSProperties } from 'react'
import posts from '~/site/.categories/blog.json'
import { useI18n, useTranslation } from '~/site/docs-shell/contexts/i18n'
import { useLocale } from '~/site/docs-shell/contexts/locale'
import BlogArticleMasthead from '~/site/components/blog/article/BlogArticleMasthead'
import BlogArticleContents from '~/site/components/blog/article/BlogArticleContents'
import BlogArticleEnd from '~/site/components/blog/article/BlogArticleEnd'
import { neighborsOf } from '~/site/components/blog/article/neighbors'
import { contentLanguageOf } from '~/site/components/blog/article/language'

/** Translated MDX lives beside its source as `content.<locale>.mdx` (see docs-shell/factories/create-page). */
const translatedContent = new Set(Object.keys(import.meta.glob('/content/**/content.*.mdx')))

/**
 * A blog post: the post's header and a calm reading column on one axis, an optional contents rail beside it,
 * and a closing block that leads to the next read. Docs and the sponsor page keep `layouts/article`.
 */
export default function BlogArticleLayout({ metadata, toc, children }: any) {
  const $ = useTranslation()
  const { defaultLocale, hreflangOfLocale } = useI18n()
  const locale = useLocale()
  const { newer, older } = neighborsOf(metadata.sourcePath, posts)
  // A post not yet translated is shown in its own language; the body says so, for screen readers and Han type rules.
  const proseLanguage = contentLanguageOf(metadata.sourcePath, translatedContent, { locale, defaultLocale, hreflangOfLocale })
  const sections = (toc ?? []).filter((item: any) => item.level === 2).map(({ id, title }: any) => ({ id, title }))
  // As on the blog index, a category every post shares says nothing about the next one.
  const showCategory = posts.length > 1
  // The post's own contents list (MDX) is labelled from CSS, in the reader's language.
  const proseStyle = { '--blog-article-contents-label': JSON.stringify($('On this page')) } as CSSProperties
  return (
    <div className="blog-article-page blog-materials">
      <div className="blog-article-progress" aria-hidden="true" />
      <main>
        <article className="blog-article">
          <div className="blog-article-frame">
            {/* The post's own header, so the title, date and authors belong to the article. */}
            <BlogArticleMasthead metadata={metadata} />
            {sections.length ? <BlogArticleContents items={sections} lang={proseLanguage} /> : null}
            <div className="blog-article-prose prose" lang={proseLanguage} style={proseStyle}>
              {children}
            </div>
          </div>
        </article>
        <div className="blog-article blog-article-close">
          <BlogArticleEnd newer={newer} older={older} showCategory={showCategory} />
        </div>
      </main>
      <Footer {...footerProps} className="app-wrapper blog-article-footer" />
    </div>
  )
}
