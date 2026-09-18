import { createHash } from 'node:crypto'
import type { MasterCSSStylesheetTransformResult } from '@master/css-compiler/stylesheet'
import type { MasterCSSVitePluginContext } from '../core'

export interface LocalStylesheet {
  slot: string
  result: MasterCSSStylesheetTransformResult
}
const states = new WeakMap<MasterCSSVitePluginContext, Map<string, LocalStylesheet>>()
export function localStylesheets(context: MasterCSSVitePluginContext) {
  let entries = states.get(context)
  if (!entries) { entries = new Map(); states.set(context, entries) }
  return entries
}
export function clearLocalStylesheets(context: MasterCSSVitePluginContext) { states.delete(context) }
export function registerLocalStylesheet(context: MasterCSSVitePluginContext, id: string, result: MasterCSSStylesheetTransformResult) {
  const hash = createHash('sha256').update(id).digest('hex').slice(0, 20)
  // Distinct identifiers prevent merging and numeric-token normalization.
  const slot = `#master-css-local-${hash}{--slot:local-${hash}}`
  localStylesheets(context).set(id, { slot, result })
  return slot
}
