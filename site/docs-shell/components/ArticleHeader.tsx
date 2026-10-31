import ChevronLeftSvg from '../../public/images/chevron-left.svg'
import Link from './Link'
import dayjs from 'dayjs'
import clsx from 'clsx'
import { createTranslation } from '../utils/i18n'
import i18n from '../common/i18n.config.js'
import PackageBadges from './PackageBadges'
import PageContentDisclosure from './PageContentDisclosure'

export default async function ArticleHeader(props: any) {
  let { h1ClassName, metadata, icon, end, date, center, locale, categoryLink, dictionaries, toc } = props
  const $ = await createTranslation(locale, dictionaries)
  // Text a translated page still shows in its source language says so, for screen readers and Han type rules.
  const sourceLanguage = locale !== i18n.defaultLocale ? (i18n.hreflangOfLocale as Record<string, string>)[i18n.defaultLocale] ?? i18n.defaultLocale : undefined
  const languageOf = (text?: string) => sourceLanguage && text && !text.startsWith('`') && $(text) === text ? sourceLanguage : undefined
  const Category = ({ children }: any) => {
    return (
      categoryLink
        ? (
          <Link href={typeof categoryLink === 'string' ? categoryLink : './'} lang={languageOf(metadata.category)} className={clsx(
            'doc-article-category',
            center && 'mx-auto'
          )}>
            <ChevronLeftSvg aria-hidden="true" />
            {children}
          </Link>
        )
        : <div className="doc-article-category" lang={languageOf(metadata.category)}>{$(children)}</div>
    )
  }
  return (
    <>
      <div className="flex flex-nowrap gap-xl flex-col@media((width<37.5rem))">
        <div className='(flex:1) min-w(0)'>
          {metadata.category && <Category>{$(metadata.category)}</Category>}
          {date && <Category>{dayjs(date).format('MMMM D, YYYY')}</Category>}
          <h1 className={clsx('doc-article-title', h1ClassName)} lang={languageOf(metadata.title.absolute || metadata.title)}>
            {$(metadata.title.absolute || metadata.title)}
            {metadata.type === 'entity' && locale !== 'en' && <span className='(margin-left:.25em)' lang={sourceLanguage}>{metadata.title}</span>}
            {metadata.unfinished && <span className='(margin-left:.5em) (font-size:.5em) vertical-top'>🚧</span>}
          </h1>
        </div >
        <div className={clsx('flex gap-xs hidden:empty', center ? 'items-center' : 'items-start')}>
          {end}
        </div>
        {icon && <div className="doc-article-icon">
          <div className="doc-article-icon-slot">
            {icon}
          </div>
        </div>}
      </div >
      {metadata.package && <PackageBadges {...metadata.package} translate={$} />}
      <p className="doc-article-description" lang={languageOf(metadata.description)}>{$(metadata.description)}</p>
      {
        (metadata.unfinished || metadata.disabled) &&
        <div className="(margin-block:1.25rem) (padding-bottom:0.797rem) (padding-left:1.25rem) (padding-right:1.25rem) (padding-top:0.797rem) r-lg text-xs (font-weight:460) bg-accent/.1 fg-accent">
          <span className='(margin-right:0.625rem)'>🚧</span>{$('This page is still under construction and some content may not be complete.')}
        </div>
      }
      {/* The header closes on a hairline, as a blog post's does; the contents disclosure, where it shows, draws it. */}
      <hr className="doc-article-rule" />
      {!!toc?.length && <PageContentDisclosure items={toc.map((item: any) => ({ ...item, title: $(item.title), lang: languageOf(item.title) }))} label={$('On this page')} />}
    </>
  )
}
