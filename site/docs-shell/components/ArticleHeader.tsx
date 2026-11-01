import '~/site/styles/docs-shell/docs.css'
import { IconAlertTriangle } from '@tabler/icons-react'
import ChevronLeftSvg from '../../public/images/chevron-left.svg'
import Link from './Link'
import dayjs from 'dayjs'
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
  const Kicker = ({ children, lang }: any) => categoryLink
    ? <Link href={typeof categoryLink === 'string' ? categoryLink : './'} lang={lang} className="ui-pagehead-kicker">
      <ChevronLeftSvg aria-hidden="true" />
      {children}
    </Link>
    : <span className="ui-pagehead-kicker" lang={lang}>{children}</span>
  return (
    <>
      <div className="ui-pagehead" data-align={center ? 'center' : undefined}>
        {metadata.category && <Kicker lang={languageOf(metadata.category)}>{$(metadata.category)}</Kicker>}
        {date && <Kicker>{dayjs(date).format('MMMM D, YYYY')}</Kicker>}
        <div className="ui-pagehead-title">
          <h1 className={h1ClassName} lang={languageOf(metadata.title.absolute || metadata.title)}>
            {$(metadata.title.absolute || metadata.title)}
            {metadata.type === 'entity' && locale !== 'en' && <span lang={sourceLanguage}> {metadata.title}</span>}
            {metadata.unfinished && <span className="ui-pagehead-unfinished" aria-hidden="true">🚧</span>}
          </h1>
          {end}
          {icon && <div className="ui-pagehead-icon">{icon}</div>}
        </div>
        <p lang={languageOf(metadata.description)}>{$(metadata.description)}</p>
        {metadata.package && <PackageBadges {...metadata.package} translate={$} />}
        {(metadata.unfinished || metadata.disabled) &&
          <div className="ui-callout" data-tone="warning" role="note"><IconAlertTriangle aria-hidden="true" /><div>{$('This page is still under construction and some content may not be complete.')}</div></div>}
      </div>
      {!!toc?.length && <PageContentDisclosure items={toc.map((item: any) => ({ ...item, title: $(item.title), lang: languageOf(item.title) }))} label={$('On this page')} />}
    </>
  )
}
