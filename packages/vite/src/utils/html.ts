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

/**
 * The URL an HTML page loads a built file from, as Vite writes its own tags:
 * `experimental.renderBuiltUrl` can move assets to a CDN, otherwise `base` applies.
 */
export function toBuiltAssetHref(config: { base?: string, experimental?: { renderBuiltUrl?: (filename: string, type: { hostId: string, hostType: 'js' | 'css' | 'html', type: 'asset' | 'public', ssr: boolean }) => string | { relative?: boolean, runtime?: string } | undefined } } | undefined, fileName: string, htmlPath?: string) {
  const rendered = config?.experimental?.renderBuiltUrl?.(fileName.replace(/^\/+/, ''), { hostId: htmlPath ?? '', hostType: 'html', type: 'asset', ssr: false })
  if (typeof rendered === 'string' && rendered) return rendered
  if (rendered && typeof rendered === 'object' && rendered.relative) return toRelativeAssetHref(fileName.replace(/^\/+/, ''), htmlPath)
  return toAssetHref(fileName, config?.base, htmlPath)
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

/** A `<link rel="preload" as="fetch">` without a type, as runtime programs use. */
export function hasFetchPreloadLink(html: string, href: string) {
  const quotedHref = escapeRegExp(href)
  return new RegExp(
    String.raw`<link\b(?=[^>]*\brel=(?:"preload"|'preload'))(?=[^>]*\bas=(?:"fetch"|'fetch'))(?=[^>]*\bhref=(?:"${quotedHref}"|'${quotedHref}'))[^>]*>`,
    'i'
  ).test(html)
}
