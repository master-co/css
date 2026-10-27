import { useContext, useMemo, type ReactNode } from 'react'
import i18n from '../common/i18n.config.js'
import { LocaleProvider } from '../contexts/locale'
import { I18nProvider } from '../contexts/i18n'
import { AppProvider } from '../contexts/app'
import app from '~/site/app-config'
import units from '~/site/units'
import { sharedContext } from '~/site/islands/context'

export type SiteLocale = typeof i18n.locales[number]

export interface SiteContextValue {
  locale: SiteLocale
  /** Canonical pathname without the default locale prefix. */
  pathname: string
  translations: Record<string, string>
}

export const siteContextElementId = 'site-context'
export const SiteContext = sharedContext<SiteContextValue | null>('site', null)

const localizablePathnameRoots = Object.keys(units)

export function usePathname() {
  const site = useContext(SiteContext)
  if (!site) throw new Error('usePathname must be used within SiteRoot')
  return site.pathname
}

/** Read the context Html.astro serializes for client islands. */
export function readSiteContext(): SiteContextValue {
  const element = document.getElementById(siteContextElementId)
  if (!element?.textContent) throw new Error(`Missing #${siteContextElementId}`)
  return JSON.parse(element.textContent)
}

export function SiteRoot({ locale, pathname, translations, children }: SiteContextValue & { children?: ReactNode }) {
  const site = useMemo(() => ({ locale, pathname, translations }), [locale, pathname, translations])
  const i18nValue = useMemo(() => ({ ...i18n, localizablePathnameRoots, translations }), [translations])
  return (
    <SiteContext.Provider value={site}>
      <AppProvider value={app}>
        <I18nProvider value={i18nValue}>
          <LocaleProvider value={locale}>
            {children}
          </LocaleProvider>
        </I18nProvider>
      </AppProvider>
    </SiteContext.Provider>
  )
}
