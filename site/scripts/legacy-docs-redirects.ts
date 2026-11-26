/**
 * Master CSS v1 documented concepts under `/docs/*` (and `/tw/docs/*`, its only translation).
 * Only pages whose subject has an exact v2 successor are listed; the v1 per-property pages were
 * deliberately retired and stay 404 rather than pointing at an unrelated page.
 */
export const legacyDocsDestinations: Readonly<Record<string, string>> = {
    'setup': '/guide/installation',
    'setup/angular': '/guide/installation/angular',
    'setup/astro': '/guide/installation/astro',
    'setup/nextjs': '/guide/installation/nextjs',
    'setup/nuxtjs': '/guide/installation/nuxtjs',
    'setup/svelte': '/guide/installation/svelte',
    'setup/webpack': '/guide/installation/webpack',
    'why-master-css': '/guide/introduction',
    'syntax-tutorial': '/guide/syntax-tutorial',
    'reusing-design': '/guide/reusing-styles',
    'customization': '/guide/theme',
    'colors': '/guide/colors',
    'hybrid-rendering': '/guide/rendering-modes',
    'preset-global-styles': '/guide/global-styles',
    'grid-system': '/guide/layout-system',
    'grid-and-flex-layout': '/guide/layout-system',
    'developer-tools': '/guide/language-service',
    'selectors': '/reference/rules/selectors',
    'media-queries': '/reference/rules/conditions',
    'supports': '/reference/rules/conditions',
    'breakpoints': '/reference/rules/named-conditions',
    'variable': '/reference/rules/modes',
    'color-schemes': '/reference/rules/modes',
    'grid-columns': '/reference/grid-tracks',
    'grid-rows': '/reference/grid-tracks',
    'text-size': '/reference/tokens/text',
    'line-clamp': '/reference/truncation',
    'screen-readers': '/reference/sr-only',
}

/** v1 published English at the root (with an `/en` alias) and Traditional Chinese under `/tw`. */
export function legacyDocsRedirects() {
    const rules: string[] = []
    for (const [locale, destinationLocale] of [['', ''], ['/en', ''], ['/tw', '/tw']]) {
        for (const [slug, destination] of Object.entries(legacyDocsDestinations)) {
            for (const suffix of ['', '/', '.html']) rules.push(`${locale}/docs/${slug}${suffix} ${destinationLocale}${destination} 301`)
        }
    }
    return rules
}
