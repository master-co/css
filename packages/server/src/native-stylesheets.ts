import type parseHTML from './parse-html'
import decodeHTML from './decode-html'

/** A final stylesheet a rendered page may link. */
export interface MasterCSSServerStylesheet {
  readonly href: string
  readonly css: string
  /** Hrefs of the stylesheets it imports, in order, relative to `href`. */
  readonly imports?: readonly string[]
}

const fallbackOrigin = 'https://master-css-render.invalid'

const tokens = (value: string) => value.toLowerCase().split(/[\t\n\f\r ]+/).filter(Boolean)

/**
 * Whether an element's styles apply to every medium: a `media` of `all` or none. Globals of a
 * print-only or width-limited sheet are not delivered to the others, so they are generated again.
 */
export function appliesToAllMedia(media: string | undefined) {
  if (media === undefined) return true
  const query = decodeHTML(media).trim().toLowerCase()
  return query === '' || query === 'all'
}

/** A `rel` naming `stylesheet` (ASCII case-insensitive, among other tokens), not an alternate one. */
function isPersistentStylesheet(rel: string | undefined) {
  const values = rel === undefined ? [] : tokens(decodeHTML(rel))
  return values.includes('stylesheet') && !values.includes('alternate')
}

/**
 * The CSS a page delivers natively, in document order: its inline styles, then each
 * linked stylesheet followed by the ones it imports. Theme variables these declare
 * are not generated again.
 */
export function collectNativeStylesheets(
  document: ReturnType<typeof parseHTML>,
  stylesheets: readonly MasterCSSServerStylesheet[] = [],
  documentURL = fallbackOrigin + '/'
) {
  const byHref = new Map(stylesheets.map(stylesheet => [new URL(stylesheet.href, documentURL).href, stylesheet]))
  const sources = document.nativeStyleElements.map(style => style.childNodes.map(node => 'data' in node ? node.data : '').join(''))
  const visited = new Set<string>()
  const collect = (href: string) => {
    const stylesheet = byHref.get(href)
    if (!stylesheet || visited.has(href)) return
    visited.add(href)
    sources.push(stylesheet.css)
    for (const imported of stylesheet.imports ?? []) collect(new URL(imported, href).href)
  }
  const visit = (nodes: typeof document.nodes) => {
    for (const node of nodes) {
      if ('attribs' in node && node.name === 'link' && isPersistentStylesheet(node.attribs.rel) && node.attribs.href
        && node.attribs.disabled === undefined && appliesToAllMedia(node.attribs.media)) {
        // An unparsable href links nothing, and must not fail the whole render.
        const href = URL.parse(decodeHTML(node.attribs.href).trim(), documentURL)?.href
        if (href) collect(href)
      }
      if ('childNodes' in node) visit(node.childNodes)
    }
  }
  visit(document.nodes)
  return sources
}
