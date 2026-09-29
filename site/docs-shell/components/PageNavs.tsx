import { IconChevronLeft } from '@tabler/icons-react'
import Link from './Link'
import clsx from 'clsx'
import { createTranslation } from '../utils/i18n'

export default async function PageNavs({ pageCategories, metadata, locale, dictionaries }: any) {
  const $ = await createTranslation(locale, dictionaries)
  const unit = metadata?.pathname?.split('/')?.[1]
  let pages = (pageCategories?.flatMap((category: any) => category.pages) || [])
    .filter(({ pathname }: any) => pathname.split('/').length <= 3 && unit)
  const currentPageIndex = pages.findIndex(({ fileURL }: any) => metadata.fileURL === fileURL)
  let prevDefinedMetadata = currentPageIndex !== -1 && pages[currentPageIndex - 1]
  let nextDefinedMetadata = currentPageIndex !== -1 && pages[currentPageIndex + 1]
  const Nav = ({ definedMetadata, navigatorIconClass }: any) =>
    <Link href={definedMetadata.pathname} passHref className="flex-grow:1 flex-shrink:1 flex-basis:100% flex-direction:column justify-content:start! r-sm flex-grow:1@sm flex-shrink:1@sm flex-basis:50%@sm">
      <div className='display:flex align-items:center'>
        <IconChevronLeft className={clsx('height:14px width:14px stroke-text-muted vertical-align:middle', navigatorIconClass)} />
        <span className="font-size-xs fg-text-muted">{$(definedMetadata.category)}</span>
      </div>
      <div className="clamp-lines(1) width:100% mt-sm font-size-md fg-text-strong">{$(definedMetadata.title.absolute || definedMetadata.title)}</div>
      {definedMetadata.description && (
        <p className="clamp-lines(2) width:100% margin-bottom:0 margin-top:0.625rem text-xs text-wrap:pretty fg-text-body font-weight:460_b">
          {$(definedMetadata.description)}
        </p>
      )}
    </Link>
  return (nextDefinedMetadata || prevDefinedMetadata) && (
    <>
      <hr className="hr" />
      <div className="display:flex gap:2.5rem flex-wrap:wrap@media((width<52.125rem))">
        {prevDefinedMetadata && <Nav definedMetadata={prevDefinedMetadata} navigatorIconClass="margin-left:-0.25rem margin-right:0.375rem margin-top:-0.125rem" />}
        {nextDefinedMetadata && <Nav definedMetadata={nextDefinedMetadata} navigatorIconClass="margin-left:0.375rem order:1 rotate:180deg margin-top:-0.125rem" />}
      </div>
    </>
  )

}
