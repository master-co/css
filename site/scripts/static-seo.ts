import { readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { parseFragment } from 'parse5'
import { defaultLocale, locales } from '@master/internal-site/common/locales.js'
import { renderSitemap } from './sitemap'

const graphLocales: Record<string, string> = { en: 'en_US', tw: 'zh_TW', ja: 'ja_JP', ko: 'ko_KR', cn: 'zh_CN' }
const generatedTags = /<!--master-css-seo-->[\s\S]*?<!--\/master-css-seo-->(?=<\/head>)/i
const attribute = (value: string) => value.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;')

interface PublishedPage {
    file: string
    href: string
    prefix: string
    identity: string
    title: string
    markdown: boolean
    graph: string
}

/** Use published ancestors only. Reference has grouping directories without a landing page. */
function breadcrumbs(page: PublishedPage, published: ReadonlyMap<string, PublishedPage>) {
    if (!/^\/(guide|reference)\//.test(page.identity)) return ''
    const segments = page.identity.slice(1).split('/')
    const ancestors = [page.prefix || '/', ...segments.map((_, i) => page.prefix + '/' + segments.slice(0, i + 1).join('/'))]
    const trail = ancestors.flatMap(route => {
        const ancestor = published.get(route)
        return ancestor ? [{ name: ancestor.title, item: ancestor.href }] : []
    })
    if (trail.length < 2) return ''
    const data = {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: trail.map((entry, index) => ({ '@type': 'ListItem', position: index + 1, ...entry }))
    }
    return `<script type="application/ld+json">${JSON.stringify(data).replaceAll('<', '\\u003c')}</script>`
}

export async function finalizeSeo(outDir: string, origin: string, files: string[]) {
    const inventory = new Set(files)
    const published = new Map<string, PublishedPage>()
    const groups = new Map<string, Map<string, string>>()
    for (const file of files.filter(file => file.endsWith('.html')).sort()) {
        const original = await readFile(file, 'utf8')
        const html = original.replace(generatedTags, '')
        const head = /<head\b[^>]*>([\s\S]*?)<\/head>/i.exec(html)
        if (!head) throw new Error(`Missing document head: ${file}`)
        const tags: Record<string, string>[] = parseFragment(head[1]).childNodes.flatMap(node =>
            'tagName' in node && (node.tagName === 'link' || node.tagName === 'meta')
                ? [{ tag: node.tagName, ...Object.fromEntries(node.attrs.map(({ name, value }) => [name, value])) }]
                : [])
        if (tags.some(tag => tag.name?.toLowerCase() === 'robots' && /\bnoindex\b/i.test(tag.content))) {
            if (html !== original) await writeFile(file, html, 'utf8')
            continue
        }
        const pathname = '/' + path.relative(outDir, file).split(path.sep).join('/').replace(/(?:^|\/)index\.html$|\.html$/g, '')
        const href = new URL(pathname, origin).href
        const canonicals = tags.filter(tag => tag.tag === 'link' && tag.rel === 'canonical')
        if (canonicals.length !== 1 || canonicals[0].href !== href) {
            throw new Error(`${file}: expected one canonical ${href}, found ${JSON.stringify(canonicals.map(tag => tag.href))}`)
        }
        if (published.has(pathname)) throw new Error(`Duplicate canonical ${href}: ${published.get(pathname)!.file} and ${file}`)
        const segment = pathname.split('/')[1]
        const locale = locales.find(locale => locale === segment) ?? defaultLocale
        const prefix = locale === defaultLocale ? '' : '/' + locale
        const identity = pathname.slice(prefix.length) || '/'
        if (!groups.has(identity)) groups.set(identity, new Map())
        groups.get(identity)!.set(locale, href)
        if (!inventory.has(path.join(outDir, prefix, 'llms.txt'))) throw new Error(`${file}: missing ${prefix}/llms.txt`)

        const markdown = /^\/(?:guide|reference)(?:\/|$)|^\/benchmarks$/.test(identity)
        let title = 'Master CSS'
        if (markdown) {
            const filename = path.join(outDir, pathname + '.md')
            if (!inventory.has(filename)) throw new Error(`${file}: missing Markdown export ${filename}`)
            const firstHeading = /^# ([^\r\n]+)/.exec(await readFile(filename, 'utf8'))?.[1].trim()
            if (!firstHeading) throw new Error(`${filename}: missing Markdown title`)
            title = firstHeading
        }
        const graph = Object.entries({
            'og:url': href,
            'og:type': identity.startsWith('/guide/') ? 'article' : 'website',
            'og:locale': graphLocales[locale]
        }).filter(([key]) => !tags.some(tag => tag.property === key))
            .map(([key, value]) => `<meta property="${key}" content="${attribute(value)}">`).join('')
        published.set(pathname, { file, href, prefix, identity, title, markdown, graph })
    }

    for (const page of published.values()) {
        const links = [
            `<link rel="describedby" href="${attribute(origin + page.prefix)}/llms.txt">`,
            page.markdown ? `<link rel="alternate" type="text/markdown" href="${attribute(page.href)}.md">` : ''
        ].join('')
        const extra = `<!--master-css-seo-->${page.graph}${links}${breadcrumbs(page, published)}<!--/master-css-seo-->`
        const html = await readFile(page.file, 'utf8')
        const updated = html.replace(generatedTags, '').replace(/<\/head>/i, () => extra + '</head>')
        if (updated !== html) await writeFile(page.file, updated, 'utf8')
    }
    await writeFile(path.join(outDir, 'sitemap.xml'), renderSitemap(groups), 'utf8')
    await writeFile(path.join(outDir, 'robots.txt'), `Sitemap: ${origin}/sitemap.xml\n`, 'utf8')
}

/** Pages expands one splat per rule, including nested Guide and Reference paths. */
export function markdownCanonicalHeaders(origin: string) {
    return locales.flatMap(locale => {
        const prefix = locale === defaultLocale ? '' : '/' + locale
        return ['/guide', '/guide/*', '/reference', '/reference/*', '/benchmarks'].flatMap(route => [
            `${prefix}${route}.md`,
            `  Link: <${origin}${prefix}${route.replace('*', ':splat')}>; rel="canonical"`
        ])
    })
}
