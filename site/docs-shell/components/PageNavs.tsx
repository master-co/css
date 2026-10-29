import { IconChevronLeft } from '@tabler/icons-react'
import Link from './Link'
import clsx from 'clsx'
import { createTranslation } from '../utils/i18n'

export default async function PageNavs({ pageCategories, metadata, locale, dictionaries }: any) {
  const $ = await createTranslation(locale, dictionaries)
  const unit = metadata?.pathname?.split('/')?.[1]
  let pages = (pageCategories?.flatMap((category: any) => category.pages) || [])
    .filter(({ pathname }: any) => pathname.split('/').length <= 3 && unit)
  const currentPageIndex = pages.findIndex(({ pathname }: any) => metadata.pathname === pathname)
  let prevDefinedMetadata = currentPageIndex !== -1 && pages[currentPageIndex - 1]
  let nextDefinedMetadata = currentPageIndex !== -1 && pages[currentPageIndex + 1]
  const Nav = ({ definedMetadata, navigatorIconClass, direction }: any) =>
    <Link href={definedMetadata.pathname} rel={direction} aria-label={`${locale === 'tw' ? direction === 'prev' ? '上一篇' : '下一篇' : direction === 'prev' ? 'Previous' : 'Next'}: ${$(definedMetadata.title.absolute || definedMetadata.title)}`} className="flex-basis:100% flex-direction:column flex-grow:1 flex-shrink:1 justify-content:start! r-sm flex-basis:50%@sm flex-grow:1@sm flex-shrink:1@sm">
      <div className='display:flex align-items:center'>
        <IconChevronLeft aria-hidden="true" className={clsx('height:14px width:14px stroke-text-muted vertical-align:middle', navigatorIconClass)} />
        <span className="font-xs fg-text-muted">{$(definedMetadata.category)}</span>
      </div>
      <div className="overflow-wrap:anywhere width:100% mt-sm font-md fg-text-strong">{$(definedMetadata.title.absolute || definedMetadata.title)}</div>
      {definedMetadata.description && (
        <p className="clamp-lines(2) width:100% margin-bottom:0 margin-top:0.625rem text-xs text-wrap:pretty fg-text-body font-weight:460_b">
          {$(definedMetadata.description)}
        </p>
      )}
    </Link>
  return (nextDefinedMetadata || prevDefinedMetadata) && (
    <>
      <hr className="hr" />
      <nav className="display:flex gap:2.5rem flex-wrap:wrap@media((width<52.125rem)) doc-page-navigation" aria-label={locale === 'tw' ? '前後篇文件' : 'Previous and next documents'}>
        {prevDefinedMetadata && <Nav direction="prev" definedMetadata={prevDefinedMetadata} navigatorIconClass="margin-left:-0.25rem margin-right:0.375rem margin-top:-0.125rem" />}
        {nextDefinedMetadata && <Nav direction="next" definedMetadata={nextDefinedMetadata} navigatorIconClass="margin-left:0.375rem order:1 rotate:180deg margin-top:-0.125rem" />}
      </nav>
    </>
  )

}
