
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
      <GridsBg className="abs left top z:-2 h:450px w:full" />
      <div className='max-w:breakpoint-md mx:auto px:5x pt:30x pt:45x@sm'>
        {metadata.date && <div className='flex justify-center gap:xs mb:sm fg:accent'>
          <span>{formattedDate}</span>
        </div>}
        <h1 className='max-w:breakpoint-sm mx:auto font-weight:normal font:3xl tracking:tight text-center text-pretty text-gradient bg:linear-gradient(180deg,gray-60,gray-90) surface:raised text-fill-color:transparent bg:linear-gradient(180deg,white,gray-40)@dark font:64px@sm'>
          {$(metadata.title.absolute || metadata.title)}
        </h1>
        {metadata.authors && <AuthorList className="items-center justify-center gap:xl mt:2xl" isLink>{metadata.authors}</AuthorList>}
      </div>
    </>
  )
}
