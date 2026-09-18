import { createHash } from 'node:crypto'
import type { ResolvedConfig } from 'vite'
import { createStylesheetCollection, type MasterCSSStylesheetCollection, type MasterCSSStylesheetDeliveryOptions, type MasterCSSStylesheetTransformResult } from '@master/css-compiler/stylesheet'
import type { MasterCSSVitePluginContext } from '../core'
import { getBuildStylesheetDelivery } from './build-stylesheet-delivery'
import { getSassSourceFile } from './build-sass-source'
import { getScanner } from './scanner-context'

export interface InlineStylesheet {
  collection: MasterCSSStylesheetCollection
  local?: MasterCSSStylesheetTransformResult
  token: string
  reference?: string
  css?: string
  urlMarker?: string
  files?: Map<string, string>
}
const states = new WeakMap<MasterCSSVitePluginContext, Map<string, InlineStylesheet>>()
export const INLINE_URL_BASE = 'https://master-css-inline.invalid/'
export function inlineDigest(value: string) { return createHash('sha256').update(value).digest('hex').slice(0, 20) }
export function isInlineStylesheet(id: string) { return /[?&]inline(?:[=&]|$)/.test(id) }
export function inlineStylesheets(context: MasterCSSVitePluginContext) {
  let state = states.get(context)
  if (!state) { state = new Map(); states.set(context, state) }
  return state
}
export function disposeInlineStylesheets(context: MasterCSSVitePluginContext) {
  for (const entry of inlineStylesheets(context).values()) entry.collection.dispose()
  states.delete(context)
}
export function inlineDelivery(context: MasterCSSVitePluginContext): MasterCSSStylesheetDeliveryOptions {
  const delivery = getBuildStylesheetDelivery(context)!
  return {
    ...delivery,
    entryURL: INLINE_URL_BASE + 'entry.css',
    stylesheetURL: (file, variant) => INLINE_URL_BASE + delivery.stylesheetURL(file, variant).slice(2),
    resourceURL: file => INLINE_URL_BASE + delivery.resourceURL(file).slice(2),
    relativeResourceURLs: false
  }
}
export async function registerInlineStylesheet(context: MasterCSSVitePluginContext, id: string, source: string, host: Pick<MasterCSSStylesheetDeliveryOptions, 'resolveImport' | 'onDependency'>) {
  const entries = inlineStylesheets(context)
  let entry = entries.get(id)
  if (!entry) {
    entry = { collection: createStylesheetCollection(), token: `__MASTER_CSS_INLINE_${inlineDigest(id)}__` }
    entries.set(id, entry)
  }
  return entry.collection.register(getScanner(context), id, source, {
    baseManifest: getScanner(context).css.manifest,
    projectDir: context.config?.root,
    delivery: { ...inlineDelivery(context), ...host, baseFile: getSassSourceFile(id) }
  })
}

export function registerLocalInlineStylesheet(context: MasterCSSVitePluginContext, id: string, local: MasterCSSStylesheetTransformResult) {
  const entries = inlineStylesheets(context)
  const entry = entries.get(id) ?? { collection: createStylesheetCollection(), token: `__MASTER_CSS_INLINE_${inlineDigest(id)}__` }
  entry.local = local
  entries.set(id, entry)
}

/** Return resource/import references using the compiler's source analysis. */
export function inlineURLReferences(compiler: import('@master/css-compiler').MasterCSSCompiler, css: string) {
  const bundle = compiler.prepareStylesheetBundle({
    source: css, from: 'inline-url-source', slotCSSRule: `#master-css-url-scan-${inlineDigest(css)}{--slot:0}`,
    managed: { entry: 'empty', stylesheets: [{ id: 'empty', href: '/empty.css', css: '' }] }
  })
  return bundle.sources.flatMap(source => [...source.resources, ...source.imports])
}

/** Rewrite host-issued URLs only at Rust-reported resource/import ranges. */
export function rewriteInlineURLs(compiler: import('@master/css-compiler').MasterCSSCompiler, css: string, target: (url: string) => string, ownedURLs: ReadonlySet<string>) {
  const bundle = compiler.prepareStylesheetBundle({ source: css, from: 'inline-url-source', slotCSSRule: `#master-css-url-scan-${inlineDigest(css)}{--slot:0}`, managed: { entry: 'empty', stylesheets: [{ id: 'empty', href: '/empty.css', css: '' }] } })
  const references = bundle.sources.flatMap(source => [...source.resources, ...source.imports])
  if (!references.some(reference => ownedURLs.has(reference.url.split(/[?#]/)[0]))) return css
  const mappings = new Map(references.map(reference => [reference.url, ownedURLs.has(reference.url.split(/[?#]/)[0]) ? encodeURI(target(reference.url)).replaceAll('%25', '%') : reference.url]))
  // The public relocation API accepts independent URLs. A unique temporary
  // prefix lets Rust serialize relative targets too, including CSS escaping.
  let prefix = `https://master-css-relocation.invalid/${inlineDigest(css)}/`
  while (css.includes(prefix) || [...mappings.values()].some(value => value.includes(prefix))) prefix += '_'
  const resourceURLs = Object.fromEntries([...mappings].map(([url, value]) => [url, prefix + value]))
  const urls = Object.fromEntries(bundle.graph.stylesheets.map(node => [node.id, '/inline-url-source.css']))
  const output = compiler.renderStylesheetBundle({ bundle, urls, resourceURLs }).find(asset => asset.id === bundle.graph.entry)!.css
  return output.replaceAll(prefix, '')
}

/** Apply Vite's public output URL hook to the actual referenced file. */
export function inlineBuiltURL(config: Pick<ResolvedConfig, 'base' | 'experimental'>, ssr: boolean, filename: string, hostId: string, hostType: 'js' | 'css'): { url: string } | { runtime: string } | { relative: true } {
  let relative = config.base === '' || config.base === './'
  const result = config.experimental.renderBuiltUrl?.(filename, { hostId, hostType, type: 'asset', ssr })
  if (typeof result === 'string' && result) return { url: result }
  if (result && typeof result === 'object') {
    if (result.runtime) {
      if (hostType === 'css') throw new Error('Vite renderBuiltUrl runtime expressions are not supported in CSS assets')
      return { runtime: result.runtime }
    }
    if (typeof result.relative === 'boolean') relative = result.relative
  }
  return relative && (hostType === 'css' || !ssr) ? { relative: true } : { url: config.base + filename }
}
