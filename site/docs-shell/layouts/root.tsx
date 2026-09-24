'use client'

import i18n from '../common/i18n.config.js'
import { RedirectsProvider } from '../contexts/redirects'
import { LocaleProvider } from '../contexts/locale'
import { I18nProvider } from '../contexts/i18n'
import ThemeModeProvider from '@master/theme-mode.react'
import { SearchProvider } from '../contexts/search'
import { App, AppProvider } from '../contexts/app'

export interface RootLayoutProps {
  children: React.ReactNode
  locale: typeof i18n['locales'][number]
  app: App
  localePrefixMode?: 'always' | 'canonical'
  localizablePathnameRoots?: string[]
  translations: any
  redirects: any[]
  style?: React.CSSProperties
  hidden?: boolean
}

export default function RootLayout({ children, locale, app, redirects, translations, localePrefixMode, localizablePathnameRoots }: RootLayoutProps) {
  return (
    <AppProvider value={app}>
      <ThemeModeProvider preference='system'>
        <RedirectsProvider value={redirects}>
          <I18nProvider value={{ ...i18n, localePrefixMode, localizablePathnameRoots, translations }}>
            <LocaleProvider value={locale}>
              <SearchProvider>
                {children}
              </SearchProvider>
            </LocaleProvider>
          </I18nProvider>
        </RedirectsProvider>
      </ThemeModeProvider>
    </AppProvider>
  )
}
