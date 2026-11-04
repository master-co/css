import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { extname } from 'node:path'
import type { MasterCSSStylesheetComposition, MasterCSSStylesheetDeliveryOptions } from '@master/css-compiler/stylesheet'
import type { MasterCSSCompiler, MasterCSSStylesheetAsset, MasterCSSStylesheetBundle } from '@master/css-compiler'
import type { MasterCSSVitePluginContext } from '../core'
import type { LocalStylesheet } from './local-stylesheet'

function digest(source: string | Uint8Array) {
  return createHash('sha256').update(source).digest('hex').slice(0, 20)
}

/** These temporary graph URLs are replaced after the full CSS content is known. */
export function getBuildStylesheetDelivery(context: MasterCSSVitePluginContext): MasterCSSStylesheetDeliveryOptions | undefined {
  if (context.config?.command !== 'build') return
  return {
    entryURL: './master-css-entry.css',
    stylesheetURL: (file, variant) => `./master-css-source-${digest(variant ?? file)}.css`,
    resourceURL: file => `./master-css-resource-${digest(readFileSync(file))}${extname(file)}`,
    relativeResourceURLs: true,
    resolveNodePackageImports: true
  }
}

export function prepareBuildStylesheet(
  compiler: MasterCSSCompiler,
  source: string,
  slotCSSRule: string,
  extracted: MasterCSSStylesheetComposition,
  locals: readonly LocalStylesheet[] = []
) {
  if (locals.length) return prepareLocalBuildStylesheets(compiler, source, slotCSSRule, extracted, locals)
  const managed = {
    entry: 'master-css-managed',
    stylesheets: [{ id: 'master-css-managed', href: './master-css-entry.css', css: extracted.css }, ...(extracted.stylesheets ?? [])]
  }
  const bundle = compiler.prepareStylesheetBundle({ source, from: 'master-css-bundle', slotCSSRule, managed })
  if (!bundle.slots) return
  return { ...renderBuildStylesheetBundle(compiler, bundle), resources: extracted.resources }
}

/** Rust reconnects retained imports to their compiler-issued hrefs; keep what the entry still reaches. */
function retainedStylesheetAssets(compiler: MasterCSSCompiler, assets: readonly MasterCSSStylesheetAsset[], entry: string) {
  const slotCSSRule = '#master-css-retained-assets{--slot:0}'
  const { graph } = compiler.prepareStylesheetBundle({ source: slotCSSRule, from: 'master-css-retained-assets', slotCSSRule, managed: { entry, stylesheets: assets } })
  const imports = new Map(graph.stylesheets.map(node => [node.id, node.imports]))
  const retained = new Set([entry])
  for (const id of retained) for (const edge of imports.get(id) ?? []) if (edge.resolved) retained.add(edge.resolved)
  return assets.filter(asset => retained.has(asset.id))
}

/**
 * Flatten the graph into Vite's CSS asset and name any retained fragments after
 * their rendered bytes. Graph node IDs and temporary delivery URLs derive from
 * host file paths, so hashing the prepared bundle would vary with the checkout location.
 */
function renderBuildStylesheetBundle(compiler: MasterCSSCompiler, bundle: MasterCSSStylesheetBundle) {
  const render = (url: (index: number) => string) => {
    // All fragments stay beside Vite's original CSS asset. This preserves its
    // already rewritten relative URLs for any base and asset filename directory.
    const urls = Object.fromEntries(bundle.graph.stylesheets.map((node, index) => [node.id, url(index)]))
    // Rust inlines a fragment only where cascade order, conditions, layers and
    // namespace scope survive; external imports and namespaces keep boundaries.
    const assets = compiler.renderStylesheetBundle({ bundle, urls, preserveResourceBase: true, inlineImports: true })
    return retainedStylesheetAssets(compiler, assets, bundle.graph.entry)
  }
  const hash = digest(JSON.stringify(render(index => `./master-css-${index}.css`).map(asset => asset.css)))
  const assets = render(index => `./master-css-${hash}-${index}.css`)
  const entry = assets.find(asset => asset.id === bundle.graph.entry)!
  return { source: entry.css, assets: assets.filter(asset => asset !== entry) }
}

/** Compose each local entry at its own position before final content-based naming. */
function prepareLocalBuildStylesheets(compiler: MasterCSSCompiler, source: string, slotCSSRule: string, extracted: MasterCSSStylesheetComposition, locals: readonly LocalStylesheet[]) {
  const entry = './master-css-host.css'
  const graph = new Map([[entry, { id: entry, href: entry, css: source }]])
  const resources = new Map<string, NonNullable<MasterCSSStylesheetComposition['resources']>[number]>()
  const replacements = [
    { slot: slotCSSRule, css: extracted.css, stylesheets: extracted.stylesheets, resources: extracted.resources },
    ...[...locals].sort((a, b) => a.slot < b.slot ? -1 : a.slot > b.slot ? 1 : 0)
      .map(({ slot, result }) => ({ slot, css: result.code, stylesheets: result.stylesheets, resources: result.resources }))
  ]
  let replaced = false
  for (const [replacementIndex, replacement] of replacements.entries()) {
    for (const [assetIndex, asset] of [...graph.values()].entries()) {
      const bundle = compiler.prepareStylesheetBundle({
        source: asset.css, from: asset.id, slotCSSRule: replacement.slot,
        managed: { entry: 'managed', stylesheets: [{ id: 'managed', href: './master-css-entry.css', css: replacement.css }, ...(replacement.stylesheets ?? [])] }
      })
      if (!bundle.slots) continue
      replaced = true
      const urls = Object.fromEntries(bundle.graph.stylesheets.map((node, index) => [node.id, node.id === bundle.graph.entry ? asset.href : `./master-css-intermediate-${replacementIndex}-${assetIndex}-${index}.css`]))
      const assets = compiler.renderStylesheetBundle({ bundle, urls, preserveResourceBase: true })
      for (const next of assets) graph.set(next.href, { id: next.href, href: next.href, css: next.css })
      for (const resource of replacement.resources ?? []) resources.set(resource.href, resource)
    }
  }
  if (!replaced) return
  const slot = '#master-css-complete-local-graph{--slot:0}'
  const bundle = compiler.prepareStylesheetBundle({ source: slot, from: 'master-css-output', slotCSSRule: slot, managed: { entry, stylesheets: [...graph.values()] } })
  return { ...renderBuildStylesheetBundle(compiler, bundle), resources: [...resources.values()] }
}
