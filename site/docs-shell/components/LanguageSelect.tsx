'use client'

import clsx from 'clsx'
import { useLocale } from '../contexts/locale'
import { useI18n } from '../contexts/i18n'
import { localizePathname } from '../utils/i18n-pathname'
import { usePathname } from '../layouts/root'

export default function LanguageSelect({ className, children, ...props }: { className?: string, [key: string]: any, children?: React.ReactElement }) {
  const pathname = usePathname()
  const locale = useLocale()
  const i18n = useI18n()
  return (
    <>
      <select {...props} className={clsx('position:absolute inset:0 height:100% width:100% opacity:0 cursor:pointer doc-preference-select', className)}
        onChange={(event: any) => {
          const newLocale = event.target.value
          const splits = pathname.split('/')
          for (const eachLocale of i18n.locales) {
            if (splits[1] === eachLocale) {
              splits.splice(1, 1)
              break
            }
          }
          location.assign(localizePathname(splits.join('/') || '/', {
            defaultLocale: i18n.defaultLocale,
            locale: newLocale,
            locales: i18n.locales,
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
