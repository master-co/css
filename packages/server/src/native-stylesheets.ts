import type parseHTML from './parse-html'

/** A final stylesheet a rendered page may link. */
export interface MasterCSSServerStylesheet {
  readonly href: string
  readonly css: string
  /** Hrefs of the stylesheets it imports, in order, relative to `href`. */
  readonly imports?: readonly string[]
}

const fallbackOrigin = 'https://master-css-render.invalid'

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
      if ('attribs' in node && node.name === 'link' && node.attribs.rel === 'stylesheet' && node.attribs.href
        && node.attribs.disabled === undefined) {
        // An unparsable href links nothing, and must not fail the whole render.
        const href = URL.parse(node.attribs.href, documentURL)?.href
        if (href) collect(href)
      }
      if ('childNodes' in node) visit(node.childNodes)
    }
  }
  visit(document.nodes)
  return sources
}
