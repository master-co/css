interface Locales {
  locale: string
  defaultLocale: string
  hreflangOfLocale?: Record<string, string>
}

interface Languages extends Locales {
  translations: Record<string, string>
}

/**
 * Text a translated page shows in the post's own language (the title or body before it is translated) keeps that
 * language, so screen readers pronounce it correctly and type set for Han text leaves it alone.
 */
export function sourceLanguageOf(text: string | undefined, { locale, defaultLocale, translations, hreflangOfLocale }: Languages) {
  if (!text || locale === defaultLocale || translations[text]) return undefined
  return hreflangOfLocale?.[defaultLocale] ?? defaultLocale
}

/**
 * The language of a post's body on a translated page: its source language while no `content.<locale>.mdx` sits beside
 * the source (the key format of docs-shell/factories/create-page), otherwise the page's own.
 */
export function contentLanguageOf(sourcePath: string | undefined, translatedContent: Set<string>, { locale, defaultLocale, hreflangOfLocale }: Locales) {
  if (locale === defaultLocale) return undefined
  const directory = /^site\/content\/(.+)\/content\.mdx$/.exec(sourcePath ?? '')?.[1]
  if (directory && translatedContent.has(`/content/${directory}/content.${locale}.mdx`)) return undefined
  return hreflangOfLocale?.[defaultLocale] ?? defaultLocale
}
