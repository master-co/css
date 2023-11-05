import i18n, { hreflangOfLocale } from 'websites-shared/i18n.config.mjs'
import pages from '../[locale]/(root)/pages'

export function GET(request: Request) {
    const baseUrl = `${request.headers.get('referer') ? new URL(request.headers.get('referer') as string).protocol : 'https:'}//${request.headers.get('host')}`

    return new Response(
        `<?xml version="1.0" encoding="UTF-8"?>
        <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
  xmlns:xhtml="http://www.w3.org/1999/xhtml">
            ${pages.map(eachPage => `<url>
                <loc>${baseUrl + eachPage.pathname.slice(1)}</loc>
                ${i18n.locales.map((eachLocale) => `<xhtml:link rel="alternate" hreflang="${(hreflangOfLocale as any)[eachLocale] ?? eachLocale}" href="${baseUrl}${eachLocale === i18n.defaultLocale ? '' : '/' + eachLocale}${eachPage.pathname.slice(1)}"/>`).join('\n')}
            </url>`).join('\n')}
        </urlset>`,
        {
            headers: {
                'Cache-Control': 'public, max-age=0',
                'Content-Type': 'application/xml'
            }
        })
}