import { renderStylesheetGlobals } from '@master/css-compiler/stylesheet'
import type { MasterCSSEmittedGlobals } from '@master/css-schema/emitted-globals'
import type { MasterCSSManifest } from '@master/css-schema/manifest'
import type { MasterCSSVitePluginContext } from '../core'

interface SharedGlobalsState {
  manifest?: MasterCSSManifest
  /** Delivered CSS of each local stylesheet whose globals the project manifest alone renders. */
  sources: Map<string, readonly string[]>
  /** Modules that delivered a style entry in this build. */
  entries: Set<string>
  /** Local stylesheets that every page loading them also loads a style entry for. */
  covered?: Set<string>
  rendered?: { covered: Set<string>, base: string, css: string, emittedGlobals: Required<MasterCSSEmittedGlobals> }
}
const states = new WeakMap<MasterCSSVitePluginContext, SharedGlobalsState>()
function sharedGlobalsState(context: MasterCSSVitePluginContext) {
  let state = states.get(context)
  if (!state) { state = { sources: new Map(), entries: new Set() }; states.set(context, state) }
  return state
}
export function clearSharedGlobals(context: MasterCSSVitePluginContext) { states.delete(context) }

/**
 * Only a build can prove that a style entry reaches every page a local
 * stylesheet is on. A development server learns its pages as they are visited,
 * so its local stylesheets always keep their globals.
 */
export function mayShareGlobals(context: MasterCSSVitePluginContext) { return context.config?.command === 'build' }

export function registerStyleEntryModule(context: MasterCSSVitePluginContext, id: string) { sharedGlobalsState(context).entries.add(id) }

/** Record the delivered CSS of a local stylesheet that left its globals out, or that it carries them. */
export function registerSharedGlobals(context: MasterCSSVitePluginContext, id: string, manifest: MasterCSSManifest, css: readonly string[] | undefined) {
  const state = sharedGlobalsState(context)
  state.manifest = manifest
  if (css) state.sources.set(id, css)
  else state.sources.delete(id)
}

interface ModuleGraphNode { readonly importers: readonly string[], readonly dynamicImporters: readonly string[] }

/**
 * Settle, once the module graph is complete, which local stylesheets a style
 * entry covers. Loading a module loads everything it imports statically, so a
 * module with a style entry in its static imports always brings that entry's
 * stylesheet along. A local stylesheet is covered when every chain of static or
 * dynamic importers above it passes through such a module; one chain that
 * reaches a module nothing imports without meeting one leaves it uncovered.
 */
export function resolveSharedGlobalsCoverage(context: MasterCSSVitePluginContext, getModule: (id: string) => ModuleGraphNode | null | undefined) {
  const state = states.get(context)
  if (!state) return
  const covered = state.covered = new Set<string>()
  if (!state.entries.size || !state.sources.size) return
  const withEntry = new Set(state.entries)
  for (const id of withEntry) for (const importer of getModule(id)?.importers ?? []) withEntry.add(importer)
  for (const id of state.sources.keys()) {
    const seen = new Set([id]), pending = [id]
    let complete = !withEntry.has(id) && Boolean(getModule(id))
    while (pending.length && complete) {
      const module = getModule(pending.pop()!)
      const importers = [...module?.importers ?? [], ...module?.dynamicImporters ?? []]
      // Nothing imports this module: a page can start here without any entry.
      if (!importers.length) complete = false
      for (const importer of importers) if (!withEntry.has(importer) && !seen.has(importer)) { seen.add(importer); pending.push(importer) }
    }
    if (complete) covered.add(id)
  }
}

function render(state: SharedGlobalsState, sources: readonly string[], emittedGlobals?: MasterCSSEmittedGlobals) {
  return renderStylesheetGlobals({ manifest: state.manifest!, css: [...new Set(sources)], emittedGlobals })
}

/** The globals covered local stylesheets left to the style entries, beyond those `emittedGlobals` already carry. */
export function renderSharedGlobals(context: MasterCSSVitePluginContext, emittedGlobals: Required<MasterCSSEmittedGlobals>) {
  const state = states.get(context)
  if (!state?.manifest || !state.covered?.size) return
  const base = JSON.stringify(emittedGlobals)
  if (state.rendered?.covered !== state.covered || state.rendered.base !== base) {
    state.rendered = { covered: state.covered, base, ...render(state, [...state.covered].flatMap(id => state.sources.get(id) ?? []), emittedGlobals) }
  }
  return state.rendered
}

/** A local stylesheet that no style entry covers carries its own globals. */
export function renderLocalGlobals(context: MasterCSSVitePluginContext, id: string) {
  const state = states.get(context)
  const sources = state?.sources.get(id)
  if (!state?.manifest || !sources || state.covered?.has(id)) return
  return render(state, sources).css || undefined
}
