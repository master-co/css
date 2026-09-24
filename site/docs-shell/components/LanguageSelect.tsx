'use client'

import { usePathname, useRouter } from 'next/navigation'
import clsx from 'clsx'
import { useLocale } from '../contexts/locale'
import { useI18n } from '../contexts/i18n'
import { localizePathname } from '../utils/i18n-pathname'

export default function LanguageSelect({ className, children, ...props }: { className?: string, [key: string]: any, children?: React.ReactElement }) {
  const router = useRouter()
  const pathname = usePathname()
  const locale = useLocale()
  const i18n = useI18n()
  return (
    <>
      <select {...props} className={clsx('abs inset:0 full opacity:0 cursor:pointer', className)}
        onChange={async (event: any) => {
          if (!pathname) return
          const newLocale = event.target.value
          const splits = pathname.split('/')
          for (const eachLocale of i18n.locales) {
            if (splits[1] === eachLocale) {
              splits.splice(1, 1)
              break
            }
          }
          router.push(localizePathname(splits.join('/') || '/', {
            defaultLocale: i18n.defaultLocale,
            locale: newLocale,
            locales: i18n.locales,
            localePrefixMode: i18n.localePrefixMode,
            localizablePathnameRoots: i18n.localizablePathnameRoots
          }))
        }}
        defaultValue={locale}>
        {Object.entries(i18n.nameOfLocale).map(([eachLocale, localeName]) => (
          <option key={eachLocale} value={eachLocale}>
            {localeName as string}
          </option>
        ))}
        </select>
      {children}
    </>
  )
}
