import type { MasterCSSEmittedGlobals } from '@master/css-schema/emitted-globals'

export type { MasterCSSEmittedGlobals }

export const VIRTUAL_EMITTED_GLOBALS_ID = 'virtual:master-css-emitted-globals'
export const VIRTUAL_EMITTED_GLOBALS_FILE = 'master-css-emitted-globals.js'
export const EMPTY_EMITTED_GLOBALS_MODULE = 'export default { variables: {}, animations: {} };'

export function normalizeEmittedGlobals(emittedGlobals: MasterCSSEmittedGlobals = {}): Required<MasterCSSEmittedGlobals> {
  return {
    variables: emittedGlobals.variables || {},
    animations: emittedGlobals.animations || {}
  }
}

export function toEmittedGlobalsModule(emittedGlobals: MasterCSSEmittedGlobals) {
  return `export default ${JSON.stringify(normalizeEmittedGlobals(emittedGlobals))};`
}
