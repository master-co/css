import { getContext } from 'svelte'
import i18nConfig from './common/i18n.config.js'
import units from '~/site/units'

export type SiteLocale = typeof i18nConfig.locales[number]

/** What every page knows about where it is; `astro/site-context` derives it from the URL. */
export interface SiteContextValue {
  locale: SiteLocale
  /** Canonical pathname without the default locale prefix. */
  pathname: string
  translations: Record<string, string>
}

export interface SiteI18n {
  translations: Record<string, string>
  defaultLocale: string
  locales: readonly string[]
  localizablePathnameRoots: string[]
  hreflangOfLocale: Record<string, string>
  nameOfLocale: Record<string, string>
}

export interface Site extends SiteContextValue {
  i18n: SiteI18n
  /** Translate a dictionary key; unknown keys read as themselves. */
  t(text: any): string
}

/** The Svelte renderer provides the page's site context under this key. */
export const siteContextKey = 'master-css:site'
/** Document.astro serializes the site context into this element for client islands. */
export const siteContextElementId = 'site-context'

const localizablePathnameRoots = Object.keys(units)
const sites = new WeakMap<SiteContextValue, Site>()

export function createSite(value: SiteContextValue): Site {
  let site = sites.get(value)
  if (!site) {
    const { translations } = value
    site = {
      ...value,
      i18n: { ...i18nConfig, localizablePathnameRoots, translations } as SiteI18n,
      t: (text: any) => translations[text || ''] || text
    }
    sites.set(value, site)
  }
  return site
}

let clientSite: Site | undefined

/** Read the context Document.astro serializes for client islands. */
export function readSiteContext(): SiteContextValue {
  const element = document.getElementById(siteContextElementId)
  if (!element?.textContent) throw new Error(`Missing #${siteContextElementId}`)
  return JSON.parse(element.textContent)
}

/**
 * The current page's site for Svelte components. Call it during component initialization:
 * the server renderer provides it as context, and hydrated islands read the page's serialized copy.
 */
export function getSite(): Site {
  const value = getContext<SiteContextValue | undefined>(siteContextKey)
  if (value) return createSite(value)
  if (typeof document === 'undefined') throw new Error('getSite() must run inside a component rendered by the site')
  return clientSite ??= createSite(readSiteContext())
}
