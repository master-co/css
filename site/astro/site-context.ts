import i18n from '../docs-shell/common/i18n.config.js'
import en from '../public/dictionaries/en.json' with { type: 'json' }
import tw from '../public/dictionaries/tw.json' with { type: 'json' }
import type { SiteContextValue, SiteLocale } from '../docs-shell/layouts/root'

const translations: Record<SiteLocale, Record<string, string>> = { en, tw }

export function localeOfPathname(pathname: string): SiteLocale {
  const segment = pathname.split('/')[1]
  return (i18n.locales as readonly string[]).includes(segment) ? segment as SiteLocale : i18n.defaultLocale as SiteLocale
}

/** Normalize a request URL into the canonical site pathname used by navigation state. */
export function canonicalPathname(pathname: string) {
  const normalized = decodeURI(pathname)
    .replace(/\.html$/, '')
    .replace(/\/index$/, '/')
    .replace(/(.)\/$/, '$1')
  const locale = localeOfPathname(normalized)
  if (locale !== i18n.defaultLocale) return normalized
  return normalized.replace(new RegExp(`^/${i18n.defaultLocale}(?=/|$)`), '') || '/'
}

export function siteContextOf(url: URL): SiteContextValue {
  const pathname = canonicalPathname(url.pathname)
  const locale = localeOfPathname(pathname)
  return { locale, pathname, translations: translations[locale] }
}
