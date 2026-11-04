import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { extname } from 'node:path'
import { createCompilerSync } from '@master/css-compiler/node'
import type { MasterCSSStylesheetComposition, MasterCSSStylesheetDeliveryOptions } from '@master/css-compiler/stylesheet'
import type { MasterCSSCompiler, MasterCSSStylesheetAsset } from '@master/css-compiler'

function digest(source: string | Uint8Array) {
  return createHash('sha256').update(source).digest('hex').slice(0, 20)
}

export function getBuildStylesheetDelivery(resourceContents?: Map<string, Buffer>): MasterCSSStylesheetDeliveryOptions {
  return {
    entryURL: './master-css-entry.css',
    stylesheetURL: (file, variant) => `./master-css-source-${digest(variant ?? file)}.css`,
    resourceURL: file => {
      let contents = resourceContents?.get(file)
      if (!contents) {
        contents = readFileSync(file)
        resourceContents?.set(file, contents)
      }
      return `./master-css-resource-${digest(contents)}${extname(file)}`
    },
    relativeResourceURLs: true,
    resolveNodePackageImports: true
  }
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
 * Compose each registered source at its own host slot, preserving chunk ownership,
 * then flatten the complete graph into the host CSS asset.
 */
export function prepareBuildStylesheets(source: string, replacements: readonly { slot: string, result: MasterCSSStylesheetComposition }[]) {
  using compiler = createCompilerSync()
  const entry = './master-css-host.css'
  const graph = new Map([[entry, { id: entry, href: entry, css: source }]])
  const resources = new Map<string, NonNullable<MasterCSSStylesheetComposition['resources']>[number]>()
  let replaced = false
  for (const [replacementIndex, { slot, result }] of replacements.entries()) {
    for (const [assetIndex, asset] of [...graph.values()].entries()) {
      const bundle = compiler.prepareStylesheetBundle({
        source: asset.css, from: asset.id, slotCSSRule: slot,
        managed: { entry: 'managed', stylesheets: [{ id: 'managed', href: './master-css-entry.css', css: result.css }, ...(result.stylesheets ?? [])] }
      })
      if (!bundle.slots) continue
      replaced = true
      const urls = Object.fromEntries(bundle.graph.stylesheets.map((node, index) => [node.id,
        node.id === bundle.graph.entry ? asset.href : `./master-css-intermediate-${replacementIndex}-${assetIndex}-${index}.css`]))
      for (const next of compiler.renderStylesheetBundle({ bundle, urls, preserveResourceBase: true })) {
        graph.set(next.href, { id: next.href, href: next.href, css: next.css })
      }
      for (const resource of result.resources ?? []) resources.set(resource.href, resource)
    }
  }
  if (!replaced) return
  const slot = '#master-css-complete-graph{--slot:0}'
  const bundle = compiler.prepareStylesheetBundle({ source: slot, from: 'master-css-webpack-bundle', slotCSSRule: slot,
    managed: { entry, stylesheets: [...graph.values()] } })
  const hash = digest(JSON.stringify(bundle))
  const urls = Object.fromEntries(bundle.graph.stylesheets.map((node, index) => [node.id, `./master-css-${hash}-${index}.css`]))
  // Rust inlines a fragment only where cascade order, conditions, layers and
  // namespace scope survive; external imports and namespaces keep boundaries.
  const assets = retainedStylesheetAssets(compiler, compiler.renderStylesheetBundle({ bundle, urls, preserveResourceBase: true, inlineImports: true }), bundle.graph.entry)
  const host = assets.find(asset => asset.id === bundle.graph.entry)!
  return { source: host.css, assets: assets.filter(asset => asset !== host), resources: [...resources.values()] }
}
