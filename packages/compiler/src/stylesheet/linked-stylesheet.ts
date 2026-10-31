import { analyzeCSSDependencies } from '../node-compiler'

/** A final stylesheet a server-rendered page may link, as `@master/css-server` reads it. */
export interface MasterCSSLinkedStylesheet {
  readonly href: string
  readonly css: string
  /** Import specifiers of the listed stylesheets it imports, in order, relative to `href`. */
  readonly imports: readonly string[]
}

/** Describes final adapter CSS and which of `stylesheetURLs` it imports. */
export function describeLinkedStylesheet(css: string, href: string, stylesheetURLs: readonly string[] = []): MasterCSSLinkedStylesheet {
  const base = new URL(href, 'https://master-css-delivery.invalid/')
  const listed = new Set(stylesheetURLs.map(url => new URL(url, base).href))
  const imports = analyzeCSSDependencies(css).imports
    .map(imported => imported.source)
    .filter(specifier => listed.has(new URL(specifier, base).href))
  return { href, css, imports }
}
