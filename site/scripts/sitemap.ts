import { languageOf, locales } from '@master/internal-site/common/locales.js'

const escape = (value: string) => value.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;')

export function renderSitemap(groups: ReadonlyMap<string, ReadonlyMap<string, string>>) {
    // Directory walks can complete in different orders on CI and Pages.
    const sorted = [...groups].sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0)
    const entries = sorted.flatMap(([, variants]) => {
        const translations = locales.flatMap(locale => {
            const url = variants.get(locale)
            return url === undefined ? [] : [[locale, url] as const]
        })
        if (translations.length === 1) return [`  <url>\n    <loc>${escape(translations[0][1])}</loc>\n  </url>`]
        const alternates = translations.map(([locale, url]) => `    <xhtml:link rel="alternate" hreflang="${languageOf(locale)}" href="${escape(url)}"/>`)
        const english = variants.get('en')
        if (english) alternates.push(`    <xhtml:link rel="alternate" hreflang="x-default" href="${escape(english)}"/>`)
        return translations.map(([, canonical]) => `  <url>\n    <loc>${escape(canonical)}</loc>\n${alternates.join('\n')}\n  </url>`)
    })
    return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
  xmlns:xhtml="http://www.w3.org/1999/xhtml">
${entries.join('\n')}
</urlset>
`
}
