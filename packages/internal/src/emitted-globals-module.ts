import type { MasterCSSEmittedGlobals } from '@master/css-schema/emitted-globals'

export type { MasterCSSEmittedGlobals }

export const VIRTUAL_EMITTED_GLOBALS_ID = 'virtual:master-css-emitted-globals'
export const VIRTUAL_EMITTED_GLOBALS_FILE = 'master-css-emitted-globals.js'
export const EMPTY_EMITTED_GLOBALS_MODULE = 'export default { variables: {}, keyframes: {}, keyframeSlots: [], suppressedKeyframes: [] };'

export function normalizeEmittedGlobals(emittedGlobals: MasterCSSEmittedGlobals = {}): Required<MasterCSSEmittedGlobals> {
  return {
    variables: emittedGlobals.variables || {},
    keyframes: emittedGlobals.keyframes || {},
    keyframeSlots: emittedGlobals.keyframeSlots || [],
    suppressedKeyframes: emittedGlobals.suppressedKeyframes || []
  }
}

export function toEmittedGlobalsModule(emittedGlobals: MasterCSSEmittedGlobals) {
  return `export default ${JSON.stringify(normalizeEmittedGlobals(emittedGlobals))};`
}

/** Count globals that separate stylesheet hosts emit, as runtime engines register them. */
export function mergeEmittedGlobals(...sources: MasterCSSEmittedGlobals[]): Required<MasterCSSEmittedGlobals> {
  const merged: Required<MasterCSSEmittedGlobals> = { variables: {}, keyframes: {}, keyframeSlots: [], suppressedKeyframes: [] }
  for (const source of sources) {
    for (const kind of ['variables', 'keyframes'] as const) {
      for (const [name, count] of Object.entries(source[kind] || {})) {
        if (count) merged[kind][name] = Math.min(0xffff_ffff, (merged[kind][name] || 0) + count)
      }
    }
    for (const kind of ['keyframeSlots', 'suppressedKeyframes'] as const) {
      for (const id of source[kind] || []) {
        if (!merged[kind].includes(id)) merged[kind].push(id)
      }
    }
  }
  return merged
}
