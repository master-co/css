import Link from './Link'
import { createTranslation } from '../utils/i18n'

/** The previous and next documents in the section's order, as a `ui-pager`. */
export default async function PageNavs({ pageCategories, metadata, locale, dictionaries }: any) {
  const $ = await createTranslation(locale, dictionaries)
  const tw = locale === 'tw'
  const unit = metadata?.pathname?.split('/')?.[1]
  const pages = (pageCategories?.flatMap((category: any) => category.pages) || [])
    .filter(({ pathname }: any) => pathname.split('/').length <= 3 && unit)
  const currentPageIndex = pages.findIndex(({ pathname }: any) => metadata.pathname === pathname)
  const prevDefinedMetadata = currentPageIndex !== -1 && pages[currentPageIndex - 1]
  const nextDefinedMetadata = currentPageIndex !== -1 && pages[currentPageIndex + 1]
  const Nav = ({ definedMetadata, direction }: any) => {
    const label = direction === 'prev' ? (tw ? '上一篇' : 'Previous') : (tw ? '下一篇' : 'Next')
    const title = $(definedMetadata.title.absolute || definedMetadata.title)
    return <Link href={definedMetadata.pathname} rel={direction} aria-label={`${label}: ${title}`}>
      <small>{label}</small>
      <b>{title}</b>
    </Link>
  }
  return (nextDefinedMetadata || prevDefinedMetadata) && (
    <nav className="ui-pager" aria-label={tw ? '前後篇文件' : 'Previous and next documents'}>
      {prevDefinedMetadata && <Nav direction="prev" definedMetadata={prevDefinedMetadata} />}
      {nextDefinedMetadata && <Nav direction="next" definedMetadata={nextDefinedMetadata} />}
    </nav>
  )
}
