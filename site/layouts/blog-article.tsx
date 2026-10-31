import '~/site/styles/docs-shell/prose.css'
import '~/site/styles/blog-materials.css'
import '~/site/styles/blog-article.css'
import Footer from '~/site/docs-shell/components/Footer'
import PageContentBootstrap from '~/site/docs-shell/components/PageContentBootstrap'
import { footerProps } from '~/site/navigation'
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
 * A blog post, drawn with the homepage's drafting guides: the header, the reading column (the documentation's measure
 * and typography, `styles/docs-shell/prose`) and the next read are sections of one framed drawing, each opened by a
 * rule crossed at the rails, the rulers restarting there. The contents ruler stands outside the frame, in the page's
 * left margin.
 */
export default function BlogArticleLayout({ metadata, toc, children }: any) {
  const $ = useTranslation()
  const { defaultLocale, hreflangOfLocale } = useI18n()
  const locale = useLocale()
  const { newer, older } = neighborsOf(metadata.sourcePath, posts)
  // A post not yet translated is shown in its own language; the body says so, for screen readers and Han type rules.
  const proseLanguage = contentLanguageOf(metadata.sourcePath, translatedContent, { locale, defaultLocale, hreflangOfLocale })
  const contents = (toc ?? []).filter((item: any) => item.level === 2 || item.level === 3).map(({ id, title, level }: any) => ({ id, title, level }))
  const hasSections = contents.some((item: any) => item.level === 2)
  // As on the blog index, a category every post shares says nothing about the next one.
  const showCategory = posts.length > 1
  return (
    <div className="blog-article-page blog-materials">
      <main className="blog-article-main">
        <article className="blog-article">
          {/* The post's own header, so the title, date and authors belong to the article. */}
          <BlogArticleMasthead metadata={metadata} />
          {/* In the page's outer left margin, beside the text it lists. */}
          {hasSections ? <BlogArticleContents items={contents} label={$('On this page')} lang={proseLanguage} /> : null}
          <div className="blog-article-body blog-rails blog-rails-rule">
            <div className="blog-article-prose prose" lang={proseLanguage}>
              {children}
            </div>
          </div>
        </article>
        <BlogArticleEnd newer={newer} older={older} showCategory={showCategory} />
      </main>
      {hasSections ? <PageContentBootstrap items={contents} /> : null}
      <Footer {...footerProps} className="app-wrapper blog-article-footer" />
    </div>
  )
}
