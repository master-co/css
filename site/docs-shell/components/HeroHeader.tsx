
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
      <GridsBg className="abs left top z:-2 h:450px w:100%" />
      <div className='max-w:var(--breakpoint-md) mx:auto px:1.25rem pt:7.5rem pt:11.25rem@sm'>
        {metadata.date && <div className='flex justify-center gap-xs mb-sm fg-accent'>
          <span>{formattedDate}</span>
        </div>}
        <h1 className='max-w:var(--breakpoint-sm) mx:auto font-weight:normal font-3xl tracking-tight text-center text-pretty text-gradient background-image:linear-gradient(180deg,var(--color-gray-60),var(--color-gray-90)) surface-raised text-fill-color:transparent background-image:linear-gradient(180deg,oklch(100%|0|none),var(--color-gray-40))@dark font-size:64px@sm'>
          {$(metadata.title.absolute || metadata.title)}
        </h1>
        {metadata.authors && <AuthorList className="items-center justify-center gap-xl mt-2xl" isLink>{metadata.authors}</AuthorList>}
      </div>
    </>
  )
}
