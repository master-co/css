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
    <Link href={definedMetadata.pathname} passHref className="flex-col flex:1|1|100% justify-start! r:sm flex:1|1|50%@sm">
      <div className='flex items-center'>
        <IconChevronLeft className={clsx('size:14px stroke:text-subtle vertical-align:middle', navigatorIconClass)} />
        <span className="font:xs text:muted">{$(definedMetadata.category)}</span>
      </div>
      <div className="line-clamp:1 w:full mt:sm font:md text:strong">{$(definedMetadata.title.absolute || definedMetadata.title)}</div>
      {definedMetadata.description && (
        <p className="line-clamp:2 w:full mb:0 mt:0.625rem text:xs text-pretty text:body font-weight:460_b">
          {$(definedMetadata.description)}
        </p>
      )}
    </Link>
  return (nextDefinedMetadata || prevDefinedMetadata) && (
    <>
      <hr className="hr" />
      <div className="flex gap:10x flex-wrap@<sm">
        {prevDefinedMetadata && <Nav definedMetadata={prevDefinedMetadata} navigatorIconClass="ml:-1x mr:0.375rem mt:-0.125rem" />}
        {nextDefinedMetadata && <Nav definedMetadata={nextDefinedMetadata} navigatorIconClass="ml:0.375rem order:1 rotate:180deg mt:-0.125rem" />}
      </div>
    </>
  )

}
