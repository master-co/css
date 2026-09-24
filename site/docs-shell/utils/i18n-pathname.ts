export type LocalePrefixMode = 'always' | 'canonical'

export interface LocalizePathnameOptions {
  defaultLocale: string
  locale: string
  locales: readonly string[]
  localePrefixMode?: LocalePrefixMode
  localizablePathnameRoots?: readonly string[]
}

const nonPagePathnameRoots = new Set([
  '_next',
  'api',
  'assets',
  'cdn',
  'fonts',
  'images',
  'og',
  'play-compiler',
  'search'
])

export function localizePathname(href: string, {
  defaultLocale,
  locale,
  locales,
  localePrefixMode = 'canonical',
  localizablePathnameRoots
}: LocalizePathnameOptions) {
  if (!href || !href.startsWith('/') || href.startsWith('//')) return href

  const parsedHref = parseLocalHref(href)
  if (!parsedHref || findPathnameLocale(parsedHref.pathname, locales)) return href
  if (!isLocalizablePathname(parsedHref.pathname, localizablePathnameRoots)) return href

  if (locale === defaultLocale && localePrefixMode !== 'always') return href

  const localizedPathname = `/${locale}${parsedHref.pathname === '/' ? '' : parsedHref.pathname}`
  return localizedPathname + parsedHref.suffix
}

export function canonicalizeDefaultLocalePathname(href: string, defaultLocale: string) {
  const parsedHref = parseLocalHref(href)
  if (!parsedHref) return href

  const defaultLocalePrefix = `/${defaultLocale}`
  if (parsedHref.pathname === defaultLocalePrefix) {
    return '/' + parsedHref.suffix
  }

  if (parsedHref.pathname.startsWith(defaultLocalePrefix + '/')) {
    return parsedHref.pathname.slice(defaultLocalePrefix.length) + parsedHref.suffix
  }

  return href
}

function parseLocalHref(href: string) {
  const endIndex = firstPathnameEndIndex(href)
  const pathname = href.slice(0, endIndex)
  if (!pathname.startsWith('/')) return

  return {
    pathname,
    suffix: href.slice(endIndex)
  }
}

function firstPathnameEndIndex(href: string) {
  const queryIndex = href.indexOf('?')
  const hashIndex = href.indexOf('#')
  if (queryIndex === -1) return hashIndex === -1 ? href.length : hashIndex
  if (hashIndex === -1) return queryIndex
  return Math.min(queryIndex, hashIndex)
}

function findPathnameLocale(pathname: string, locales: readonly string[]) {
  const firstSegment = getFirstPathnameSegment(pathname)
  return firstSegment && locales.includes(firstSegment)
}

function isLocalizablePathname(pathname: string, localizablePathnameRoots?: readonly string[]) {
  if (pathname === '/') return true
  if (hasFileExtension(pathname)) return false

  const firstSegment = getFirstPathnameSegment(pathname)
  if (!firstSegment || nonPagePathnameRoots.has(firstSegment)) return false

  return !localizablePathnameRoots?.length || localizablePathnameRoots.includes(firstSegment)
}

function hasFileExtension(pathname: string) {
  const lastSegment = pathname.split('/').pop() || ''
  return /\.[^./]+$/.test(lastSegment)
}

function getFirstPathnameSegment(pathname: string) {
  return pathname.split('/')[1] || ''
}
