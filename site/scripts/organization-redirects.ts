/** Master must be deployed before the product site publishes these redirects. */
export function organizationRedirects() {
    const posts = ['master-css-next', 'bootstrapping-master-css-with-vite']
    const rules: string[] = []
    for (const locale of ['', '/en', '/tw']) {
        for (const [source, destination] of [
            ['/blog', '/blog'], ['/brand', '/brand/master-css'], ['/design-system', '/design-system'],
            ...posts.map(slug => [`/blog/${slug}`, `/blog/${slug}`]),
        ]) {
            for (const suffix of ['', '/', '.html']) rules.push(`${locale}${source}${suffix} https://master.co${destination} 301`)
            if (source !== '/blog') rules.push(`${locale}${source}.md https://master.co${destination}.md 301`)
        }
    }
    for (const locale of ['', '/en', '/tw']) rules.push(`${locale}/design-system/* https://master.co/design-system/:splat 301`)
    // No wildcard for Blog: an unpublished draft or unknown slug must remain 404.
    // Brand downloads keep their committed URLs for product icons and old links.
    return rules
}
