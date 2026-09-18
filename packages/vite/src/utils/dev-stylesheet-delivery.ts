import { createHash, randomUUID } from 'node:crypto'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { basename, join } from 'node:path'
import { tmpdir } from 'node:os'
import { createCompilerSync } from '@master/css-compiler/node'
import type { MasterCSSStylesheetComposition, MasterCSSStylesheetDeliveryOptions } from '@master/css-compiler/stylesheet'
import type { MasterCSSVitePluginContext } from '../core'
import { toAssetHref } from './html'

const states = new WeakMap<MasterCSSVitePluginContext, DevStylesheetState>()
interface DevStylesheetState {
  origin: string
  prefix: string
  stylesheets: Map<string, string>
  resources: Map<string, { file: string, source: string }>
  resourceDir?: string
}
function digest(source: string | Uint8Array) { return createHash('sha256').update(source).digest('hex').slice(0, 20) }
export function devStylesheetState(context: MasterCSSVitePluginContext) {
  let state = states.get(context)
  if (!state) {
    const token = randomUUID()
    state = { origin: `https://master-css-dev-${token}.invalid`, prefix: toAssetHref(`_master-css/dev/${token}/`, context.config?.base), stylesheets: new Map(), resources: new Map() }
    states.set(context, state)
  }
  return state
}
export function clearDevStylesheets(context: MasterCSSVitePluginContext) {
  const directory = states.get(context)?.resourceDir
  if (directory) rmSync(directory, { recursive: true, force: true })
  states.delete(context)
}

/** Give Vite external URLs while its CSS pipeline runs; the post hook makes them same-origin. */
export function getDevStylesheetDelivery(context: MasterCSSVitePluginContext): MasterCSSStylesheetDeliveryOptions | undefined {
  if (context.config?.command !== 'serve') return
  const state = devStylesheetState(context), base = state.origin + state.prefix
  return {
    entryURL: base + 'entry.css',
    stylesheetURL: (file, variant) => base + `source-${digest(variant ?? file)}.css`,
    resourceURL: source => {
      const content = readFileSync(source)
      const href = base + `resource/${digest(source + '\0' + digest(content))}/${encodeURIComponent(basename(source))}`
      const key = new URL(href).pathname
      if (!state.resources.has(key)) {
        state.resourceDir ??= mkdtempSync(join(tmpdir(), 'master-css-vite-resources-'))
        // Name and publish the same bytes, even if the source changes while the
        // graph is being compiled. Safe filenames retain Vite's static delivery.
        const file = join(state.resourceDir, digest(href) + '-' + basename(source).replace(/[^a-zA-Z0-9._-]/g, '_'))
        writeFileSync(file, content)
        state.resources.set(key, { file, source })
      }
      return href
    },
    resolveNodePackageImports: true
  }
}

export function publishDevStylesheets(context: MasterCSSVitePluginContext, result: MasterCSSStylesheetComposition, slotCSSRule: string): string {
  const delivery = getDevStylesheetDelivery(context)!
  const state = devStylesheetState(context)
  using compiler = createCompilerSync()
  const bundle = compiler.prepareStylesheetBundle({
    source: slotCSSRule, from: 'master-css-dev', slotCSSRule,
    managed: { entry: 'master-css-managed', stylesheets: [{ id: 'master-css-managed', href: delivery.entryURL, css: result.css }, ...(result.stylesheets ?? [])] }
  })
  const version = digest(JSON.stringify(bundle))
  const urls = Object.fromEntries(bundle.graph.stylesheets.map(node => [node.id, state.origin + state.prefix + `sheet-${digest(node.id)}-${version}.css`]))
  const assets = compiler.renderStylesheetBundle({ bundle, urls, inlineImports: true })
  // Previously returned inline strings and in-flight imports keep their versions
  // until this context closes; a new composition must not overwrite those URLs.
  for (const asset of assets) state.stylesheets.set(new URL(asset.href).pathname, asset.css.replaceAll(state.origin, ''))
  const root = assets.find(asset => asset.id === bundle.graph.entry)
  if (!root) throw new Error('Development stylesheet graph is missing its entry')
  return root.css
}
