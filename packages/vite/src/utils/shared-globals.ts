import { renderStylesheetGlobals } from '@master/css-compiler/stylesheet'
import { STYLE_ENTRY_COVERAGE_PLUGIN, type StyleEntryCoverageAPI, type StyleEntryGraphModule } from '@master/css-internal/style-module'
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
  revision: number
  rendered?: { covered?: Set<string>, revision: number, base: string, css: string, emittedGlobals: Required<MasterCSSEmittedGlobals> }
  /** What a development server's style entries last carried, to refresh them only when it changes. */
  delivered?: { base: Required<MasterCSSEmittedGlobals>, css: string }
}
const states = new WeakMap<MasterCSSVitePluginContext, SharedGlobalsState>()
function sharedGlobalsState(context: MasterCSSVitePluginContext) {
  let state = states.get(context)
  if (!state) { state = { sources: new Map(), entries: new Set(), revision: 0 }; states.set(context, state) }
  return state
}
export function clearSharedGlobals(context: MasterCSSVitePluginContext) { states.delete(context) }

/**
 * Only a build can prove that a style entry reaches every page a local
 * stylesheet is on: a development server learns its pages as they are visited.
 * Its local stylesheets keep their globals unless the project declares a global
 * style entry.
 */
export function mayShareGlobals(context: MasterCSSVitePluginContext) {
  return context.config?.command === 'build' || (context.config?.command === 'serve' && context.globalStyleEntry === true)
}

export function registerStyleEntryModule(context: MasterCSSVitePluginContext, id: string) { sharedGlobalsState(context).entries.add(id) }

/** Record the delivered CSS of a local stylesheet that left its globals out, or that it carries them; reports a change. */
export function registerSharedGlobals(context: MasterCSSVitePluginContext, id: string, manifest: MasterCSSManifest, css: readonly string[] | undefined) {
  const state = sharedGlobalsState(context)
  const previous = state.sources.get(id)
  if (state.manifest === manifest && (css ? previous?.length === css.length && css.every((source, index) => source === previous[index]) : !previous)) return false
  state.manifest = manifest
  if (css) state.sources.set(id, css)
  else state.sources.delete(id)
  state.revision++
  return true
}

/**
 * Settle, once the module graph is complete, which local stylesheets a style
 * entry covers. Loading a module loads everything it imports statically, so a
 * module with a style entry in its static imports always brings that entry's
 * stylesheet along. A local stylesheet is covered when every chain of static or
 * dynamic importers above it passes through such a module; one chain that
 * reaches a module nothing imports without meeting one leaves it uncovered.
 */
export function resolveSharedGlobalsCoverage(
  context: MasterCSSVitePluginContext,
  getModule: (id: string) => StyleEntryGraphModule | null,
  environment: string,
  input: unknown
) {
  const state = states.get(context)
  if (!state) return
  const covered = state.covered = new Set<string>()
  if (!state.entries.size || !state.sources.size) return
  // The project vouches for its entry: every local stylesheet relies on it.
  if (context.globalStyleEntry) {
    for (const id of state.sources.keys()) covered.add(id)
    return
  }
  const withEntry = new Set(state.entries)
  for (const id of withEntry) for (const importer of getModule(id)?.importers ?? []) withEntry.add(importer)
  const config = context.config
  // A single entry also proves which stylesheet the framework serves beside a route.
  if (config && state.entries.size === 1) {
    const provider = config.plugins.find(plugin => plugin.name === STYLE_ENTRY_COVERAGE_PLUGIN)
    const api = provider?.api as StyleEntryCoverageAPI | undefined
    for (const root of api?.coveredRoots?.({ config, environment, input, getModule, withEntry }) ?? []) withEntry.add(root)
  }
  for (const id of state.sources.keys()) {
    const seen = new Set([id]), pending = [id]
    let complete = !withEntry.has(id) && Boolean(getModule(id))
    while (pending.length && complete) {
      const module = getModule(pending.pop()!)
      const importers = [...module?.importers ?? [], ...module?.dynamicImporters ?? []]
      // A build input is independently reachable even when other modules import it.
      if (module?.isEntry || !importers.length) complete = false
      for (const importer of importers) if (!withEntry.has(importer) && !seen.has(importer)) { seen.add(importer); pending.push(importer) }
    }
    if (complete) covered.add(id)
  }
}

function render(state: SharedGlobalsState, sources: readonly string[], emittedGlobals?: MasterCSSEmittedGlobals) {
  return renderStylesheetGlobals({ manifest: state.manifest!, css: [...new Set(sources)], emittedGlobals })
}

/** The globals local stylesheets left to the style entries, beyond those `emittedGlobals` already carry. */
export function renderSharedGlobals(context: MasterCSSVitePluginContext, emittedGlobals: Required<MasterCSSEmittedGlobals>) {
  const state = states.get(context)
  if (!state?.manifest) return
  // A server with a global style entry shares every registered stylesheet as it arrives.
  const ids = context.config?.command === 'serve' ? (context.globalStyleEntry ? [...state.sources.keys()] : []) : [...state.covered ?? []]
  if (!ids.length) return
  const base = JSON.stringify(emittedGlobals)
  const rendered = state.rendered
  if (!rendered || rendered.covered !== state.covered || rendered.revision !== state.revision || rendered.base !== base) {
    state.rendered = { covered: state.covered, revision: state.revision, base, ...render(state, ids.flatMap(id => state.sources.get(id) ?? []), emittedGlobals) }
  }
  return state.rendered
}

export function markSharedGlobalsDelivered(context: MasterCSSVitePluginContext, base: Required<MasterCSSEmittedGlobals>, css: string) {
  sharedGlobalsState(context).delivered = { base, css }
}

export function sharedGlobalsStale(context: MasterCSSVitePluginContext) {
  const state = states.get(context)
  if (!state?.delivered) return false
  return (renderSharedGlobals(context, state.delivered.base)?.css ?? '') !== state.delivered.css
}

/** A local stylesheet that no style entry covers carries its own globals. */
export function renderLocalGlobals(context: MasterCSSVitePluginContext, id: string) {
  const state = states.get(context)
  const sources = state?.sources.get(id)
  if (!state?.manifest || !sources || state.covered?.has(id)) return
  return render(state, sources).css || undefined
}
