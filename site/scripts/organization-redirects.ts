import { locales } from '@master/internal-site/common/locales.js'
import legacyDesignManifest from '@master/internal-site/data/legacy-design-routes.json' with { type: 'json' }
import { legacyDesignRedirects, legacyDesignWorker, legacyDesignWorkerRoutes } from '@master/internal-site/build/legacy-design-routes.ts'

/** Enable the cutover only after the manifest's destinations have been deployed and verified. */
export function organizationRedirects(cutover = process.env.MASTER_LEGACY_DESIGN_CUTOVER === '1') {
    const posts = ['master-css-next', 'bootstrapping-master-css-with-vite']
    const rules: string[] = []
    for (const locale of ['', '/en', ...locales.filter(locale => locale !== 'en').map(locale => `/${locale}`)]) {
        const destinationLocale = locale === '/en' ? '' : locale
        for (const [source, destination] of [
            ['/blog', '/blog'], ['/brand', '/brand/master-css'],
            ...(!cutover ? [['/design-system', '/design-system']] : []),
            ...posts.map(slug => [`/blog/${slug}`, `/blog/${slug}`]),
        ]) {
            for (const suffix of ['', '/', '.html']) rules.push(`${locale}${source}${suffix} https://master.co${destinationLocale}${destination} 301`)
            if (source !== '/blog') rules.push(`${locale}${source}.md https://master.co${destinationLocale}${destination}.md 301`)
        }
    }
    if (cutover) rules.push(...legacyDesignRedirects(legacyDesignManifest))
    else for (const locale of ['', '/en', ...locales.filter(locale => locale !== 'en').map(locale => `/${locale}`)]) rules.push(`${locale}/design-system/* https://master.co${locale === '/en' ? '' : locale}/design-system/:splat 301`)
    // No wildcard for Blog: an unpublished draft or unknown slug must remain 404.
    // Brand downloads keep their committed URLs for product icons and old links.
    return rules
}

export function legacyDesignAssets(cutover = process.env.MASTER_LEGACY_DESIGN_CUTOVER === '1') {
    return cutover ? {
        worker: legacyDesignWorker(legacyDesignManifest),
        routes: legacyDesignWorkerRoutes(legacyDesignManifest),
    } : undefined
}
