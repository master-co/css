
'use client'

import { GridsBg } from '../components/GridsBg'
import AuthorList from '../components/AuthorList'
import { useTranslation } from '../contexts/i18n'
import dayjs from 'dayjs'

export default function HeroHeader({ metadata }: any) {
  const $ = useTranslation()
  const formattedDate = dayjs(metadata.date).format('ddd, MMMM D, YYYY')
  return (
    <>
      <GridsBg className="position:absolute left:0 top:0 z-index:-2 height:450px width:100%" />
      <div className='max-width:64rem margin-inline:auto padding-inline:1.25rem padding-top:7.5rem padding-top:11.25rem@sm'>
        {metadata.date && <div className='display:flex justify-content:center gap-xs mb-sm fg-accent'>
          <span>{formattedDate}</span>
        </div>}
        <h1 className='max-width:52.125rem margin-inline:auto font-size-3xl font-weight:normal tracking-tight text-wrap:pretty text-align:center background-clip:text bg-surface-raised background-image:linear-gradient(180deg,var(--color-gray-60),var(--color-gray-90)) -webkit-text-fill-color:transparent background-image:linear-gradient(180deg,oklch(100%|0|none),var(--color-gray-40))@apply(--site-dark) font-size:64px@sm'>
          {$(metadata.title.absolute || metadata.title)}
        </h1>
        {metadata.authors && <AuthorList className="align-items:center justify-content:center gap-xl mt-2xl" isLink>{metadata.authors}</AuthorList>}
      </div>
    </>
  )
}
