import { Element, Text, type ChildNode } from 'domhandler'
import type { MasterCSSRuntimeStylesheetAsset } from '@master/css-schema/runtime-style'
import type parseHTML from './parse-html'

/** A compiler-prepared, final CSS asset supplied by the delivering adapter. */
export interface MasterCSSServerStylesheet {
  readonly href: string
  readonly asset: MasterCSSRuntimeStylesheetAsset
}

const fallbackOrigin = 'https://master-css-render.invalid'
const encodeCSSURL = (url: string) => url.replace(/[()'"\\\s]/g, character => encodeURIComponent(character).replace(/[()']/g, c => '%' + c.charCodeAt(0).toString(16)))

export function prepareNativeStylesheets(
  document: ReturnType<typeof parseHTML>,
  stylesheets: readonly MasterCSSServerStylesheet[] = [],
  documentURL = fallbackOrigin + '/',
  publishImport?: (css: string, source: string) => string
) {
  const assets = new Map(stylesheets.map(stylesheet => [new URL(stylesheet.href, documentURL).href, stylesheet.asset]))
  const sources: string[] = []
  const indexes = new Map<string, number>()
  const nativeStyles = document.nativeStyleElements.filter(style => !style.attribs['data-master-css-stylesheet']
    || !assets.has(new URL(style.attribs['data-master-css-stylesheet'], documentURL).href))
  for (const style of nativeStyles) sources.push(style.childNodes.map(node => 'data' in node ? node.data : '').join(''))
  const collect = (href: string) => {
    if (indexes.has(href)) return
    const asset = assets.get(href)
    if (!asset) return
    if (asset.version !== 1) throw new TypeError('Unsupported Master CSS stylesheet asset. Recompile the stylesheet.')
    indexes.set(href, sources.length)
    let css = asset.css
    for (const reference of asset.urls) {
      if (reference.stylesheet) continue
      const target = new URL(reference.url, href)
      const url = target.origin === fallbackOrigin ? target.pathname + target.search + target.hash : target.href
      css = css.replaceAll(reference.placeholder, encodeCSSURL(url))
    }
    sources.push(css)
    for (const reference of asset.urls) if (reference.stylesheet) collect(new URL(reference.url, href).href)
  }
  const roots: { link: Element, nodes: ChildNode[], href: string, existing?: Element }[] = []
  const visit = (nodes: ChildNode[]) => {
    for (const node of nodes) {
      if (node instanceof Element && node.name === 'link' && node.attribs.rel === 'stylesheet' && node.attribs.href) {
        const href = new URL(node.attribs.href, documentURL).href
        const previous = nodes[nodes.indexOf(node) - 1]
        const existing = previous instanceof Element && previous.name === 'style'
          && previous.attribs['data-master-css-stylesheet'] === node.attribs.href ? previous : undefined
        if (assets.has(href) && (node.attribs.disabled === undefined || existing)) {
          collect(href); roots.push({ link: node, nodes, href, existing })
        }
      }
      if ('childNodes' in node) visit(node.childNodes)
    }
  }
  visit(document.nodes)
  return {
    sources,
    apply(rendered: readonly string[], escapeStyle: (css: string) => string) {
      let changed = false
      for (const [index, style] of nativeStyles.entries()) {
        const text = escapeStyle(rendered[index] ?? sources[index])
        if (style.childNodes.map(node => 'data' in node ? node.data : '').join('') === text) continue
        style.childNodes = [new Text(text)]
        changed = true
      }
      const content = (href: string, ancestors: readonly string[] = []): string => {
        if (ancestors.includes(href)) return ''
        const asset = assets.get(href)!
        let css = rendered[indexes.get(href)!] ?? asset.css
        for (const reference of asset.urls) {
          const target = new URL(reference.url, href)
          let url = target.origin === fallbackOrigin ? target.pathname + target.search + target.hash : target.href
          if (reference.stylesheet && assets.has(target.href)) {
            if (!publishImport) throw new TypeError('SSR stylesheet imports require stylesheetImportSource to publish their rendered CSS at a same-origin URL.')
            url = publishImport(content(target.href, [...ancestors, href]), target.href)
          }
          url = encodeCSSURL(url)
          css = css.replaceAll(reference.placeholder, url)
        }
        return css
      }
      for (const { link, nodes, href, existing } of roots) {
        const attributes: Record<string, string> = { 'data-master-css-stylesheet': link.attribs.href }
        for (const name of ['media', 'title', 'nonce']) if (link.attribs[name] !== undefined) attributes[name] = link.attribs[name]
        const style = new Element('style', attributes, [new Text(escapeStyle(content(href)))])
        if (existing) nodes.splice(nodes.indexOf(existing), 1, style)
        else nodes.splice(nodes.indexOf(link), 0, style)
        link.attribs.disabled = ''
        changed = true
      }
      return changed
    }
  }
}
