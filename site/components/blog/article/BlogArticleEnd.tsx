import dayjs from 'dayjs'
import { IconArrowLeft, IconArrowRight } from '@tabler/icons-react'
import Link from '~/site/docs-shell/components/Link'
import { useI18n, useTranslation } from '~/site/docs-shell/contexts/i18n'
import { useLocale } from '~/site/docs-shell/contexts/locale'
import { titleLines } from './title-lines'
import { sourceLanguageOf } from './language'
import type { BlogArticleNeighbor } from './neighbors'

/**
 * The close of a post, set like its header: an eyebrow, the next read as an open title with its italic description
 * (marked on hover with the index's artboard corners, not a card), then the other neighbour and the way back to every
 * article as quiet links.
 */
export default function BlogArticleEnd({ newer, older, showCategory = true }: { newer?: BlogArticleNeighbor, older?: BlogArticleNeighbor, showCategory?: boolean }) {
  const $ = useTranslation()
  const i18n = useI18n()
  const locale = useLocale()
  const tw = locale === 'tw'
  const languageOf = (text?: string) => sourceLanguageOf(text, { ...i18n, locale })
  // Readers who finish a post usually continue backwards through the archive; the newest post leads with the one before it.
  const lead = older ?? newer
  const other = lead === older ? newer : undefined
  // Written out in full, as on the post's own header and on the index's featured sheet.
  const date = (value: string) => dayjs(value).format(tw ? 'YYYY 年 M 月 D 日' : 'MMMM D, YYYY')
  return (
    <nav className="blog-article-end blog-rails blog-rails-rule" aria-labelledby="blog-article-end-title">
      <p className="blog-article-end-title" id="blog-article-end-title">{$('Keep reading')}</p>
      {lead && (
        <Link className="blog-article-next blog-marks" href={lead.pathname}>
          <span className="blog-article-next-meta">
            {showCategory && lead.category && <span>{$(lead.category)}</span>}
            <time dateTime={lead.date}>{date(lead.date)}</time>
          </span>
          <span className="blog-article-next-title" lang={languageOf(lead.title)}>
            {titleLines($(lead.title), 'blog-article-next-title-line')}
            <IconArrowRight className="blog-article-next-arrow" aria-hidden="true" size={22} stroke={1.25} />
          </span>
          {lead.description && <span className="blog-article-next-description" lang={languageOf(lead.description)}>{$(lead.description)}</span>}
        </Link>
      )}
      <div className="blog-article-end-links">
        <Link className="blog-article-end-link" href="/blog">
          <IconArrowLeft aria-hidden="true" size={14} stroke={1.75} />
          {$('All articles')}
        </Link>
        {other && (
          <Link className="blog-article-end-link" href={other.pathname}>
            <span className="blog-article-end-link-label">{$('Newer')}</span>
            <span className="blog-article-end-link-title" lang={languageOf(other.title)}>{$(other.title)}</span>
            <IconArrowRight aria-hidden="true" size={14} stroke={1.75} />
          </Link>
        )}
      </div>
    </nav>
  )
}
