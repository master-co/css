'use client'

import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/zh-tw'
import 'dayjs/locale/en'
import { useLayoutEffect, useState } from 'react'
import { useLocale } from '../contexts/locale'

dayjs.extend(relativeTime)

const locales: any = {
  tw: 'zh-tw',
  en: 'en'
}

export default function TimeAgo({ timestamp }: any) {
  const locale = useLocale()
  const [formattedDate, setFormattedDate] = useState(() => dayjs(timestamp).format('ddd, MMMM D YYYY'))

  useLayoutEffect(() => {
    setFormattedDate(dayjs(timestamp).locale(locales[locale]).fromNow())
  }, [timestamp, locale])

  return <>{formattedDate}</>
}