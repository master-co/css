import type { Plugin } from 'vite'
import { toEmittedGlobalsModule } from '@master/css-integration/emitted-globals-module'
import type { PluginContext } from '../core'
import { RESOLVED_VIRTUAL_EMITTED_GLOBALS_ID, VIRTUAL_EMITTED_GLOBALS_ID } from '../common'
import { getExtractedCSSResult } from '../utils/extracted-css'

export default function EmittedGlobalsVirtualModulePlugin(
  context: PluginContext
): Plugin {
  return {
    name: 'master-css:virtual-module:emitted-globals',
    enforce: 'pre',
    async resolveId(id) {
      if (id === VIRTUAL_EMITTED_GLOBALS_ID) return RESOLVED_VIRTUAL_EMITTED_GLOBALS_ID
    },
    async load(id) {
      if (id !== RESOLVED_VIRTUAL_EMITTED_GLOBALS_ID) return
      const result = await getExtractedCSSResult(context)
      return toEmittedGlobalsModule(result.emittedGlobals)
    }
  }
}
