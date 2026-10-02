import { createHash } from 'node:crypto'
import type { MasterCSSRuntimeStylesheetAsset } from '@master/css-schema/runtime-style'
import type { MasterCSSCompiler } from '../compiler'

/** Describe final adapter CSS without reparsing or rewriting CSS in the browser. */
export function createRuntimeStylesheetAsset(compiler: MasterCSSCompiler, css: string, href = '/runtime-stylesheet.css', stylesheetURLs: readonly string[] = []): MasterCSSRuntimeStylesheetAsset {
  const bundle = compiler.prepareStylesheetBundle({
    source: css, from: 'runtime-stylesheet', slotCSSRule: '#master-css-unused-delivery-slot{--slot:0}',
    managed: { entry: 'empty', stylesheets: [{ id: 'empty', href: '/empty.css', css: '' }] }
  })
  const base = new URL(href, 'https://master-css-delivery.invalid/')
  const owned = new Set(stylesheetURLs.map(url => new URL(url, 'https://master-css-delivery.invalid/').href))
  const imports = new Set(bundle.sources.flatMap(source => source.imports.map(reference => reference.url)).filter(url => owned.has(new URL(url, base).href)))
  const identity = createHash('sha256').update(css).digest('hex').slice(0, 16)
  const urls = [...new Set(bundle.sources.flatMap(source => [...source.resources, ...source.imports].map(reference => reference.url)))]
    .map((url, index) => ({ url, stylesheet: imports.has(url), placeholder: `https://master-css-url-${identity}.invalid/${index}/value` }))
  const [asset] = compiler.renderStylesheetBundle({
    bundle,
    urls: { 'runtime-stylesheet': '/runtime-stylesheet.css' },
    resourceURLs: Object.fromEntries(urls.map(({ url, placeholder }) => [url, placeholder]))
  })
  return { version: 1, css: asset.css, urls }
}
