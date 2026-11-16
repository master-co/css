import { relative } from 'node:path'
import type { MasterCSSVitePluginContext } from '../core'

interface DuplicatedImportsState { owners: Map<string, Set<string>>, reported: Set<string> }
const states = new WeakMap<MasterCSSVitePluginContext, DuplicatedImportsState>()
export function clearDuplicatedImports(context: MasterCSSVitePluginContext) { states.delete(context) }

const file = (id: string) => id.replace(/^\0+/, '').replace(/[?#].*$/, '')

/**
 * CSS `@import` includes its target in every importer, so a stylesheet that two
 * local stylesheets import is delivered twice. Report each one once, as soon as
 * a second importer is known.
 */
export function reportDuplicatedImports(
  context: MasterCSSVitePluginContext,
  owner: string,
  stylesheets: readonly { readonly id: string, readonly css: string }[] | undefined,
  warn: (message: string) => void
) {
  if (!stylesheets?.length) return
  let state = states.get(context)
  if (!state) { state = { owners: new Map(), reported: new Set() }; states.set(context, state) }
  const root = context.config?.root ?? ''
  const name = (id: string) => relative(root, id) || id
  for (const { id, css } of stylesheets) {
    // Definition-only stylesheets leave no rules behind to duplicate.
    if (!css.includes('{')) continue
    const imported = file(id)
    let owners = state.owners.get(imported)
    if (!owners) state.owners.set(imported, owners = new Set())
    owners.add(file(owner))
    if (owners.size < 2 || state.reported.has(imported)) continue
    state.reported.add(imported)
    warn(`[master-css.vite] ${name(imported)} is delivered once in each stylesheet that @imports it: ${[...owners].map(name).join(', ')}. `
      + 'Import it from JavaScript, or from a single stylesheet, to deliver it once.')
  }
}
