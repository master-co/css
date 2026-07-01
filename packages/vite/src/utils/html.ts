function splitPathSegments(path: string) {
    return path.split('/').filter(Boolean)
}

function getHTMLDirectorySegments(path = '/index.html') {
    const cleanPath = path.split(/[?#]/)[0] || '/index.html'
    const segments = splitPathSegments(cleanPath)
    if (!cleanPath.endsWith('/')) segments.pop()
    return segments
}

function toRelativeAssetHref(fileName: string, htmlPath?: string) {
    const fromSegments = getHTMLDirectorySegments(htmlPath)
    const toSegments = splitPathSegments(fileName)
    let common = 0
    while (
        common < fromSegments.length
        && common < toSegments.length
        && fromSegments[common] === toSegments[common]
    ) {
        common += 1
    }
    return [
        ...Array.from({ length: fromSegments.length - common }, () => '..'),
        ...toSegments.slice(common)
    ].join('/') || '.'
}

export function escapeRegExp(source: string) {
    return source.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export function toAssetHref(fileName: string, base = '/', htmlPath?: string) {
    const normalizedFileName = fileName.replace(/^\/+/, '')
    if (base && base !== './') {
        return `${base.replace(/\/?$/, '/')}${normalizedFileName}`
    }
    return toRelativeAssetHref(normalizedFileName, htmlPath)
}

export function hasModulePreloadLink(html: string, href: string, options?: { as?: string }) {
    const quotedHref = escapeRegExp(href)
    const asPattern = options?.as
        ? String.raw`(?=[^>]*\bas=(?:"${escapeRegExp(options.as)}"|'${escapeRegExp(options.as)}'))`
        : ''
    return new RegExp(
        String.raw`<link\b(?=[^>]*\brel=(?:"modulepreload"|'modulepreload'))${asPattern}(?=[^>]*\bhref=(?:"${quotedHref}"|'${quotedHref}'))[^>]*>`,
        'i'
    ).test(html)
}
