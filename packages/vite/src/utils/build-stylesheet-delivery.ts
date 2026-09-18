import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { extname } from 'node:path'
import type { MasterCSSStylesheetComposition, MasterCSSStylesheetDeliveryOptions } from '@master/css-compiler/stylesheet'
import type { MasterCSSCompiler } from '@master/css-compiler'
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
  const hash = digest(JSON.stringify(bundle))
  // All fragments stay beside Vite's original CSS asset. This preserves its
  // already rewritten relative URLs for any base and asset filename directory.
  const urls = Object.fromEntries(bundle.graph.stylesheets.map((node, index) => [node.id, `./master-css-${hash}-${index}.css`]))
  const assets = compiler.renderStylesheetBundle({ bundle, urls, preserveResourceBase: true })
  return { source: `@import "${urls[bundle.graph.entry]}";`, assets, resources: extracted.resources }
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
  const hash = digest(JSON.stringify(bundle))
  const urls = Object.fromEntries(bundle.graph.stylesheets.map((node, index) => [node.id, `./master-css-${hash}-${index}.css`]))
  const assets = compiler.renderStylesheetBundle({ bundle, urls, preserveResourceBase: true })
  return { source: `@import "${urls[bundle.graph.entry]}";`, assets, resources: [...resources.values()] }
}
