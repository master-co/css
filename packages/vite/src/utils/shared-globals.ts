import { renderStylesheetGlobals } from '@master/css-compiler/stylesheet'
import type { MasterCSSEmittedGlobals } from '@master/css-schema/emitted-globals'
import type { MasterCSSManifest } from '@master/css-schema/manifest'
import type { MasterCSSVitePluginContext } from '../core'

interface SharedGlobalsState {
  manifest?: MasterCSSManifest
  /** Delivered CSS of each local stylesheet whose globals the style entries emit. */
  sources: Map<string, readonly string[]>
  /** A development server settled without delivering a style entry: local stylesheets keep their globals. */
  entryMissing?: boolean
  revision: number
  rendered?: { revision: number, base: string, css: string, emittedGlobals: Required<MasterCSSEmittedGlobals> }
  delivered?: { base: Required<MasterCSSEmittedGlobals>, css: string }
}
const states = new WeakMap<MasterCSSVitePluginContext, SharedGlobalsState>()
function sharedGlobalsState(context: MasterCSSVitePluginContext) {
  let state = states.get(context)
  if (!state) { state = { sources: new Map(), revision: 0 }; states.set(context, state) }
  return state
}
export function clearSharedGlobals(context: MasterCSSVitePluginContext) { states.delete(context) }

/**
 * A style entry emits the globals of every local stylesheet once. A build knows
 * while rendering whether it delivered one. A development server expects one as
 * soon as the project declares an entry, because local stylesheets are often
 * transformed first, and falls back once it settles without any.
 */
export function sharesGlobalsWithStyleEntry(context: MasterCSSVitePluginContext) {
  return context.config?.command === 'build' || (context.config?.command === 'serve' && !states.get(context)?.entryMissing)
}
function deliversStyleEntry(context: MasterCSSVitePluginContext) {
  return context.config?.command === 'build' ? context.virtualCSSPlaceholderEmitted === true : sharesGlobalsWithStyleEntry(context)
}

/** Record whether a development server delivers a style entry; reports a change. */
export function setStyleEntryMissing(context: MasterCSSVitePluginContext, missing: boolean) {
  const state = sharedGlobalsState(context)
  if (Boolean(state.entryMissing) === missing) return false
  state.entryMissing = missing
  return true
}

/** Record whether `id` leaves its globals to the style entries; reports a change in what they must emit. */
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

function render(state: SharedGlobalsState, sources: readonly string[], emittedGlobals?: MasterCSSEmittedGlobals) {
  return renderStylesheetGlobals({ manifest: state.manifest!, css: [...new Set(sources)], emittedGlobals })
}

/** The globals local stylesheets left to the style entries, beyond those `emittedGlobals` already carry. */
export function renderSharedGlobals(context: MasterCSSVitePluginContext, emittedGlobals: Required<MasterCSSEmittedGlobals>) {
  const state = states.get(context)
  if (!state?.manifest || !state.sources.size || !deliversStyleEntry(context)) return
  const base = JSON.stringify(emittedGlobals)
  if (state.rendered?.revision !== state.revision || state.rendered.base !== base) {
    state.rendered = { revision: state.revision, base, ...render(state, [...state.sources.values()].flat(), emittedGlobals) }
  }
  return state.rendered
}

/** Remember what the style entries now carry, to refresh them only when it changes. */
export function markSharedGlobalsDelivered(context: MasterCSSVitePluginContext, base: Required<MasterCSSEmittedGlobals>, css: string) {
  sharedGlobalsState(context).delivered = { base, css }
}

export function sharedGlobalsStale(context: MasterCSSVitePluginContext) {
  const state = states.get(context)
  if (!state?.delivered) return false
  return (renderSharedGlobals(context, state.delivered.base)?.css ?? '') !== state.delivered.css
}

/** Without a delivered style entry in this build, a local stylesheet carries its own globals. */
export function renderLocalGlobals(context: MasterCSSVitePluginContext, id: string) {
  const state = states.get(context)
  const sources = state?.sources.get(id)
  if (!state?.manifest || !sources || deliversStyleEntry(context)) return
  return render(state, sources).css || undefined
}
