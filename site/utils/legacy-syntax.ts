import mappings from './legacy-syntax.json'

export type LegacySyntaxSlug = keyof typeof mappings
export const legacySyntaxPages = mappings

export function localizeSyntaxURL(url: string, locale: string) {
  return `${locale === 'tw' || locale === 'en' ? `/${locale}` : ''}${url}`
}

/** Old fragments are browser-only; all destinations come from the fixed migration map. */
export function legacySyntaxDestination(slug: LegacySyntaxSlug, hash = '', locale = 'en') {
  const page = mappings[slug]
  let anchor = hash.replace(/^#/, '')
  try { anchor = decodeURIComponent(anchor) } catch { /* A malformed fragment uses the tutorial fallback. */ }
  const anchors = page.anchors as Record<string, string>
  const target = Object.hasOwn(anchors, anchor) ? anchors[anchor] : page.tutorial
  return localizeSyntaxURL(target, locale)
}
